"use server";

// Hapus user (admin). Ubah role SENGAJA tidak ada di sini — hanya lewat
// `npm run user:role` (docs/DECISIONS.md 2026-09-25), supaya menjadikan
// admin selalu lewat jalur yang jelas & tercatat di terminal, bukan klik UI.

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getAdminSession } from "@/server/auth/session";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";

export type ActionResult = { ok: true } | { ok: false; error: string };

function isFkError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "ER_ROW_IS_REFERENCED_2";
}

export async function deleteUserAction(userId: number): Promise<ActionResult> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: "Sesi admin berakhir. Silakan masuk lagi." };
  if (Number(session.user.id) === userId) return { ok: false, error: "Tidak bisa menghapus akunmu sendiri." };

  try {
    await db.delete(users).where(eq(users.id, userId));
  } catch (error) {
    if (isFkError(error)) {
      return { ok: false, error: "User ini masih punya data terkait (soal/paket/percobaan) — tidak bisa dihapus." };
    }
    throw error;
  }
  revalidatePath("/admin/users");
  return { ok: true };
}
