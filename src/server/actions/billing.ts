"use server";

// Langganan Premium: beli (siswa) & kelola paket langganan, order, membership (admin).

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { SITE_URL } from "@/lib/site";
import { getActiveSession, getAdminSession } from "@/server/auth/session";
import { db } from "@/server/db";
import { JENJANG_CODES, orders, plans } from "@/server/db/schema";
import { createOrder, grantMembershipToUser, revokeUserPremium, settleManualOrder, syncOrder } from "@/server/services/billing";
import { isDokuConfigured, testDokuConnection } from "@/server/services/doku";
import { isMidtransConfigured, testMidtransConnection } from "@/server/services/midtrans";
import { isXenditConfigured, testXenditConnection } from "@/server/services/xendit";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };
const NOT_ADMIN = { ok: false as const, error: "Sesi admin berakhir. Silakan masuk lagi." };
const id = z.number().int().positive();

/** URL situs untuk halaman kembali dari pembayaran: env SITE_URL, atau host request (fallback). */
async function siteUrl() {
  if (process.env.SITE_URL) return SITE_URL;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  return host ? `${h.get("x-forwarded-proto") ?? "https"}://${host}` : SITE_URL;
}

export async function createOrderAction(planId: number, methodId?: string): Promise<Result<{ redirectUrl: string }>> {
  const session = await getActiveSession();
  if (!session) return { ok: false, error: "Sesi berakhir. Silakan masuk lagi." };
  if (!id.safeParse(planId).success) return { ok: false, error: "Paket tidak valid." };
  if (methodId !== undefined && !z.string().regex(/^[a-z-]{2,30}$/).safeParse(methodId).success) return { ok: false, error: "Metode pembayaran tidak valid." };
  const u = session.user;
  const result = await createOrder({ id: Number(u.id), name: u.name, email: u.email, role: u.role, jenjang: u.jenjang ?? null }, planId, await siteUrl(), methodId);
  return result.ok ? { ok: true, redirectUrl: result.redirectUrl } : result;
}

/** Siswa/admin mengecek ulang status order ke penyedia pembayaran. Siswa hanya untuk order miliknya. */
export async function syncOrderAction(orderCode: string): Promise<Result<{ status: string }>> {
  const session = await getActiveSession();
  if (!session) return { ok: false, error: "Sesi berakhir. Silakan masuk lagi." };
  const [order] = await db.select({ userId: orders.userId }).from(orders).where(eq(orders.orderCode, String(orderCode).slice(0, 50)));
  if (!order || (session.user.role !== "admin" && order.userId !== Number(session.user.id))) return { ok: false, error: "Order tidak ditemukan." };
  const r = await syncOrder(orderCode);
  revalidatePath("/langganan");
  revalidatePath("/admin/transaksi");
  return r;
}

const planInput = z.object({
  id: id.optional(),
  name: z.string().trim().min(3, "Nama minimal 3 karakter").max(120),
  description: z.string().trim().max(1000).optional().nullable(),
  jenjang: z.enum(JENJANG_CODES).nullable(),
  price: z.number().int().min(1000, "Harga minimal Rp1.000").max(100_000_000),
  normalPrice: z.number().int().max(100_000_000).nullable().default(null),
  durationDays: z.number().int().min(1).max(3650).nullable(),
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0).max(999).default(0),
}).refine((p) => p.normalPrice == null || p.normalPrice > p.price, { message: "Harga normal (coret) harus lebih besar dari harga jual", path: ["normalPrice"] });

export async function savePlanAction(input: unknown): Promise<Result> {
  if (!(await getAdminSession())) return NOT_ADMIN;
  const parsed = planInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { id: planId, ...values } = parsed.data;
  if (planId) await db.update(plans).set(values).where(eq(plans.id, planId));
  else await db.insert(plans).values(values);
  revalidatePath("/admin/langganan");
  revalidatePath("/langganan");
  revalidatePath("/"); // harga Premium termurah tampil di landing
  return { ok: true };
}

/** Admin: beri / perpanjang Premium untuk satu user (tabel Manajemen User). */
export async function grantUserPremiumAction(input: unknown): Promise<Result<{ endsAt: string | null }>> {
  const session = await getAdminSession();
  if (!session) return NOT_ADMIN;
  const parsed = z
    .object({ userId: id, jenjang: z.enum(JENJANG_CODES).nullable(), durationDays: z.number().int().min(1, "Durasi minimal 1 hari").max(3650).nullable() })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const r = await grantMembershipToUser(Number(session.user.id), parsed.data.userId, parsed.data.jenjang, parsed.data.durationDays);
  revalidatePath("/admin/users");
  return r.ok ? { ok: true, endsAt: r.endsAt?.toISOString() ?? null } : r;
}

/** Admin: cabut semua Premium aktif user. */
export async function revokeUserPremiumAction(userId: number): Promise<Result> {
  if (!(await getAdminSession())) return NOT_ADMIN;
  if (!id.safeParse(userId).success) return { ok: false, error: "Data tidak valid." };
  await revokeUserPremium(userId);
  revalidatePath("/admin/users");
  return { ok: true };
}

/** Admin: konfirmasi lunas / batalkan order QRIS manual (setelah cek bukti WA & mutasi GoPay Merchant). */
export async function settleManualOrderAction(orderCode: string, status: "paid" | "cancelled"): Promise<Result> {
  const session = await getAdminSession();
  if (!session) return NOT_ADMIN;
  const parsed = z.object({ orderCode: z.string().min(1).max(50), status: z.enum(["paid", "cancelled"]) }).safeParse({ orderCode, status });
  if (!parsed.success) return { ok: false, error: "Data tidak valid." };
  const r = await settleManualOrder(Number(session.user.id), parsed.data.orderCode, parsed.data.status);
  revalidatePath("/admin/transaksi");
  revalidatePath("/admin/users");
  revalidatePath("/langganan");
  return r.ok ? { ok: true } : r;
}

/** Admin: uji Client ID & Secret Key ke DOKU tanpa membuat transaksi. */
export async function testDokuConnectionAction(): Promise<Result<{ message: string }>> {
  if (!(await getAdminSession())) return NOT_ADMIN;
  if (!isDokuConfigured()) return { ok: false, error: "DOKU_CLIENT_ID / DOKU_SECRET_KEY belum diisi di env." };
  try {
    const r = await testDokuConnection();
    return r.ok ? { ok: true, message: r.message } : { ok: false, error: r.message };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal menghubungi DOKU." };
  }
}

/** Admin: uji Secret Key Xendit tanpa membuat transaksi. */
export async function testXenditConnectionAction(): Promise<Result<{ message: string }>> {
  if (!(await getAdminSession())) return NOT_ADMIN;
  if (!isXenditConfigured()) return { ok: false, error: "XENDIT_SECRET_KEY belum diisi di env." };
  try {
    const r = await testXenditConnection();
    return r.ok ? { ok: true, message: r.message } : { ok: false, error: r.message };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal menghubungi Xendit." };
  }
}

/** Admin: uji Server Key Midtrans tanpa membuat transaksi. */
export async function testMidtransConnectionAction(): Promise<Result<{ message: string }>> {
  if (!(await getAdminSession())) return NOT_ADMIN;
  if (!isMidtransConfigured()) return { ok: false, error: "MIDTRANS_SERVER_KEY belum diisi di env." };
  try {
    const r = await testMidtransConnection();
    return r.ok ? { ok: true, message: r.message } : { ok: false, error: r.message };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal menghubungi Midtrans." };
  }
}
