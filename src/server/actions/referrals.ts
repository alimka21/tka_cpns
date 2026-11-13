"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { payoutAccountInput, referralCodeInput } from "@/lib/referral";
import { getActiveSession, getAdminSession } from "@/server/auth/session";
import { recordPayout, savePayoutAccount, setLateReferral } from "@/server/services/referrals";

type Result = { ok: true; message?: string } | { ok: false; error: string };

/** Pemilik kode menyimpan rekening/e-wallet tujuan transfer komisi. */
export async function savePayoutAccountAction(input: unknown): Promise<Result> {
  const session = await getActiveSession();
  if (!session) return { ok: false, error: "Sesi berakhir. Silakan masuk lagi." };
  const parsed = payoutAccountInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Data rekening tidak valid." };
  await savePayoutAccount(Number(session.user.id), parsed.data);
  revalidatePath("/afiliasi");
  revalidatePath("/admin/afiliasi");
  revalidatePath("/admin/referal");
  return { ok: true, message: "Rekening tersimpan." };
}

/** Akun baru (mis. daftar lewat Google) mengisi kode teman belakangan. */
export async function setLateReferralAction(code: unknown): Promise<Result> {
  const session = await getActiveSession();
  if (!session) return { ok: false, error: "Sesi berakhir. Silakan masuk lagi." };
  const parsed = referralCodeInput.safeParse(code);
  if (!parsed.success || !parsed.data) return { ok: false, error: "Masukkan kode guru yang valid." };
  const r = await setLateReferral(Number(session.user.id), parsed.data);
  if (!r.ok) return r;
  revalidatePath("/langganan");
  revalidatePath("/admin/afiliasi");
  return { ok: true, message: "Kode guru tersimpan." };
}

/** Admin: catat bahwa semua komisi pending milik `referrerId` sudah ditransfer. */
export async function recordPayoutAction(input: unknown): Promise<Result> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: "Sesi admin berakhir. Silakan masuk lagi." };
  const parsed = z.object({ referrerId: z.number().int().positive(), note: z.string().trim().max(500).optional() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Data tidak valid." };
  const r = await recordPayout(Number(session.user.id), parsed.data.referrerId, parsed.data.note || null);
  if (!r.ok) return r;
  revalidatePath("/admin/referal");
  revalidatePath("/admin/afiliasi");
  revalidatePath("/afiliasi");
  return { ok: true, message: "Pembayaran komisi tercatat." };
}
