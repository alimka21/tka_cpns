"use server";

// Lead magnet (admin). Data + file materi dikirim dalam satu panggilan (maks 10 MB);
// gambar pratinjau di panggilan terpisah supaya tiap request tetap di bawah
// batas server action (next.config: 11 MB).

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { LEAD_MAGNET_MAX_BYTES, LEAD_MAGNET_PREVIEW_MAX_BYTES, leadMagnetInput } from "@/lib/validation/lead-magnet";
import { getAdminSession } from "@/server/auth/session";
import { createLeadMagnet, setLeadMagnetActive, setLeadMagnetPreview, updateLeadMagnet } from "@/server/services/lead-magnets";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };
const NOT_ADMIN = { ok: false as const, error: "Sesi admin berakhir. Silakan masuk lagi." };
const id = z.number().int().positive();

async function readFile(value: FormDataEntryValue | null, maxBytes: number): Promise<Result<{ bytes: Buffer | null }>> {
  if (!(value instanceof File) || value.size === 0) return { ok: true, bytes: null };
  if (value.size > maxBytes) return { ok: false, error: `Ukuran file maksimal ${Math.round(maxBytes / 1024 / 1024)} MB.` };
  return { ok: true, bytes: Buffer.from(await value.arrayBuffer()) };
}

function parseFields(form: FormData) {
  const text = (k: string) => (typeof form.get(k) === "string" ? (form.get(k) as string) : "");
  return leadMagnetInput.safeParse({
    slug: text("slug"),
    title: text("title"),
    description: text("description"),
    previewText: text("previewText"),
    requiresLogin: form.get("requiresLogin") === "true",
    isActive: form.get("isActive") === "true",
    ctaPackageId: text("ctaPackageId") || null,
  });
}

function revalidate(slug?: string) {
  revalidatePath("/admin/materi");
  if (slug) revalidatePath(`/materi/${slug}`);
}

/** `form.id` kosong = materi baru (file wajib); terisi = ubah (file opsional). */
export async function saveLeadMagnetAction(form: FormData): Promise<Result<{ id: number }>> {
  const session = await getAdminSession();
  if (!session) return NOT_ADMIN;
  const fields = parseFields(form);
  if (!fields.success) return { ok: false, error: fields.error.issues[0].message };
  const file = await readFile(form.get("file"), LEAD_MAGNET_MAX_BYTES);
  if (!file.ok) return file;

  const editId = Number(form.get("id"));
  if (editId) {
    if (!id.safeParse(editId).success) return { ok: false, error: "Materi tidak valid." };
    const result = await updateLeadMagnet(editId, fields.data, file.bytes);
    if (!result.ok) return result;
    revalidate(fields.data.slug);
    return { ok: true, id: editId };
  }
  if (!file.bytes) return { ok: false, error: "Pilih file materi (PDF, PNG, JPG, atau WebP)." };
  const result = await createLeadMagnet(fields.data, file.bytes, Number(session.user.id));
  if (result.ok) revalidate(fields.data.slug);
  return result;
}

/** Gambar pratinjau: `file` = pasang/ganti, `remove=true` = hapus. */
export async function saveLeadMagnetPreviewAction(form: FormData): Promise<Result> {
  if (!(await getAdminSession())) return NOT_ADMIN;
  const parsedId = id.safeParse(Number(form.get("id")));
  if (!parsedId.success) return { ok: false, error: "Materi tidak valid." };
  const file = await readFile(form.get("file"), LEAD_MAGNET_PREVIEW_MAX_BYTES);
  if (!file.ok) return file;
  if (!file.bytes && form.get("remove") !== "true") return { ok: true };
  try {
    const result = await setLeadMagnetPreview(parsedId.data, file.bytes);
    if (result.ok) revalidate();
    return result;
  } catch {
    return { ok: false, error: "File tidak bisa dibaca sebagai gambar." };
  }
}

export async function setLeadMagnetActiveAction(input: { id: number; isActive: boolean }): Promise<Result> {
  if (!(await getAdminSession())) return NOT_ADMIN;
  const parsed = z.object({ id, isActive: z.boolean() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Materi tidak valid." };
  const result = await setLeadMagnetActive(parsed.data.id, parsed.data.isActive);
  if (result.ok) revalidate();
  return result;
}
