// Guru afiliasi (DECISIONS 2026-11-13). Admin menambah guru lewat email; email yang sudah punya
// akun langsung aktif, selain itu berstatus "diundang" dan aktif otomatis saat guru mendaftar.
// Afiliasi aktif = kode guru berlaku + Premium gratis semua jenjang. Komisi dicatat di
// referrals.recordCommissionForOrder (pembelian pertama siswa saja).

import { and, count, desc, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import type { AddAffiliateInput } from "@/lib/affiliate";
import { PLACEHOLDER_EMAIL_DOMAIN } from "@/lib/identity";
import { maskName } from "@/lib/referral";
import { db } from "@/server/db";
import { affiliates, memberships, orders, referralAccounts, referralCommissions, referralPayouts, users, type AffiliateStatus } from "@/server/db/schema";
import { getSetting } from "./app-settings";
import { membershipWindow } from "./doku-core";
import { ensureReferralCode } from "./referrals";

type Executor = Pick<typeof db, "select" | "insert" | "update">;
type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

export type AffiliateRow = typeof affiliates.$inferSelect;

/** Afiliasi milik user (status apa pun); null bila bukan guru afiliasi. */
export async function affiliateOfUser(userId: number, exec: Executor = db): Promise<AffiliateRow | null> {
  const [row] = await exec.select().from(affiliates).where(eq(affiliates.userId, userId));
  return row ?? null;
}

export async function isActiveAffiliate(userId: number) {
  return (await affiliateOfUser(userId))?.status === "active";
}

/** Premium gratis semua jenjang tanpa batas waktu selama afiliasi aktif (sekali, tidak ditumpuk). */
async function grantAffiliatePremium(tx: Executor, userId: number, adminId: number | null) {
  const [existing] = await tx
    .select({ id: memberships.id })
    .from(memberships)
    .where(and(eq(memberships.userId, userId), eq(memberships.grantedBy, "affiliate"), isNull(memberships.revokedAt)));
  if (existing) return;
  await tx.insert(memberships).values({ userId, jenjang: null, ...membershipWindow(new Date(), null, null), grantedBy: "affiliate", grantedByUserId: adminId });
}

async function revokeAffiliatePremium(tx: Executor, userId: number) {
  await tx
    .update(memberships)
    .set({ revokedAt: new Date() })
    .where(and(eq(memberships.userId, userId), eq(memberships.grantedBy, "affiliate"), isNull(memberships.revokedAt)));
}

/** Admin menambah guru. Email sudah terdaftar → langsung aktif; belum → diundang. */
export async function addAffiliate(adminId: number, input: AddAffiliateInput): Promise<Result<{ status: AffiliateStatus }>> {
  const [dup] = await db.select({ id: affiliates.id }).from(affiliates).where(eq(affiliates.email, input.email));
  if (dup) return { ok: false, error: "Email ini sudah terdaftar sebagai afiliasi." };
  const [user] = await db.select({ id: users.id, role: users.role }).from(users).where(sql`lower(${users.email}) = ${input.email}`);
  if (user?.role === "admin") return { ok: false, error: "Akun admin tidak bisa menjadi afiliasi." };
  if (user && (await affiliateOfUser(user.id))) return { ok: false, error: "Akun ini sudah menjadi afiliasi." };

  const values = { ...input, commissionPercent: input.commissionPercent ?? null, invitedBy: adminId };
  if (!user) {
    await db.insert(affiliates).values({ ...values, status: "invited" });
    return { ok: true, status: "invited" };
  }
  await db.transaction(async (tx) => {
    await tx.insert(affiliates).values({ ...values, userId: user.id, status: "active", activatedAt: new Date() });
    await grantAffiliatePremium(tx, user.id, adminId);
  });
  await ensureReferralCode(user.id);
  return { ok: true, status: "active" };
}

/** Dipanggil setelah akun baru dibuat (email/Google): undangan dengan email yang sama → aktif. Tidak melempar error. */
export async function activateInvitedAffiliate(userId: number, email: string) {
  try {
    const normalized = email.trim().toLowerCase();
    const [invite] = await db
      .select({ id: affiliates.id, invitedBy: affiliates.invitedBy })
      .from(affiliates)
      .where(and(eq(affiliates.email, normalized), eq(affiliates.status, "invited"), isNull(affiliates.userId)));
    if (!invite) return;
    await db.transaction(async (tx) => {
      await tx.update(affiliates).set({ userId, status: "active", activatedAt: new Date() }).where(eq(affiliates.id, invite.id));
      // Guru tidak ikut menjadi "siswa referal" guru lain.
      await tx.update(users).set({ referredByUserId: null }).where(eq(users.id, userId));
      await grantAffiliatePremium(tx, userId, invite.invitedBy);
    });
    await ensureReferralCode(userId);
  } catch (e) {
    console.error("[affiliate] aktivasi undangan gagal", e);
  }
}

export async function setAffiliateStatus(adminId: number, id: number, status: "active" | "suspended"): Promise<Result> {
  const [a] = await db.select().from(affiliates).where(eq(affiliates.id, id));
  if (!a) return { ok: false, error: "Afiliasi tidak ditemukan." };
  if (!a.userId) return { ok: false, error: "Guru belum mendaftar — tunggu sampai akunnya dibuat." };
  const userId = a.userId;
  await db.transaction(async (tx) => {
    await tx.update(affiliates).set({ status, ...(status === "active" && !a.activatedAt && { activatedAt: new Date() }) }).where(eq(affiliates.id, id));
    if (status === "active") await grantAffiliatePremium(tx, userId, adminId);
    else await revokeAffiliatePremium(tx, userId);
  });
  return { ok: true };
}

/** Ganti kode acak guru dengan kode khusus (unik di semua user). */
export async function setAffiliateCode(id: number, code: string): Promise<Result> {
  const [a] = await db.select({ userId: affiliates.userId }).from(affiliates).where(eq(affiliates.id, id));
  if (!a?.userId) return { ok: false, error: "Guru belum mendaftar — kode bisa diatur setelah akunnya dibuat." };
  const [taken] = await db.select({ id: users.id }).from(users).where(and(eq(users.referralCode, code), ne(users.id, a.userId)));
  if (taken) return { ok: false, error: `Kode ${code} sudah dipakai akun lain.` };
  await db.update(users).set({ referralCode: code }).where(eq(users.id, a.userId));
  return { ok: true };
}

export async function updateAffiliate(id: number, patch: { commissionPercent: number | null; school: string | null; phone: string | null; note: string | null }) {
  await db.update(affiliates).set(patch).where(eq(affiliates.id, id));
}

export async function deleteAffiliateInvite(id: number): Promise<Result> {
  const [a] = await db.select({ status: affiliates.status }).from(affiliates).where(eq(affiliates.id, id));
  if (!a) return { ok: false, error: "Afiliasi tidak ditemukan." };
  if (a.status !== "invited") return { ok: false, error: "Hanya undangan yang belum dipakai yang bisa dihapus. Nonaktifkan saja afiliasi aktif." };
  await db.delete(affiliates).where(eq(affiliates.id, id));
  return { ok: true };
}

/**
 * Diskon pembelian pertama: user mendaftar dengan kode guru afiliasi AKTIF dan belum pernah
 * membayar. Null bila tidak berhak.
 */
export async function affiliatePromoFor(userId: number): Promise<{ percent: number; teacherName: string } | null> {
  const [me] = await db.select({ referrer: users.referredByUserId }).from(users).where(eq(users.id, userId));
  if (!me?.referrer || me.referrer === userId) return null;
  const [teacher] = await db
    .select({ name: users.name })
    .from(affiliates)
    .innerJoin(users, eq(users.id, affiliates.userId))
    .where(and(eq(affiliates.userId, me.referrer), eq(affiliates.status, "active")));
  if (!teacher) return null;
  const [paid] = await db.select({ n: count() }).from(orders).where(and(eq(orders.userId, userId), eq(orders.status, "paid")));
  if (Number(paid?.n ?? 0) > 0) return null;
  const percent = await getSetting("affiliate.buyerDiscountPercent");
  return percent > 0 ? { percent, teacherName: teacher.name } : null;
}

export async function affiliateCommissionPercent(a: Pick<AffiliateRow, "commissionPercent">) {
  return a.commissionPercent ?? (await getSetting("affiliate.commissionPercent"));
}

type CommissionRow = typeof referralCommissions.$inferSelect;

/** Pisahkan komisi pending: siap cair (masa tahan lewat) vs masih ditahan. */
export function splitCommissions(rows: Pick<CommissionRow, "status" | "amount" | "availableAt">[], now = new Date()) {
  let available = 0,
    held = 0,
    paid = 0;
  for (const c of rows) {
    if (c.status === "paid") paid += c.amount;
    else if (c.status === "pending") {
      if (!c.availableAt || c.availableAt <= now) available += c.amount;
      else held += c.amount;
    }
  }
  return { available, held, paid };
}

/** Data halaman /afiliasi milik guru. Null bila user bukan afiliasi. */
export async function getAffiliateDashboard(userId: number) {
  const affiliate = await affiliateOfUser(userId);
  if (!affiliate) return null;
  const code = await ensureReferralCode(userId);
  const [referred, commissions, payouts, [account], percent, discount] = await Promise.all([
    db.select({ id: users.id, name: users.name, createdAt: users.createdAt }).from(users).where(eq(users.referredByUserId, userId)).orderBy(desc(users.createdAt)).limit(300),
    db
      .select({ c: referralCommissions, name: users.name })
      .from(referralCommissions)
      .innerJoin(users, eq(users.id, referralCommissions.referredUserId))
      .where(eq(referralCommissions.referrerUserId, userId))
      .orderBy(desc(referralCommissions.createdAt))
      .limit(300),
    db.select().from(referralPayouts).where(eq(referralPayouts.referrerUserId, userId)).orderBy(desc(referralPayouts.createdAt)).limit(50),
    db.select().from(referralAccounts).where(eq(referralAccounts.userId, userId)),
    affiliateCommissionPercent(affiliate),
    getSetting("affiliate.buyerDiscountPercent"),
  ]);
  const buyers = new Set(commissions.filter(({ c }) => c.status !== "void").map(({ c }) => c.referredUserId));
  return {
    code,
    status: affiliate.status,
    percent,
    discount,
    stats: { referred: referred.length, buyers: buyers.size, ...splitCommissions(commissions.map(({ c }) => c)) },
    referred: referred.map((r) => ({ name: maskName(r.name), joinedAt: r.createdAt.toISOString(), bought: buyers.has(r.id) })),
    commissions: commissions.map(({ c, name }) => ({
      id: c.id,
      name: maskName(name),
      orderAmount: c.orderAmount,
      percent: c.percent,
      amount: c.amount,
      status: c.status,
      availableAt: c.availableAt?.toISOString() ?? null,
      createdAt: c.createdAt.toISOString(),
    })),
    payouts: payouts.map((p) => ({ id: p.id, amount: p.amount, note: p.note, createdAt: p.createdAt.toISOString() })),
    account: account ? { bankName: account.bankName, accountNumber: account.accountNumber, accountName: account.accountName } : null,
  };
}

const contact = sql<string>`CASE WHEN ${users.email} LIKE ${`%@${PLACEHOLDER_EMAIL_DOMAIN}`} THEN CONCAT('@', ${users.username}) ELSE ${users.email} END`;

export type AdminAffiliateRow = {
  id: number;
  email: string;
  name: string;
  school: string | null;
  phone: string | null;
  note: string | null;
  status: AffiliateStatus;
  userId: number | null;
  code: string | null;
  commissionPercent: number | null;
  createdAt: string;
  activatedAt: string | null;
  referred: number;
  buyers: number;
  revenue: number;
  available: number;
  held: number;
  paid: number;
  account: { bankName: string; accountNumber: string; accountName: string } | null;
  students: { name: string; contact: string; joinedAt: string; bought: boolean }[];
};

/** Admin: semua guru afiliasi + statistik; siap cair terbesar dulu. */
export async function listAffiliatesAdmin() {
  const rows = await db
    .select({ a: affiliates, code: users.referralCode, userName: users.name, userPhone: users.phone })
    .from(affiliates)
    .leftJoin(users, eq(users.id, affiliates.userId))
    .orderBy(desc(affiliates.createdAt));
  const ids = rows.map((r) => r.a.userId).filter((v): v is number => v != null);
  const [students, comms, accounts, defaultPercent, discount] = await Promise.all([
    ids.length
      ? db.select({ id: users.id, referrer: users.referredByUserId, name: users.name, contact, createdAt: users.createdAt }).from(users).where(inArray(users.referredByUserId, ids)).orderBy(desc(users.createdAt))
      : Promise.resolve([]),
    ids.length ? db.select().from(referralCommissions).where(inArray(referralCommissions.referrerUserId, ids)) : Promise.resolve([]),
    ids.length ? db.select().from(referralAccounts).where(inArray(referralAccounts.userId, ids)) : Promise.resolve([]),
    getSetting("affiliate.commissionPercent"),
    getSetting("affiliate.buyerDiscountPercent"),
  ]);
  const accountOf = new Map(accounts.map((a) => [a.userId, a]));
  const result: AdminAffiliateRow[] = rows.map(({ a, code, userName, userPhone }) => {
    const mine = a.userId == null ? [] : comms.filter((c) => c.referrerUserId === a.userId);
    const live = mine.filter((c) => c.status !== "void");
    const bought = new Set(live.map((c) => c.referredUserId));
    const acc = a.userId == null ? undefined : accountOf.get(a.userId);
    const studs = a.userId == null ? [] : students.filter((s) => s.referrer === a.userId);
    return {
      id: a.id,
      email: a.email,
      name: userName ?? a.name,
      school: a.school,
      phone: a.phone ?? userPhone ?? null,
      note: a.note,
      status: a.status,
      userId: a.userId,
      code: code ?? null,
      commissionPercent: a.commissionPercent,
      createdAt: a.createdAt.toISOString(),
      activatedAt: a.activatedAt?.toISOString() ?? null,
      referred: studs.length,
      buyers: bought.size,
      revenue: live.reduce((n, c) => n + c.orderAmount, 0),
      ...splitCommissions(mine),
      account: acc ? { bankName: acc.bankName, accountNumber: acc.accountNumber, accountName: acc.accountName } : null,
      students: studs.map((s) => ({ name: s.name, contact: s.contact, joinedAt: s.createdAt.toISOString(), bought: bought.has(s.id) })),
    };
  });
  result.sort((x, y) => y.available - x.available || y.referred - x.referred);
  const sum = (k: "referred" | "buyers" | "available" | "held" | "paid") => result.reduce((n, r) => n + r[k], 0);
  return {
    rows: result,
    defaultPercent,
    discount,
    totals: { affiliates: result.filter((r) => r.status === "active").length, referred: sum("referred"), buyers: sum("buyers"), available: sum("available"), held: sum("held"), paid: sum("paid") },
  };
}

/** Semua komisi afiliasi untuk CSV admin. */
export async function affiliateCommissionsForExport() {
  const teacher = sql<string>`(select ${affiliates.name} from ${affiliates} where ${affiliates.userId} = ${referralCommissions.referrerUserId})`;
  return db
    .select({ c: referralCommissions, student: users.name, teacher, orderCode: orders.orderCode })
    .from(referralCommissions)
    .innerJoin(users, eq(users.id, referralCommissions.referredUserId))
    .innerJoin(orders, eq(orders.id, referralCommissions.orderId))
    .where(sql`${referralCommissions.referrerUserId} in (select ${affiliates.userId} from ${affiliates} where ${affiliates.userId} is not null)`)
    .orderBy(desc(referralCommissions.createdAt));
}
