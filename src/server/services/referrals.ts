// Program referal (DECISIONS 2026-10-24). Komisi dicatat per order lunas (dipanggil dari
// billing.applyPaymentUpdate di transaksi yang sama); transfer dilakukan admin di luar sistem
// lalu dicatat di sini (referral_payouts).

import { and, count, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { PLACEHOLDER_EMAIL_DOMAIN } from "@/lib/identity";
import { commissionAmount, generateReferralCode, LATE_REFERRAL_DAYS, maskName, normalizeReferralCode, type PayoutAccountInput } from "@/lib/referral";
import { db } from "@/server/db";
import { orders, referralAccounts, referralCommissions, referralPayouts, users } from "@/server/db/schema";
import { getSetting } from "@/server/services/app-settings";

type Executor = Pick<typeof db, "select" | "insert" | "update">;
type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

/** Kode referal → id pemilik (null bila tidak ada). */
export async function findReferrerByCode(raw: unknown): Promise<number | null> {
  const code = normalizeReferralCode(raw);
  if (!code) return null;
  const [row] = await db.select({ id: users.id }).from(users).where(eq(users.referralCode, code));
  return row?.id ?? null;
}

/** Kode unik baru (cek tabrakan ke DB). */
export async function newUniqueReferralCode(): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const code = generateReferralCode();
    const [taken] = await db.select({ id: users.id }).from(users).where(eq(users.referralCode, code));
    if (!taken) return code;
  }
  throw new Error("Gagal membuat kode referal unik.");
}

/** Kode milik user; akun lama dibuatkan saat pertama dibutuhkan. */
export async function ensureReferralCode(userId: number): Promise<string> {
  const [u] = await db.select({ code: users.referralCode }).from(users).where(eq(users.id, userId));
  if (u?.code) return u.code;
  for (let i = 0; i < 3; i++) {
    const code = await newUniqueReferralCode();
    try {
      await db.update(users).set({ referralCode: code }).where(and(eq(users.id, userId), isNull(users.referralCode)));
      const [after] = await db.select({ code: users.referralCode }).from(users).where(eq(users.id, userId));
      if (after?.code) return after.code;
    } catch {
      // tabrakan unik (sangat jarang) → coba kode lain
    }
  }
  throw new Error("Gagal membuat kode referal.");
}

export async function commissionPercent() {
  return getSetting("referral.commissionPercent");
}

/** Catat komisi untuk order yang baru lunas (idempoten: unik per order). */
export async function recordCommissionForOrder(tx: Executor, order: { id: number; userId: number; amount: number }) {
  const [buyer] = await tx.select({ referrer: users.referredByUserId }).from(users).where(eq(users.id, order.userId));
  if (!buyer?.referrer || buyer.referrer === order.userId) return;
  const [existing] = await tx.select({ id: referralCommissions.id }).from(referralCommissions).where(eq(referralCommissions.orderId, order.id));
  if (existing) return;
  const percent = await commissionPercent();
  const amount = commissionAmount(order.amount, percent);
  if (amount <= 0) return;
  await tx.insert(referralCommissions).values({ referrerUserId: buyer.referrer, referredUserId: order.userId, orderId: order.id, orderAmount: order.amount, percent, amount });
}

/** Order dikembalikan (refund) → komisi yang belum ditransfer dibatalkan. */
export async function voidCommissionForOrder(tx: Executor, orderId: number) {
  await tx.update(referralCommissions).set({ status: "void" }).where(and(eq(referralCommissions.orderId, orderId), eq(referralCommissions.status, "pending")));
}

/** User baru (≤ LATE_REFERRAL_DAYS hari, belum pernah membayar, belum punya pemberi referal) boleh mengisi kode teman. */
export async function canEnterReferralCode(userId: number) {
  const [u] = await db.select({ referredBy: users.referredByUserId, createdAt: users.createdAt }).from(users).where(eq(users.id, userId));
  if (!u || u.referredBy) return false;
  if (Date.now() - u.createdAt.getTime() > LATE_REFERRAL_DAYS * 86_400_000) return false;
  const [paid] = await db.select({ n: count() }).from(orders).where(and(eq(orders.userId, userId), eq(orders.status, "paid")));
  return Number(paid?.n ?? 0) === 0;
}

export async function setLateReferral(userId: number, raw: string): Promise<Result> {
  if (!(await canEnterReferralCode(userId))) return { ok: false, error: "Kode referal hanya bisa diisi oleh akun baru yang belum pernah membayar." };
  const referrer = await findReferrerByCode(raw);
  if (!referrer) return { ok: false, error: "Kode referal tidak ditemukan." };
  if (referrer === userId) return { ok: false, error: "Tidak bisa memakai kode referal sendiri." };
  await db.update(users).set({ referredByUserId: referrer }).where(and(eq(users.id, userId), isNull(users.referredByUserId)));
  return { ok: true };
}

export async function savePayoutAccount(userId: number, input: PayoutAccountInput) {
  await db
    .insert(referralAccounts)
    .values({ userId, ...input })
    .onDuplicateKeyUpdate({ set: { bankName: input.bankName, accountNumber: input.accountNumber, accountName: input.accountName } });
}

const sumWhere = (status: "pending" | "paid") => sql<number>`coalesce(sum(case when ${referralCommissions.status} = ${status} then ${referralCommissions.amount} end), 0)`;

/** Data halaman Referal milik user. */
export async function getReferralDashboard(userId: number) {
  const code = await ensureReferralCode(userId);
  const [referred, commissions, payouts, [account], [me], canEnter, percent] = await Promise.all([
    db
      .select({ id: users.id, name: users.name, createdAt: users.createdAt })
      .from(users)
      .where(eq(users.referredByUserId, userId))
      .orderBy(desc(users.createdAt))
      .limit(200),
    db
      .select({ c: referralCommissions, name: users.name })
      .from(referralCommissions)
      .innerJoin(users, eq(users.id, referralCommissions.referredUserId))
      .where(eq(referralCommissions.referrerUserId, userId))
      .orderBy(desc(referralCommissions.createdAt))
      .limit(200),
    db.select().from(referralPayouts).where(eq(referralPayouts.referrerUserId, userId)).orderBy(desc(referralPayouts.createdAt)).limit(50),
    db.select().from(referralAccounts).where(eq(referralAccounts.userId, userId)),
    db.select({ referredBy: users.referredByUserId }).from(users).where(eq(users.id, userId)),
    canEnterReferralCode(userId),
    commissionPercent(),
  ]);
  const buyers = new Set(commissions.filter(({ c }) => c.status !== "void").map(({ c }) => c.referredUserId));
  const total = (s: "pending" | "paid") => commissions.filter(({ c }) => c.status === s).reduce((n, { c }) => n + c.amount, 0);
  return {
    code,
    percent,
    canEnterCode: canEnter,
    hasReferrer: Boolean(me?.referredBy),
    stats: { referred: referred.length, buyers: buyers.size, pending: total("pending"), paid: total("paid") },
    referred: referred.map((r) => ({ name: maskName(r.name), joinedAt: r.createdAt.toISOString(), bought: buyers.has(r.id) })),
    commissions: commissions.map(({ c, name }) => ({ id: c.id, name: maskName(name), orderAmount: c.orderAmount, percent: c.percent, amount: c.amount, status: c.status, createdAt: c.createdAt.toISOString(), paidAt: c.paidAt?.toISOString() ?? null })),
    payouts: payouts.map((p) => ({ id: p.id, amount: p.amount, note: p.note, createdAt: p.createdAt.toISOString() })),
    account: account ? { bankName: account.bankName, accountNumber: account.accountNumber, accountName: account.accountName } : null,
  };
}

const contact = sql<string>`CASE WHEN ${users.email} LIKE ${`%@${PLACEHOLDER_EMAIL_DOMAIN}`} THEN CONCAT('@', ${users.username}) ELSE ${users.email} END`;

export type AdminReferrerRow = {
  userId: number;
  name: string;
  contact: string;
  phone: string | null;
  code: string | null;
  referred: number;
  buyers: number;
  pending: number;
  paid: number;
  account: { bankName: string; accountNumber: string; accountName: string } | null;
  referredUsers: { name: string; contact: string; joinedAt: string; bought: boolean }[];
  commissions: { name: string; orderAmount: number; amount: number; status: string; createdAt: string }[];
};

/** Admin: semua pemberi referal (punya ≥1 pendaftar), yang belum ditransfer terbesar dulu. */
export async function listReferrersAdmin() {
  const referredCounts = await db
    .select({ referrer: users.referredByUserId, n: count() })
    .from(users)
    .where(sql`${users.referredByUserId} is not null`)
    .groupBy(users.referredByUserId);
  const ids = referredCounts.map((r) => r.referrer!).filter(Boolean);
  if (ids.length === 0) return { rows: [] as AdminReferrerRow[], totals: { referrers: 0, referred: 0, pending: 0, paid: 0 }, percent: await commissionPercent() };

  const [people, sums, accounts, referredUsers, comms, percent] = await Promise.all([
    db.select({ id: users.id, name: users.name, contact, phone: users.phone, code: users.referralCode }).from(users).where(inArray(users.id, ids)),
    db
      .select({ referrer: referralCommissions.referrerUserId, pending: sumWhere("pending"), paid: sumWhere("paid"), buyers: sql<number>`count(distinct case when ${referralCommissions.status} <> 'void' then ${referralCommissions.referredUserId} end)` })
      .from(referralCommissions)
      .where(inArray(referralCommissions.referrerUserId, ids))
      .groupBy(referralCommissions.referrerUserId),
    db.select().from(referralAccounts).where(inArray(referralAccounts.userId, ids)),
    db.select({ id: users.id, referrer: users.referredByUserId, name: users.name, contact, createdAt: users.createdAt }).from(users).where(inArray(users.referredByUserId, ids)).orderBy(desc(users.createdAt)),
    db
      .select({ c: referralCommissions, name: users.name })
      .from(referralCommissions)
      .innerJoin(users, eq(users.id, referralCommissions.referredUserId))
      .where(inArray(referralCommissions.referrerUserId, ids))
      .orderBy(desc(referralCommissions.createdAt)),
    commissionPercent(),
  ]);
  const countOf = new Map(referredCounts.map((r) => [r.referrer!, Number(r.n)]));
  const sumOf = new Map(sums.map((s) => [s.referrer, s]));
  const accountOf = new Map(accounts.map((a) => [a.userId, a]));
  const boughtIds = new Set(comms.filter(({ c }) => c.status !== "void").map(({ c }) => c.referredUserId));
  const rows: AdminReferrerRow[] = people.map((p) => {
    const s = sumOf.get(p.id);
    const a = accountOf.get(p.id);
    return {
      userId: p.id,
      name: p.name,
      contact: p.contact,
      phone: p.phone,
      code: p.code,
      referred: countOf.get(p.id) ?? 0,
      buyers: Number(s?.buyers ?? 0),
      pending: Number(s?.pending ?? 0),
      paid: Number(s?.paid ?? 0),
      account: a ? { bankName: a.bankName, accountNumber: a.accountNumber, accountName: a.accountName } : null,
      referredUsers: referredUsers.filter((r) => r.referrer === p.id).map((r) => ({ name: r.name, contact: r.contact, joinedAt: r.createdAt.toISOString(), bought: boughtIds.has(r.id) })),
      commissions: comms.filter(({ c }) => c.referrerUserId === p.id).map(({ c, name }) => ({ name, orderAmount: c.orderAmount, amount: c.amount, status: c.status, createdAt: c.createdAt.toISOString() })),
    };
  });
  rows.sort((a, b) => b.pending - a.pending || b.referred - a.referred);
  return {
    rows,
    percent,
    totals: { referrers: rows.length, referred: rows.reduce((n, r) => n + r.referred, 0), pending: rows.reduce((n, r) => n + r.pending, 0), paid: rows.reduce((n, r) => n + r.paid, 0) },
  };
}

/** Admin sudah mentransfer semua komisi pending milik `referrerId` → catat & tandai lunas. */
export async function recordPayout(adminId: number, referrerId: number, note: string | null): Promise<Result<{ amount: number }>> {
  return db.transaction(async (tx) => {
    const pending = await tx
      .select({ id: referralCommissions.id, amount: referralCommissions.amount })
      .from(referralCommissions)
      .where(and(eq(referralCommissions.referrerUserId, referrerId), eq(referralCommissions.status, "pending")));
    const amount = pending.reduce((n, c) => n + c.amount, 0);
    if (amount <= 0) return { ok: false as const, error: "Tidak ada komisi yang belum dibayar." };
    const [acc] = await tx.select().from(referralAccounts).where(eq(referralAccounts.userId, referrerId));
    const destination = acc ? `${acc.bankName} ${acc.accountNumber} a.n. ${acc.accountName}`.slice(0, 200) : null;
    const [{ id }] = await tx.insert(referralPayouts).values({ referrerUserId: referrerId, amount, destination, note, createdBy: adminId }).$returningId();
    await tx
      .update(referralCommissions)
      .set({ status: "paid", payoutId: id, paidAt: new Date() })
      .where(inArray(referralCommissions.id, pending.map((c) => c.id)));
    return { ok: true as const, amount };
  });
}
