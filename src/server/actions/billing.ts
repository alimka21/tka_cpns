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
import { createOrder, grantManualMembership, revokeMembership, syncOrder } from "@/server/services/billing";
import { isDokuConfigured, testDokuConnection } from "@/server/services/doku";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };
const NOT_ADMIN = { ok: false as const, error: "Sesi admin berakhir. Silakan masuk lagi." };
const id = z.number().int().positive();

/** URL situs untuk callback DOKU: env SITE_URL, atau host request (fallback). */
async function siteUrl() {
  if (process.env.SITE_URL) return SITE_URL;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  return host ? `${h.get("x-forwarded-proto") ?? "https"}://${host}` : SITE_URL;
}

export async function createOrderAction(planId: number): Promise<Result<{ redirectUrl: string }>> {
  const session = await getActiveSession();
  if (!session) return { ok: false, error: "Sesi berakhir. Silakan masuk lagi." };
  if (!id.safeParse(planId).success) return { ok: false, error: "Paket tidak valid." };
  const u = session.user;
  const result = await createOrder({ id: Number(u.id), name: u.name, email: u.email, jenjang: u.jenjang ?? null }, planId, await siteUrl());
  return result.ok ? { ok: true, redirectUrl: result.redirectUrl } : result;
}

/** Siswa/admin mengecek ulang status order ke DOKU. Siswa hanya untuk order miliknya. */
export async function syncOrderAction(orderCode: string): Promise<Result<{ status: string }>> {
  const session = await getActiveSession();
  if (!session) return { ok: false, error: "Sesi berakhir. Silakan masuk lagi." };
  const [order] = await db.select({ userId: orders.userId }).from(orders).where(eq(orders.orderCode, String(orderCode).slice(0, 50)));
  if (!order || (session.user.role !== "admin" && order.userId !== Number(session.user.id))) return { ok: false, error: "Order tidak ditemukan." };
  const r = await syncOrder(orderCode);
  revalidatePath("/langganan");
  revalidatePath("/admin/langganan");
  return r;
}

const planInput = z.object({
  id: id.optional(),
  name: z.string().trim().min(3, "Nama minimal 3 karakter").max(120),
  description: z.string().trim().max(1000).optional().nullable(),
  jenjang: z.enum(JENJANG_CODES).nullable(),
  price: z.number().int().min(1000, "Harga minimal Rp1.000").max(100_000_000),
  durationDays: z.number().int().min(1).max(3650).nullable(),
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0).max(999).default(0),
});

export async function savePlanAction(input: unknown): Promise<Result> {
  if (!(await getAdminSession())) return NOT_ADMIN;
  const parsed = planInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { id: planId, ...values } = parsed.data;
  if (planId) await db.update(plans).set(values).where(eq(plans.id, planId));
  else await db.insert(plans).values(values);
  revalidatePath("/admin/langganan");
  revalidatePath("/langganan");
  return { ok: true };
}

export async function grantMembershipAction(input: unknown): Promise<Result> {
  const session = await getAdminSession();
  if (!session) return NOT_ADMIN;
  const parsed = z
    .object({ email: z.email("Email tidak valid"), jenjang: z.enum(JENJANG_CODES).nullable(), durationDays: z.number().int().min(1).max(3650).nullable() })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const r = await grantManualMembership(Number(session.user.id), parsed.data.email, parsed.data.jenjang, parsed.data.durationDays);
  revalidatePath("/admin/langganan");
  return r;
}

export async function revokeMembershipAction(membershipId: number): Promise<Result> {
  if (!(await getAdminSession())) return NOT_ADMIN;
  if (!id.safeParse(membershipId).success) return { ok: false, error: "Data tidak valid." };
  await revokeMembership(membershipId);
  revalidatePath("/admin/langganan");
  return { ok: true };
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
