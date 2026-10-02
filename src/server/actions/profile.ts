"use server";

// Profil akun sendiri: nama tampilan (siswa & admin), jenjang (siswa), kata sandi.

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { isAPIError } from "better-auth/api";
import { z } from "zod";
import { auth } from "@/server/auth";
import { getActiveSession } from "@/server/auth/session";
import { db } from "@/server/db";
import { JENJANG_CODES, users } from "@/server/db/schema";
import { hasCredentialPassword } from "@/server/services/account-password";

export async function setMyJenjangAction(jenjang: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getActiveSession();
  if (!session) return { ok: false, error: "Sesi berakhir atau akun belum aktif." };
  const parsed = z.enum(JENJANG_CODES).safeParse(jenjang);
  if (!parsed.success) return { ok: false, error: "Pilih jenjang SD, SMP, atau SMA." };
  await db.update(users).set({ jenjang: parsed.data }).where(eq(users.id, Number(session.user.id)));
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Nama yang sama dengan validasi form daftar (2–100 karakter, tanpa spasi berlebih). */
const displayName = z
  .string()
  .transform((v) => v.trim().replace(/\s+/g, " "))
  .pipe(z.string().min(2, "Nama minimal 2 karakter.").max(100, "Nama maksimal 100 karakter."));

export async function updateMyNameAction(name: string): Promise<{ ok: true; name: string } | { ok: false; error: string }> {
  const session = await getActiveSession();
  if (!session) return { ok: false, error: "Sesi berakhir atau akun belum aktif." };
  const parsed = displayName.safeParse(name);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  await db.update(users).set({ name: parsed.data }).where(eq(users.id, Number(session.user.id)));
  // Nama tampil di header siswa & panel admin.
  revalidatePath("/", "layout");
  return { ok: true, name: parsed.data };
}

const passwordInput = z.object({
  // Kosong untuk akun Google yang belum punya kata sandi.
  currentPassword: z.string().max(128),
  newPassword: z.string().min(8, "Kata sandi baru minimal 8 karakter.").max(128, "Kata sandi baru maksimal 128 karakter."),
  revokeOtherSessions: z.boolean(),
});

const PASSWORD_ERRORS: Record<string, string> = {
  INVALID_PASSWORD: "Kata sandi saat ini salah.",
  PASSWORD_TOO_SHORT: "Kata sandi baru minimal 8 karakter.",
  PASSWORD_TOO_LONG: "Kata sandi baru maksimal 128 karakter.",
  CREDENTIAL_ACCOUNT_NOT_FOUND: "Akun ini belum punya kata sandi.",
  PASSWORD_ALREADY_SET: "Akun ini sudah punya kata sandi.",
};

/**
 * Ganti kata sandi (akun email/password) atau buat kata sandi pertama (akun
 * yang daftar lewat Google, supaya bisa juga masuk dengan email).
 */
export async function changeMyPasswordAction(
  input: z.input<typeof passwordInput>,
): Promise<{ ok: true; created: boolean } | { ok: false; error: string }> {
  const session = await getActiveSession();
  if (!session) return { ok: false, error: "Sesi berakhir atau akun belum aktif." };
  const parsed = passwordInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { currentPassword, newPassword, revokeOtherSessions } = parsed.data;

  const hasPassword = await hasCredentialPassword(Number(session.user.id));
  if (hasPassword && !currentPassword) return { ok: false, error: "Isi kata sandi saat ini." };
  if (hasPassword && currentPassword === newPassword) {
    return { ok: false, error: "Kata sandi baru harus berbeda dari yang sekarang." };
  }

  try {
    const h = await headers();
    if (hasPassword) {
      await auth.api.changePassword({ body: { currentPassword, newPassword, revokeOtherSessions }, headers: h });
    } else {
      await auth.api.setPassword({ body: { newPassword }, headers: h });
    }
  } catch (e) {
    if (isAPIError(e)) {
      const code = (e.body as { code?: string } | undefined)?.code;
      return { ok: false, error: (code && PASSWORD_ERRORS[code]) || "Gagal menyimpan kata sandi. Coba lagi." };
    }
    throw e;
  }
  return { ok: true, created: !hasPassword };
}

