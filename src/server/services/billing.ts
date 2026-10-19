// Langganan Premium & pembayaran (Xendit Invoice, Midtrans Snap, atau DOKU Checkout — lihat
// payment-provider.ts). Satu-satunya tempat yang mengubah status order & membuat
// membership dari pembayaran.

import { randomBytes } from "node:crypto";
import { and, asc, desc, eq, gt, isNull, like, lt, or, sql } from "drizzle-orm";
import { visibleEmail } from "@/lib/identity";
import { pickUniqueCode } from "@/lib/manual-payment";
import { db } from "@/server/db";
import { memberships, orders, plans, users, type JenjangCode, type OrderStatus } from "@/server/db/schema";
import { createCheckout, DokuError, getOrderStatus } from "./doku";
import { mapDokuStatus, membershipWindow, nextOrderStatus, type DokuStatus } from "./doku-core";
import { createSnapTransaction, getTransactionStatus, MidtransError } from "./midtrans";
import { mapMidtransStatus, type MidtransPayload } from "./midtrans-core";
import { MANUAL_ORDER_PREFIX, ORDER_PREFIX, paymentAvailability, paymentMethodOptions, providerOfOrder } from "./payment-provider";
import { createInvoice, getInvoiceByExternalId, XenditError } from "./xendit";
import { mapXenditStatus, type XenditInvoice } from "./xendit-core";

const isProviderError = (e: unknown) => e instanceof DokuError || e instanceof MidtransError || e instanceof XenditError;

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

export type PlanRow = typeof plans.$inferSelect;

export async function listPlans(opts: { activeOnly: boolean; jenjang?: string | null }) {
  const rows = await db.select().from(plans).orderBy(asc(plans.sortOrder), asc(plans.price));
  return rows.filter((p) => (!opts.activeOnly || p.isActive) && (opts.jenjang == null || p.jenjang == null || p.jenjang === opts.jenjang));
}

/** Membership aktif yang mencakup `jenjang` (atau semua jenjang), masa berakhir paling akhir. */
export async function getActiveMembership(userId: number, jenjang: string | null) {
  const now = new Date();
  const rows = await db
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.userId, userId),
        isNull(memberships.revokedAt),
        or(isNull(memberships.endsAt), gt(memberships.endsAt, now)),
      ),
    );
  const covering = rows.filter((m) => m.jenjang == null || jenjang == null || m.jenjang === jenjang);
  if (covering.length === 0) return null;
  return covering.sort((a, b) => (a.endsAt == null ? -1 : b.endsAt == null ? 1 : b.endsAt.getTime() - a.endsAt.getTime()))[0];
}

/** Premium aktif untuk jenjang itu? Admin selalu dianggap premium. */
export async function hasPremium(user: { id: number; role?: string | null }, jenjang: string | null) {
  if (user.role === "admin") return true;
  return (await getActiveMembership(user.id, jenjang)) != null;
}

function newOrderCode(userId: number, prefix: string) {
  return `${prefix}${userId}-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

/**
 * Buat order + halaman bayar sesuai cara bayar pilihan siswa (`methodId` dari
 * paymentMethodOptions; kosong = metode utama). Gateway (Xendit/Midtrans/DOKU) → URL halaman
 * bayar penyedia; "manual" → halaman QRIS manual kita.
 */
export async function createOrder(
  user: { id: number; name: string; email: string; role?: string | null; jenjang: string | null },
  planId: number,
  siteUrl: string,
  methodId?: string,
): Promise<Result<{ redirectUrl: string; orderCode: string }>> {
  const [plan] = await db.select().from(plans).where(eq(plans.id, planId));
  if (!plan || !plan.isActive) return { ok: false, error: "Paket langganan tidak tersedia." };
  if (plan.jenjang && plan.jenjang !== user.jenjang) return { ok: false, error: `Paket ini untuk jenjang ${plan.jenjang}.` };
  if (plan.price < 1000) return { ok: false, error: "Harga paket belum valid." };
  const pay = paymentAvailability(user);
  if (!pay.configured) return { ok: false, error: "Pembayaran belum tersedia. Hubungi admin." };
  if (!pay.canPay) return { ok: false, error: "Pembayaran online sedang dalam tahap uji coba dan segera dibuka. Hubungi admin untuk aktivasi Premium." };

  const options = paymentMethodOptions(pay.provider);
  const method = methodId ? options.find((o) => o.id === methodId) : (options.find((o) => o.primary) ?? options[0]);
  if (!method) return { ok: false, error: "Metode pembayaran tidak tersedia. Pilih metode lain." };
  if (method.id === "manual") return createManualOrder(user.id, plan, siteUrl);

  const orderCode = newOrderCode(user.id, ORDER_PREFIX[pay.provider]);
  const finishUrl = `${siteUrl.replace(/\/$/, "")}/langganan/selesai?order_id=${encodeURIComponent(orderCode)}`;
  const [{ id }] = await db
    .insert(orders)
    .values({ orderCode, userId: user.id, planId: plan.id, planName: plan.name, jenjang: plan.jenjang, durationDays: plan.durationDays, amount: plan.price })
    .$returningId();
  try {
    const customer = { name: user.name, email: visibleEmail(user.email) ?? undefined };
    const url =
      pay.provider === "xendit"
        ? (
            await createInvoice({
              orderCode,
              amount: plan.price,
              itemName: plan.name,
              customer,
              successUrl: finishUrl,
              failureUrl: finishUrl,
            })
          ).invoiceUrl
        : pay.provider === "midtrans"
        ? (
            await createSnapTransaction({
              orderCode,
              amount: plan.price,
              itemName: plan.name,
              customer,
              finishUrl,
            })
          ).redirectUrl
        : (
            await createCheckout({
              invoiceNumber: orderCode,
              amount: plan.price,
              itemName: plan.name,
              customer: { id: String(user.id), name: user.name, email: visibleEmail(user.email) ?? undefined },
              callbackUrl: finishUrl,
              channels: method.channels,
            })
          ).url;
    await db.update(orders).set({ redirectUrl: url, paymentType: method.id }).where(eq(orders.id, id));
    return { ok: true, redirectUrl: url, orderCode };
  } catch (e) {
    await db.update(orders).set({ status: "failed" }).where(eq(orders.id, id));
    return { ok: false, error: isProviderError(e) ? (e as Error).message : "Gagal membuat transaksi." };
  }
}

/** Order manual menunggu bukti transfer selama ini; setelahnya kode unik bisa dipakai order lain. */
const MANUAL_ORDER_TTL_MS = 3 * 86_400_000;

export function manualPaymentPath(orderCode: string) {
  return `/langganan/bayar/${encodeURIComponent(orderCode)}`;
}

/**
 * Order QRIS manual: nominal = harga + kode unik (1–999) yang tidak bentrok dengan
 * order manual lain yang masih menunggu. Order menunggu untuk paket yang sama dipakai ulang
 * agar siswa tidak mendapat kode berbeda tiap klik.
 */
async function createManualOrder(userId: number, plan: PlanRow, siteUrl: string): Promise<Result<{ redirectUrl: string; orderCode: string }>> {
  const since = new Date(Date.now() - MANUAL_ORDER_TTL_MS);
  const pendingManual = await db
    .select({ orderCode: orders.orderCode, userId: orders.userId, planId: orders.planId, amount: orders.amount })
    .from(orders)
    .where(and(eq(orders.status, "pending"), like(orders.orderCode, `${MANUAL_ORDER_PREFIX}%`), gt(orders.createdAt, since)));
  const reuse = pendingManual.find((o) => o.userId === userId && o.planId === plan.id && o.amount > plan.price && o.amount <= plan.price + 999);
  if (reuse) return { ok: true, orderCode: reuse.orderCode, redirectUrl: manualPaymentPath(reuse.orderCode) };

  const code = pickUniqueCode(plan.price, pendingManual.map((o) => o.amount));
  if (code == null) return { ok: false, error: "Antrean pembayaran sedang penuh. Coba lagi beberapa saat atau hubungi admin." };
  const orderCode = newOrderCode(userId, MANUAL_ORDER_PREFIX);
  const redirectUrl = manualPaymentPath(orderCode);
  await db.insert(orders).values({
    orderCode,
    userId,
    planId: plan.id,
    planName: plan.name,
    jenjang: plan.jenjang,
    durationDays: plan.durationDays,
    amount: plan.price + code,
    paymentType: "qris_manual",
    redirectUrl: `${siteUrl.replace(/\/$/, "")}${redirectUrl}`,
    lastPayload: { uniqueCode: code, basePrice: plan.price },
  });
  return { ok: true, orderCode, redirectUrl };
}

/** Admin mengonfirmasi (lunas) atau membatalkan order QRIS manual setelah mengecek mutasi. */
export async function settleManualOrder(adminId: number, orderCode: string, status: "paid" | "cancelled"): Promise<Result<{ status: OrderStatus }>> {
  if (providerOfOrder(orderCode) !== "manual") return { ok: false, error: "Bukan order QRIS manual." };
  const [order] = await db.select().from(orders).where(eq(orders.orderCode, orderCode));
  if (!order) return { ok: false, error: "Order tidak ditemukan." };
  if (order.status === "paid" && status === "cancelled") return { ok: false, error: "Order sudah lunas; cabut Premium lewat Manajemen User bila perlu." };
  return applyPaymentUpdate({
    orderCode,
    amount: order.amount,
    status,
    channel: "qris_manual",
    transactionId: null,
    paidAt: status === "paid" ? new Date() : null,
    raw: { ...(order.lastPayload as object | null), [status === "paid" ? "confirmedBy" : "cancelledBy"]: adminId, at: new Date().toISOString() },
  });
}

/** Status pembayaran dalam bentuk netral (dari Xendit, Midtrans, maupun DOKU). */
type PaymentUpdate = {
  orderCode: string;
  amount: number;
  status: OrderStatus;
  channel: string | null;
  transactionId: string | null;
  paidAt: Date | null;
  raw: unknown;
};

/** Terapkan status DOKU (webhook / Check Status). */
export function applyDokuStatus(payload: DokuStatus) {
  return applyPaymentUpdate({
    orderCode: payload.invoiceNumber,
    amount: payload.amount,
    status: mapDokuStatus(payload.status),
    channel: payload.channel,
    transactionId: null,
    paidAt: payload.date ? new Date(payload.date) : null,
    raw: payload.raw,
  });
}

/** Terapkan status Midtrans (webhook / Status API). */
export function applyMidtransStatus(payload: MidtransPayload) {
  const settled = payload.settlement_time ? new Date(`${payload.settlement_time.replace(" ", "T")}+07:00`) : null;
  return applyPaymentUpdate({
    orderCode: payload.order_id,
    amount: Number(payload.gross_amount),
    status: mapMidtransStatus(payload.transaction_status, payload.fraud_status),
    channel: payload.payment_type ?? null,
    transactionId: payload.transaction_id ?? null,
    paidAt: settled && !Number.isNaN(settled.getTime()) ? settled : null,
    raw: payload,
  });
}

/** Terapkan status invoice Xendit (webhook / cek status). */
export function applyXenditStatus(invoice: XenditInvoice) {
  const paidAt = invoice.paid_at ? new Date(invoice.paid_at) : null;
  return applyPaymentUpdate({
    orderCode: invoice.external_id,
    amount: invoice.amount,
    status: mapXenditStatus(invoice.status),
    channel: invoice.payment_channel ?? invoice.payment_method ?? null,
    transactionId: invoice.id,
    paidAt: paidAt && !Number.isNaN(paidAt.getTime()) ? paidAt : null,
    raw: invoice,
  });
}

/**
 * Terapkan status pembayaran ke order. Idempoten: membership hanya dibuat
 * sekali per order (unique order_id). Nominal harus sama.
 */
async function applyPaymentUpdate(payload: PaymentUpdate): Promise<Result<{ status: OrderStatus }>> {
  const [order] = await db.select().from(orders).where(eq(orders.orderCode, payload.orderCode));
  if (!order) return { ok: false, error: "Order tidak ditemukan." };
  if (Math.round(payload.amount) !== order.amount) return { ok: false, error: "Nominal tidak cocok." };

  const status = nextOrderStatus(order.status, payload.status);
  await db.transaction(async (tx) => {
    await tx
      .update(orders)
      .set({
        status,
        paymentType: payload.channel ?? order.paymentType,
        transactionId: payload.transactionId ?? order.transactionId,
        paidAt: status === "paid" && !order.paidAt ? (payload.paidAt ?? new Date()) : order.paidAt,
        lastPayload: payload.raw,
      })
      .where(eq(orders.id, order.id));

    if (status === "paid") {
      const [existing] = await tx.select({ id: memberships.id }).from(memberships).where(eq(memberships.orderId, order.id));
      if (!existing) {
        // Perpanjang dari masa aktif yang masih berjalan untuk cakupan yang sama.
        const current = await tx
          .select({ endsAt: memberships.endsAt, jenjang: memberships.jenjang })
          .from(memberships)
          .where(and(eq(memberships.userId, order.userId), isNull(memberships.revokedAt)));
        const sameScope = current.filter((m) => m.jenjang === order.jenjang && m.endsAt != null);
        const latest = sameScope.map((m) => m.endsAt!).sort((a, b) => b.getTime() - a.getTime())[0];
        const window = membershipWindow(new Date(), latest, order.durationDays);
        await tx.insert(memberships).values({ userId: order.userId, orderId: order.id, jenjang: order.jenjang, ...window, grantedBy: "purchase" });
      }
    }
    if (status === "refunded") {
      await tx.update(memberships).set({ revokedAt: new Date() }).where(and(eq(memberships.orderId, order.id), isNull(memberships.revokedAt)));
    }
  });
  return { ok: true, status };
}

/** Tarik status terbaru dari penyedia yang membuat order lalu terapkan (halaman selesai & tombol cek status). */
export async function syncOrder(orderCode: string): Promise<Result<{ status: OrderStatus }>> {
  try {
    const provider = providerOfOrder(orderCode);
    const result =
      provider === "manual"
        ? null // dikonfirmasi admin, tidak ada API penyedia
        : provider === "xendit"
        ? await getInvoiceByExternalId(orderCode).then((p) => (p ? applyXenditStatus(p) : null))
        : provider === "midtrans"
          ? await getTransactionStatus(orderCode).then((p) => (p ? applyMidtransStatus(p) : null))
          : await getOrderStatus(orderCode).then((p) => (p ? applyDokuStatus(p) : null));
    if (result) return result;
    const [order] = await db.select({ status: orders.status }).from(orders).where(eq(orders.orderCode, orderCode));
    return order ? { ok: true, status: order.status } : { ok: false, error: "Order tidak ditemukan." };
  } catch (e) {
    return { ok: false, error: isProviderError(e) ? (e as Error).message : "Gagal mengecek status." };
  }
}

export async function listUserOrders(userId: number, limit = 20) {
  return db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt)).limit(limit);
}

/** Admin: penjualan per paket langganan (order lunas & menunggu). */
export async function planSalesStats() {
  const rows = await db
    .select({
      planId: orders.planId,
      paid: sql<number>`SUM(${orders.status} = 'paid')`,
      revenue: sql<number>`COALESCE(SUM(CASE WHEN ${orders.status} = 'paid' THEN ${orders.amount} END), 0)`,
      pending: sql<number>`SUM(${orders.status} = 'pending')`,
    })
    .from(orders)
    .groupBy(orders.planId);
  return new Map(rows.map((r) => [r.planId, { paid: Number(r.paid), revenue: Number(r.revenue), pending: Number(r.pending) }]));
}

/** Beri / perpanjang Premium untuk user tertentu (dari tabel Manajemen User). Diperpanjang dari masa aktif cakupan yang sama. */
export async function grantMembershipToUser(adminId: number, userId: number, jenjang: JenjangCode | null, durationDays: number | null): Promise<Result<{ endsAt: Date | null }>> {
  const [user] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, userId));
  if (!user) return { ok: false, error: "User tidak ditemukan." };
  if (user.role === "admin") return { ok: false, error: "Admin selalu punya akses penuh." };
  const active = await getActiveMembership(user.id, jenjang);
  const window = membershipWindow(new Date(), active?.jenjang === jenjang ? active?.endsAt : null, durationDays);
  await db.insert(memberships).values({ userId: user.id, jenjang, ...window, grantedBy: "admin_manual", grantedByUserId: adminId });
  return { ok: true, endsAt: window.endsAt };
}

/** Cabut semua Premium aktif milik user (akun kembali Gratis). */
export async function revokeUserPremium(userId: number) {
  const now = new Date();
  await db
    .update(memberships)
    .set({ revokedAt: now })
    .where(and(eq(memberships.userId, userId), isNull(memberships.revokedAt), or(isNull(memberships.endsAt), gt(memberships.endsAt, now))));
}

/**
 * Order menunggu lebih dari 3 hari → kedaluwarsa (antrean verifikasi bersih, kode unik
 * bebas dipakai lagi). Pembayaran yang ternyata masuk tetap bisa dikonfirmasi/disinkron
 * belakangan (nextOrderStatus: expired → paid diizinkan).
 */
export async function expireStalePendingOrders() {
  await db
    .update(orders)
    .set({ status: "expired" })
    .where(and(eq(orders.status, "pending"), lt(orders.createdAt, new Date(Date.now() - MANUAL_ORDER_TTL_MS))));
}
