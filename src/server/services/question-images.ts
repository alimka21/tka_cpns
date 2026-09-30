// Galeri gambar soal (disimpan di DB, DECISIONS 2026-09-30). Setiap unggahan
// dikompres ke WebP (maks 1600 px) supaya ringan untuk siswa & database.

import { createHash } from "node:crypto";
import { count, desc, eq, sql } from "drizzle-orm";
import sharp from "sharp";
import { db } from "@/server/db";
import { questionImages, questions } from "@/server/db/schema";

export const IMAGE_ACCEPT = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_SIDE = 1600;
const TARGET_BYTES = 900 * 1024;

export const imagePath = (id: number) => `/gambar/${id}`;

/** Kompres ke WebP; turunkan kualitas bila masih > ~900 KB. */
export async function compressImage(input: Buffer) {
  let quality = 82;
  for (;;) {
    const { data, info } = await sharp(input, { animated: false })
      .rotate()
      .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true })
      .webp({ quality })
      .toBuffer({ resolveWithObject: true });
    if (data.length <= TARGET_BYTES || quality <= 50) return { data, width: info.width, height: info.height, mime: "image/webp" };
    quality -= 12;
  }
}

export type SavedImage = { id: number; title: string; duplicate: boolean };

/** Simpan satu file. Gambar identik (setelah kompres) tidak disimpan dua kali. */
export async function saveQuestionImage(file: { name: string; type: string; bytes: Buffer }, userId: number): Promise<SavedImage> {
  const compressed = await compressImage(file.bytes);
  const sha256 = createHash("sha256").update(compressed.data).digest("hex");
  const [existing] = await db.select({ id: questionImages.id, title: questionImages.title }).from(questionImages).where(eq(questionImages.sha256, sha256));
  if (existing) return { ...existing, duplicate: true };

  const title = file.name.replace(/\.[a-z0-9]+$/i, "").replace(/[_-]+/g, " ").trim().slice(0, 255) || "Gambar soal";
  const [{ id }] = await db
    .insert(questionImages)
    .values({ title, mime: compressed.mime, width: compressed.width, height: compressed.height, sizeBytes: compressed.data.length, sha256, data: compressed.data, uploadedBy: userId })
    .$returningId();
  return { id, title, duplicate: false };
}

export type ImageListItem = { id: number; title: string; width: number; height: number; sizeBytes: number; createdAt: string; usedBy: number };

/** Daftar galeri (tanpa isi biner) + jumlah soal yang memakai tiap gambar. */
export async function listQuestionImages(limit = 200): Promise<ImageListItem[]> {
  const rows = await db
    .select({
      id: questionImages.id,
      title: questionImages.title,
      width: questionImages.width,
      height: questionImages.height,
      sizeBytes: questionImages.sizeBytes,
      createdAt: questionImages.createdAt,
    })
    .from(questionImages)
    .orderBy(desc(questionImages.createdAt), desc(questionImages.id))
    .limit(limit);
  const usage = await db
    .select({ url: questions.imageUrl, n: count() })
    .from(questions)
    .where(sql`${questions.imageUrl} like '/gambar/%'`)
    .groupBy(questions.imageUrl);
  const usedBy = new Map(usage.map((u) => [u.url, Number(u.n)]));
  return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString(), usedBy: usedBy.get(imagePath(r.id)) ?? 0 }));
}

export async function getQuestionImage(id: number) {
  const [row] = await db
    .select({ id: questionImages.id, title: questionImages.title, mime: questionImages.mime, data: questionImages.data })
    .from(questionImages)
    .where(eq(questionImages.id, id));
  return row;
}

export async function getQuestionImageMeta(id: number) {
  const [row] = await db
    .select({ id: questionImages.id, title: questionImages.title, width: questionImages.width, height: questionImages.height })
    .from(questionImages)
    .where(eq(questionImages.id, id));
  return row;
}

export async function renameQuestionImage(id: number, title: string) {
  await db.update(questionImages).set({ title }).where(eq(questionImages.id, id));
}

/** Hapus hanya bila tidak dipakai soal mana pun. */
export async function deleteQuestionImage(id: number): Promise<{ ok: true } | { ok: false; error: string }> {
  const [{ n }] = await db.select({ n: count() }).from(questions).where(eq(questions.imageUrl, imagePath(id)));
  if (Number(n) > 0) return { ok: false, error: `Gambar dipakai ${n} soal — ganti gambar soal-soal itu dulu.` };
  await db.delete(questionImages).where(eq(questionImages.id, id));
  return { ok: true };
}
