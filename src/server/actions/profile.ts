"use server";

// Profil siswa: jenjang (menentukan paket & kurikulum).

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
