import { z } from "zod";

// Lead magnet (/materi/[slug]) — validasi form admin & isi file unggahan.

export const LEAD_MAGNET_MAX_BYTES = 10 * 1024 * 1024;
export const LEAD_MAGNET_PREVIEW_MAX_BYTES = 5 * 1024 * 1024;

/** Format yang boleh diunggah sebagai file materi (dicek dari ISI file, bukan MIME browser). */
export const LEAD_MAGNET_FORMATS = {
  pdf: { mime: "application/pdf", ext: "pdf", label: "PDF" },
  png: { mime: "image/png", ext: "png", label: "PNG" },
  jpeg: { mime: "image/jpeg", ext: "jpg", label: "JPG" },
  webp: { mime: "image/webp", ext: "webp", label: "WebP" },
} as const;
export type LeadMagnetFormat = keyof typeof LEAD_MAGNET_FORMATS;
export const LEAD_MAGNET_ACCEPT = Object.values(LEAD_MAGNET_FORMATS)
  .map((f) => f.mime)
  .join(",");

/** Kenali format dari magic bytes. Tidak dikenal → null. */
export function sniffFormat(bytes: Uint8Array): LeadMagnetFormat | null {
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.subarray(from, to));
  if (bytes.length >= 5 && ascii(0, 5) === "%PDF-") return "pdf";
  if (bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, i) => bytes[i] === b)) return "png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  if (bytes.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp";
  return null;
}

/** Nama file unduhan yang aman untuk header Content-Disposition. */
export function downloadFileName(title: string, format: LeadMagnetFormat) {
  const base =
    title
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 80) || "materi";
  return `${base}.${LEAD_MAGNET_FORMATS[format].ext}`;
}

export const LEAD_MAGNET_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Maksimal ${max} karakter`)
    .transform((v) => v || null)
    .nullish();

export const leadMagnetInput = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Slug minimal 3 karakter")
    .max(80, "Slug maksimal 80 karakter")
    .regex(LEAD_MAGNET_SLUG, "Slug hanya huruf kecil, angka, dan tanda hubung (mis. tips-gelombang-2)"),
  title: z.string().trim().min(3, "Judul minimal 3 karakter").max(200),
  description: optionalText(2000),
  previewText: optionalText(5000),
  requiresLogin: z.boolean(),
  isActive: z.boolean(),
  ctaPackageId: z.coerce.number().int().positive().nullish(),
});
export type LeadMagnetInput = z.infer<typeof leadMagnetInput>;
