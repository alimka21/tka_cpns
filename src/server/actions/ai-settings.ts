"use server";

// Simpan/hapus Gemini API key milik user yang sedang login.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getActiveSession } from "@/server/auth/session";
import { deleteGeminiKey, saveGeminiKey } from "@/server/services/ai-key";
import { GeminiError } from "@/server/services/gemini";

// Tidak ada aturan format/awalan: keabsahan key ditentukan tes ping ke Google
// (verifyGeminiKey). Di sini hanya pengaman teknis — key dikirim sebagai header
// HTTP, jadi tidak boleh berisi spasi/baris baru.
const keyInput = z
  .string()
  .trim()
  .min(10, "API key terlalu pendek — salin ulang selengkapnya.")
  .max(500, "API key terlalu panjang.")
  .refine((k) => !/\s/.test(k), "API key tidak boleh berisi spasi atau baris baru.")
  .refine((k) => /^[\x21-\x7E]+$/.test(k), "API key berisi karakter yang tidak dikenal — salin ulang dari Google AI Studio.");

type Result = { ok: true; masked?: string } | { ok: false; error: string };

export async function saveGeminiKeyAction(apiKey: string): Promise<Result> {
  const session = await getActiveSession();
  if (!session) return { ok: false, error: "Sesi berakhir. Silakan masuk lagi." };
  const parsed = keyInput.safeParse(apiKey);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  try {
    const masked = await saveGeminiKey(Number(session.user.id), parsed.data);
    revalidatePath("/pengaturan");
    revalidatePath("/admin/profil");
    return { ok: true, masked };
  } catch (error) {
    if (error instanceof GeminiError) return { ok: false, error: error.message };
    if (error instanceof Error && /ENCRYPTION_SECRET/.test(error.message)) {
      return { ok: false, error: "Server belum siap menyimpan key (ENCRYPTION_SECRET belum diatur). Hubungi admin." };
    }
    throw error;
  }
}

export async function deleteGeminiKeyAction(): Promise<Result> {
  const session = await getActiveSession();
  if (!session) return { ok: false, error: "Sesi berakhir. Silakan masuk lagi." };
  await deleteGeminiKey(Number(session.user.id));
  revalidatePath("/pengaturan");
    revalidatePath("/admin/profil");
  return { ok: true };
}
