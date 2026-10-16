import { z } from "zod";

/** 38 provinsi Indonesia (Kemendagri, sejak pemekaran Papua 2022). Disimpan sebagai nama. */
export const PROVINCES = [
  "Aceh",
  "Sumatera Utara",
  "Sumatera Barat",
  "Riau",
  "Kepulauan Riau",
  "Jambi",
  "Sumatera Selatan",
  "Kepulauan Bangka Belitung",
  "Bengkulu",
  "Lampung",
  "DKI Jakarta",
  "Jawa Barat",
  "Banten",
  "Jawa Tengah",
  "DI Yogyakarta",
  "Jawa Timur",
  "Bali",
  "Nusa Tenggara Barat",
  "Nusa Tenggara Timur",
  "Kalimantan Barat",
  "Kalimantan Tengah",
  "Kalimantan Selatan",
  "Kalimantan Timur",
  "Kalimantan Utara",
  "Sulawesi Utara",
  "Gorontalo",
  "Sulawesi Tengah",
  "Sulawesi Barat",
  "Sulawesi Selatan",
  "Sulawesi Tenggara",
  "Maluku",
  "Maluku Utara",
  "Papua",
  "Papua Barat",
  "Papua Barat Daya",
  "Papua Selatan",
  "Papua Tengah",
  "Papua Pegunungan",
] as const;

export type Province = (typeof PROVINCES)[number];

export const provinceSchema = z.enum(PROVINCES, "Pilih provinsi asal.");

/** Nama sekolah: 3–150 karakter, spasi berlebih dirapikan. */
export const schoolNameSchema = z
  .string()
  .transform((v) => v.trim().replace(/\s+/g, " "))
  .pipe(z.string().min(3, "Isi nama sekolah (minimal 3 karakter).").max(150, "Nama sekolah maksimal 150 karakter."));
