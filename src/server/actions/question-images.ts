"use server";

// Galeri gambar soal (admin). Upload dikirim SATU file per panggilan dari
// client supaya tiap request kecil & ada progres per file.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminSession } from "@/server/auth/session";
import {
  IMAGE_ACCEPT,
  MAX_UPLOAD_BYTES,
  deleteQuestionImage,
  renameQuestionImage,
  saveQuestionImage,
  type SavedImage,
} from "@/server/services/question-images";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };
const NOT_ADMIN = { ok: false as const, error: "Sesi admin berakhir. Silakan masuk lagi." };

export async function uploadQuestionImageAction(form: FormData): Promise<Result<{ image: SavedImage }>> {
  const session = await getAdminSession();
  if (!session) return NOT_ADMIN;
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "File tidak ditemukan." };
  if (!(IMAGE_ACCEPT as readonly string[]).includes(file.type)) return { ok: false, error: "Format harus JPG, PNG, WebP, atau GIF." };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: "Ukuran file maksimal 10 MB." };
  try {
    const image = await saveQuestionImage({ name: file.name, type: file.type, bytes: Buffer.from(await file.arrayBuffer()) }, Number(session.user.id));
    revalidatePath("/admin/soal/gambar");
    return { ok: true, image };
  } catch {
    return { ok: false, error: "File tidak bisa dibaca sebagai gambar." };
  }
}

const id = z.number().int().positive();

export async function renameQuestionImageAction(input: { id: number; title: string }): Promise<Result> {
  if (!(await getAdminSession())) return NOT_ADMIN;
  const parsed = z.object({ id, title: z.string().trim().min(1, "Judul wajib diisi").max(255) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  await renameQuestionImage(parsed.data.id, parsed.data.title);
  revalidatePath("/admin/soal/gambar");
  return { ok: true };
}

export async function deleteQuestionImageAction(imageId: number): Promise<Result> {
  if (!(await getAdminSession())) return NOT_ADMIN;
  const parsed = id.safeParse(imageId);
  if (!parsed.success) return { ok: false, error: "Gambar tidak valid." };
  const result = await deleteQuestionImage(parsed.data);
  if (result.ok) revalidatePath("/admin/soal/gambar");
  return result;
}
