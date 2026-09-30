// Gemini API key milik user: simpan (terenkripsi), baca (server-only), hapus.

import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { userAiSettings } from "@/server/db/schema";
import { decryptSecret, encryptSecret, maskSecret } from "@/server/services/crypto";
import { verifyGeminiKey } from "@/server/services/gemini";

/** Versi tersamar untuk ditampilkan, atau null bila belum ada key. */
export async function getMaskedGeminiKey(userId: number): Promise<string | null> {
  const [row] = await db.select({ masked: userAiSettings.geminiKeyMasked }).from(userAiSettings).where(eq(userAiSettings.userId, userId));
  return row?.masked ?? null;
}

/** Key asli (didekripsi) — HANYA untuk memanggil Gemini di server. */
export async function getGeminiKey(userId: number): Promise<string | null> {
  const [row] = await db.select({ enc: userAiSettings.geminiApiKeyEncrypted }).from(userAiSettings).where(eq(userAiSettings.userId, userId));
  if (!row) return null;
  try {
    return decryptSecret(row.enc);
  } catch {
    // ENCRYPTION_SECRET berubah → key lama tidak terbaca; user harus menyimpan ulang.
    return null;
  }
}

/** Uji key ke Gemini dulu, baru simpan (menimpa key lama). Melempar GeminiError bila ditolak. */
export async function saveGeminiKey(userId: number, apiKey: string) {
  await verifyGeminiKey(apiKey);
  const values = { geminiApiKeyEncrypted: encryptSecret(apiKey), geminiKeyMasked: maskSecret(apiKey), updatedAt: new Date() };
  await db
    .insert(userAiSettings)
    .values({ userId, ...values })
    .onDuplicateKeyUpdate({ set: values });
  return values.geminiKeyMasked;
}

export async function deleteGeminiKey(userId: number) {
  await db.delete(userAiSettings).where(eq(userAiSettings.userId, userId));
}
