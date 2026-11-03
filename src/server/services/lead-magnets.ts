// Lead magnet (/materi/[slug]): file materi gratis disimpan di DB (schema/lead-magnets).
// Lonjakan unduhan saat konten viral tidak boleh membebani DB: metadata di-cache sebentar
// (TTL) dan isi file di LRU memori dengan kunci `id:updated_at` — file yang diganti admin
// otomatis memakai kunci baru. Perubahan admin juga langsung membuang cache di proses ini.

import { and, count, desc, eq, sql } from "drizzle-orm";
import { ByteLru } from "@/lib/lru";
import { LEAD_MAGNET_FORMATS, downloadFileName, sniffFormat, type LeadMagnetInput } from "@/lib/validation/lead-magnet";
import { db } from "@/server/db";
import { leadMagnetDownloads, leadMagnets, testPackages } from "@/server/db/schema";
import { compressImage } from "@/server/services/question-images";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const META_TTL_MS = 15_000;
/** Total isi file + gambar pratinjau di memori (beberapa materi populer muat sekaligus). */
const fileCache = new ByteLru<Buffer>(96 * 1024 * 1024, 11 * 1024 * 1024);
const metaCache = new Map<string, { at: number; meta: LeadMagnetMeta | null }>();

export type LeadMagnetMeta = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  previewText: string | null;
  hasPreviewImage: boolean;
  fileName: string;
  fileMime: string;
  fileSize: number;
  requiresLogin: boolean;
  isActive: boolean;
  ctaPackageId: number | null;
  updatedAt: Date;
};

const metaColumns = {
  id: leadMagnets.id,
  slug: leadMagnets.slug,
  title: leadMagnets.title,
  description: leadMagnets.description,
  previewText: leadMagnets.previewText,
  hasPreviewImage: sql<number>`${leadMagnets.previewImage} IS NOT NULL`,
  fileName: leadMagnets.fileName,
  fileMime: leadMagnets.fileMime,
  fileSize: leadMagnets.fileSize,
  requiresLogin: leadMagnets.requiresLogin,
  isActive: leadMagnets.isActive,
  ctaPackageId: leadMagnets.ctaPackageId,
  updatedAt: leadMagnets.updatedAt,
};

/** Metadata (tanpa blob) per slug, termasuk yang nonaktif. Di-cache 15 detik. */
export async function getLeadMagnetMeta(slug: string): Promise<LeadMagnetMeta | null> {
  const cached = metaCache.get(slug);
  if (cached && Date.now() - cached.at < META_TTL_MS) return cached.meta;
  const [row] = await db.select(metaColumns).from(leadMagnets).where(eq(leadMagnets.slug, slug));
  const meta = row ? { ...row, hasPreviewImage: Boolean(Number(row.hasPreviewImage)) } : null;
  if (metaCache.size > 500) metaCache.clear();
  metaCache.set(slug, { at: Date.now(), meta });
  return meta;
}

const versionKey = (meta: Pick<LeadMagnetMeta, "id" | "updatedAt">) => `${meta.id}:${meta.updatedAt.getTime()}`;

/** Isi file materi (LRU memori → DB). */
export async function getLeadMagnetFile(meta: LeadMagnetMeta): Promise<Buffer | null> {
  const key = `f:${versionKey(meta)}`;
  const hit = fileCache.get(key);
  if (hit) return hit;
  const [row] = await db.select({ data: leadMagnets.fileData }).from(leadMagnets).where(eq(leadMagnets.id, meta.id));
  if (!row) return null;
  fileCache.set(key, row.data, row.data.length);
  return row.data;
}

/** Gambar pratinjau publik (LRU memori → DB). */
export async function getLeadMagnetPreview(meta: LeadMagnetMeta): Promise<{ data: Buffer; mime: string } | null> {
  if (!meta.hasPreviewImage) return null;
  const key = `p:${versionKey(meta)}`;
  const [row] = fileCache.get(key)
    ? [{ data: fileCache.get(key)!, mime: "image/webp" }]
    : await db.select({ data: leadMagnets.previewImage, mime: leadMagnets.previewImageMime }).from(leadMagnets).where(eq(leadMagnets.id, meta.id));
  if (!row?.data) return null;
  fileCache.set(key, row.data, row.data.length);
  return { data: row.data, mime: row.mime ?? "image/webp" };
}

/** URL gambar pratinjau — berubah setiap materi diperbarui, jadi aman di-cache lama. */
export const previewImagePath = (meta: Pick<LeadMagnetMeta, "slug" | "updatedAt">) =>
  `/materi/${meta.slug}/pratinjau?v=${meta.updatedAt.getTime()}`;

/** Catat satu unduhan. Gagal mencatat tidak boleh menggagalkan unduhan. */
export async function recordLeadMagnetDownload(leadMagnetId: number, userId: number | null) {
  try {
    await db.insert(leadMagnetDownloads).values({ leadMagnetId, userId });
  } catch (e) {
    console.error("[lead-magnet] gagal mencatat unduhan", leadMagnetId, e instanceof Error ? e.message : e);
  }
}

/** Paket ajakan di bawah tombol unduh — hanya paket yang sudah tayang. */
export async function getCtaPackage(packageId: number | null) {
  if (!packageId) return null;
  const [row] = await db
    .select({ id: testPackages.id, title: testPackages.title, isPremium: testPackages.isPremium })
    .from(testPackages)
    .where(and(eq(testPackages.id, packageId), eq(testPackages.status, "published")));
  return row ?? null;
}

function invalidate(id: number, slugs: (string | null | undefined)[]) {
  fileCache.deletePrefix(`f:${id}:`);
  fileCache.deletePrefix(`p:${id}:`);
  for (const s of slugs) if (s) metaCache.delete(s);
}

// ---------- Admin ----------

export type LeadMagnetAdminRow = {
  id: number;
  slug: string;
  title: string;
  fileMime: string;
  fileSize: number;
  requiresLogin: boolean;
  isActive: boolean;
  downloads: number;
  updatedAt: string;
};

export async function listLeadMagnetsAdmin(): Promise<LeadMagnetAdminRow[]> {
  const rows = await db
    .select({
      id: leadMagnets.id,
      slug: leadMagnets.slug,
      title: leadMagnets.title,
      fileMime: leadMagnets.fileMime,
      fileSize: leadMagnets.fileSize,
      requiresLogin: leadMagnets.requiresLogin,
      isActive: leadMagnets.isActive,
      updatedAt: leadMagnets.updatedAt,
      downloads: count(leadMagnetDownloads.id),
    })
    .from(leadMagnets)
    .leftJoin(leadMagnetDownloads, eq(leadMagnetDownloads.leadMagnetId, leadMagnets.id))
    .groupBy(leadMagnets.id)
    .orderBy(desc(leadMagnets.createdAt));
  return rows.map((r) => ({ ...r, updatedAt: r.updatedAt.toISOString() }));
}

export type LeadMagnetEdit = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  previewText: string | null;
  hasPreviewImage: boolean;
  previewUrl: string | null;
  fileName: string;
  fileMime: string;
  fileSize: number;
  requiresLogin: boolean;
  isActive: boolean;
  ctaPackageId: number | null;
};

export async function getLeadMagnetAdmin(id: number): Promise<LeadMagnetEdit | null> {
  const [row] = await db.select(metaColumns).from(leadMagnets).where(eq(leadMagnets.id, id));
  if (!row) return null;
  const hasPreviewImage = Boolean(Number(row.hasPreviewImage));
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    previewText: row.previewText,
    hasPreviewImage,
    previewUrl: hasPreviewImage ? previewImagePath(row) : null,
    fileName: row.fileName,
    fileMime: row.fileMime,
    fileSize: row.fileSize,
    requiresLogin: row.requiresLogin,
    isActive: row.isActive,
    ctaPackageId: row.ctaPackageId,
  };
}

/** Pilihan paket ajakan: paket yang sudah tayang, gratis dulu. */
export async function listCtaPackageOptions() {
  return db
    .select({ id: testPackages.id, title: testPackages.title, isPremium: testPackages.isPremium })
    .from(testPackages)
    .where(eq(testPackages.status, "published"))
    .orderBy(testPackages.isPremium, desc(testPackages.id))
    .limit(300);
}

/** Validasi isi file materi (PDF/PNG/JPG/WebP, dicek dari magic bytes). */
function checkFile(bytes: Buffer, title: string): Result<{ mime: string; name: string }> {
  const format = sniffFormat(bytes);
  if (!format) return { ok: false, error: "File harus PDF, PNG, JPG, atau WebP." };
  return { ok: true, mime: LEAD_MAGNET_FORMATS[format].mime, name: downloadFileName(title, format) };
}

function isDuplicate(error: unknown): boolean {
  const code = (e: unknown) => (typeof e === "object" && e !== null && "code" in e ? (e as { code: unknown }).code : undefined);
  return code(error) === "ER_DUP_ENTRY" || code((error as { cause?: unknown } | null)?.cause) === "ER_DUP_ENTRY";
}

const SLUG_TAKEN = { ok: false as const, error: "Slug sudah dipakai materi lain." };

export async function createLeadMagnet(input: LeadMagnetInput, file: Buffer, userId: number): Promise<Result<{ id: number }>> {
  const checked = checkFile(file, input.title);
  if (!checked.ok) return checked;
  try {
    const [{ id }] = await db
      .insert(leadMagnets)
      .values({
        ...input,
        ctaPackageId: input.ctaPackageId ?? null,
        fileData: file,
        fileName: checked.name,
        fileMime: checked.mime,
        fileSize: file.length,
        createdBy: userId,
      })
      .$returningId();
    invalidate(id, [input.slug]);
    return { ok: true, id };
  } catch (e) {
    if (isDuplicate(e)) return SLUG_TAKEN;
    throw e;
  }
}

/** Ubah data materi; `file` diisi = ganti file. */
export async function updateLeadMagnet(id: number, input: LeadMagnetInput, file: Buffer | null): Promise<Result> {
  const [current] = await db.select({ slug: leadMagnets.slug, fileMime: leadMagnets.fileMime }).from(leadMagnets).where(eq(leadMagnets.id, id));
  if (!current) return { ok: false, error: "Materi tidak ditemukan." };
  let fileFields = {};
  if (file) {
    const checked = checkFile(file, input.title);
    if (!checked.ok) return checked;
    fileFields = { fileData: file, fileName: checked.name, fileMime: checked.mime, fileSize: file.length };
  } else {
    // Judul berubah → nama file unduhan ikut, format tetap.
    const format = (Object.keys(LEAD_MAGNET_FORMATS) as (keyof typeof LEAD_MAGNET_FORMATS)[]).find((f) => LEAD_MAGNET_FORMATS[f].mime === current.fileMime);
    if (format) fileFields = { fileName: downloadFileName(input.title, format) };
  }
  try {
    await db
      .update(leadMagnets)
      .set({ ...input, ctaPackageId: input.ctaPackageId ?? null, ...fileFields, updatedAt: new Date() })
      .where(eq(leadMagnets.id, id));
  } catch (e) {
    if (isDuplicate(e)) return SLUG_TAKEN;
    throw e;
  }
  invalidate(id, [current.slug, input.slug]);
  return { ok: true };
}

/** Pasang (dikompres WebP) atau hapus (`null`) gambar pratinjau. */
export async function setLeadMagnetPreview(id: number, image: Buffer | null): Promise<Result> {
  const [current] = await db.select({ slug: leadMagnets.slug }).from(leadMagnets).where(eq(leadMagnets.id, id));
  if (!current) return { ok: false, error: "Materi tidak ditemukan." };
  let fields: { previewImage: Buffer | null; previewImageMime: string | null } = { previewImage: null, previewImageMime: null };
  if (image) {
    const format = sniffFormat(image);
    if (format !== "png" && format !== "jpeg" && format !== "webp") return { ok: false, error: "Gambar pratinjau harus PNG, JPG, atau WebP." };
    const compressed = await compressImage(image);
    fields = { previewImage: compressed.data, previewImageMime: compressed.mime };
  }
  await db.update(leadMagnets).set({ ...fields, updatedAt: new Date() }).where(eq(leadMagnets.id, id));
  invalidate(id, [current.slug]);
  return { ok: true };
}

export async function setLeadMagnetActive(id: number, isActive: boolean): Promise<Result> {
  const [current] = await db.select({ slug: leadMagnets.slug }).from(leadMagnets).where(eq(leadMagnets.id, id));
  if (!current) return { ok: false, error: "Materi tidak ditemukan." };
  await db.update(leadMagnets).set({ isActive, updatedAt: new Date() }).where(eq(leadMagnets.id, id));
  invalidate(id, [current.slug]);
  return { ok: true };
}
