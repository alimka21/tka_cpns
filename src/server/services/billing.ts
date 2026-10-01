// Langganan Premium & pembayaran (Midtrans). Satu-satunya tempat yang
// mengubah status order & membuat membership dari pembayaran.

import { randomBytes } from "node:crypto";
import { and, asc, desc, eq, gt, isNull, or } from "drizzle-orm";
import { db } from "@/server/db";
import { memberships, orders, plans, users, type JenjangCode, type OrderStatus } from "@/server/db/schema";
import { createSnapTransaction, getTransactionStatus, MidtransError } from "./midtrans";
import { mapMidtransStatus, membershipWindow, nextOrderStatus, type MidtransPayload } from "./midtrans-status";

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

function newOrderCode(userId: number) {
  return `WTP-${userId}-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

/** Buat order + transaksi Snap; kembalikan URL halaman bayar Midtrans. */
export async function createOrder(
  user: { id: number; name: string; email: string; jenjang: string | null },
  planId: number,
  siteUrl: string,
): Promise<Result<{ redirectUrl: string; orderCode: string }>> {
  const [plan] = await db.select().from(plans).where(eq(plans.id, planId));
  if (!plan || !plan.isActive) return { ok: false, error: "Paket langganan tidak tersedia." };
  if (plan.jenjang && plan.jenjang !== user.jenjang) return { ok: false, error: `Paket ini untuk jenjang ${plan.jenjang}.` };
  if (plan.price < 1000) return { ok: false, error: "Harga paket belum valid." };

  const orderCode = newOrderCode(user.id);
  const [{ id }] = await db
    .insert(orders)
    .values({ orderCode, userId: user.id, planId: plan.id, planName: plan.name, jenjang: plan.jenjang, durationDays: plan.durationDays, amount: plan.price })
    .$returningId();
  try {
    const snap = await createSnapTransaction({
      orderCode,
      amount: plan.price,
      itemName: plan.name,
      customer: { name: user.name, email: user.email },
      finishUrl: `${siteUrl.replace(/\/$/, "")}/langganan/selesai?order_id=${encodeURIComponent(orderCode)}`,
    });
    await db.update(orders).set({ snapToken: snap.token, redirectUrl: snap.redirectUrl }).where(eq(orders.id, id));
    return { ok: true, redirectUrl: snap.redirectUrl, orderCode };
  } catch (e) {
    await db.update(orders).set({ status: "failed" }).where(eq(orders.id, id));
    return { ok: false, error: e instanceof MidtransError ? e.message : "Gagal membuat transaksi." };
  }
}

/**
 * Terapkan status Midtrans ke order (dari webhook atau cek status). Idempoten:
 * membership hanya dibuat sekali per order (unique order_id). Nominal harus sama.
 */
export async function applyMidtransStatus(payload: MidtransPayload): Promise<Result<{ status: OrderStatus }>> {
  const [order] = await db.select().from(orders).where(eq(orders.orderCode, payload.order_id));
  if (!order) return { ok: false, error: "Order tidak ditemukan." };
  if (Math.round(Number(payload.gross_amount)) !== order.amount) return { ok: false, error: "Nominal tidak cocok." };

  const status = nextOrderStatus(order.status, mapMidtransStatus(payload.transaction_status, payload.fraud_status));
  await db.transaction(async (tx) => {
    await tx
      .update(orders)
      .set({
        status,
        paymentType: payload.payment_type ?? order.paymentType,
        transactionId: payload.transaction_id ?? order.transactionId,
        paidAt: status === "paid" && !order.paidAt ? new Date() : order.paidAt,
        lastPayload: payload,
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

/** Tarik status terbaru dari Midtrans lalu terapkan (halaman selesai & tombol admin). */
export async function syncOrder(orderCode: string): Promise<Result<{ status: OrderStatus }>> {
  try {
    const payload = await getTransactionStatus(orderCode);
    if (!payload) {
      const [order] = await db.select({ status: orders.status }).from(orders).where(eq(orders.orderCode, orderCode));
      return order ? { ok: true, status: order.status } : { ok: false, error: "Order tidak ditemukan." };
    }
    return applyMidtransStatus(payload);
  } catch (e) {
    return { ok: false, error: e instanceof MidtransError ? e.message : "Gagal mengecek status." };
  }
}

export async function listUserOrders(userId: number, limit = 20) {
  return db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt)).limit(limit);
}

export async function listOrdersAdmin(limit = 100) {
  return db
    .select({ order: orders, userName: users.name, userEmail: users.email })
    .from(orders)
    .innerJoin(users, eq(users.id, orders.userId))
    .orderBy(desc(orders.createdAt))
    .limit(limit);
}

/** Admin memberi Premium manual (mis. kerja sama sekolah). */
export async function grantManualMembership(adminId: number, email: string, jenjang: JenjangCode | null, durationDays: number | null): Promise<Result> {
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email.trim().toLowerCase()));
  if (!user) return { ok: false, error: "Email tidak terdaftar." };
  const active = await getActiveMembership(user.id, jenjang);
  const window = membershipWindow(new Date(), active?.jenjang === jenjang ? active?.endsAt : null, durationDays);
  await db.insert(memberships).values({ userId: user.id, jenjang, ...window, grantedBy: "admin_manual", grantedByUserId: adminId });
  return { ok: true };
}

export async function revokeMembership(membershipId: number) {
  await db.update(memberships).set({ revokedAt: new Date() }).where(eq(memberships.id, membershipId));
}

export async function listActiveMembershipsAdmin() {
  const now = new Date();
  return db
    .select({ m: memberships, userName: users.name, userEmail: users.email })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(and(isNull(memberships.revokedAt), or(isNull(memberships.endsAt), gt(memberships.endsAt, now))))
    .orderBy(desc(memberships.createdAt))
    .limit(200);
}
