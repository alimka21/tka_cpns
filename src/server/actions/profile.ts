"use server";

// Profil akun sendiri: nama tampilan (siswa & admin) dan jenjang (siswa).

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getActiveSession } from "@/server/auth/session";
import { db } from "@/server/db";
import { JENJANG_CODES, users } from "@/server/db/schema";

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
