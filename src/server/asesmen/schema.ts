// Skema Zod untuk file kerangka asesmen di `asesmen/tka-*.json`.
// Hanya field struktural yang divalidasi ketat; field deskriptif lain
// (muatan, karakteristik teks, dsb.) dibiarkan lewat apa adanya.

import { z } from "zod";

const code = z.string().regex(/^[A-Z]+(-[A-Z0-9]+)*$/, "Kode harus huruf besar/angka dipisah '-'");
const text = z.string().trim().min(1);

const thinkingProcess = z.looseObject({ nama: text, deskripsi: text });

export const cognitiveLevelSchema = z.looseObject({
  kode: z.string().regex(/^L\d$/),
  level: z.number().int().min(1),
  nama: text,
  nama_en: text.optional(),
  deskripsi: text.optional(),
  definisi: text.optional(),
  // Umumnya daftar proses; SMA-FIS memakai satu kalimat deskripsi.
  proses_berpikir: z.union([z.array(thinkingProcess), text]).optional(),
  proses_kognitif: z.array(thinkingProcess).optional(),
});

const subdomainSchema = z.looseObject({
  kode: code,
  urutan: z.number().int().min(1),
  nama: text,
  deskripsi: text.optional(),
  kompetensi: z.union([text, z.array(text)]).optional(),
  cakupan: z.array(text).optional(),
  batasan: text.nullable().optional(),
});

const domainSchema = z.looseObject({
  kode: code,
  urutan: z.number().int().min(1),
  nama: text,
  deskripsi: text.optional(),
  subdomain: z.array(subdomainSchema).min(1),
});

const subjectSchema = z.looseObject({
  kode: code,
  urutan: z.number().int().min(1),
  nama: text,
  nama_lengkap: text,
  tipe: z.enum(["wajib", "pilihan"]),
  tipe_struktur: z.enum(["kompetensi_subkompetensi", "elemen_subelemen"]),
  deskripsi: text,
  level_kognitif: z.array(cognitiveLevelSchema).optional(),
  level_kognitif_ref: z.string().optional(),
  domain: z.array(domainSchema).min(1),
});

export const frameworkFileSchema = z.looseObject({
  meta: z.looseObject({
    kode_jenjang: z.enum(["SD", "SMP", "SMA"]),
    nama_jenjang: text,
    versi_file: z.string().regex(/^\d+\.\d+\.\d+$/),
  }),
  referensi_regulasi: z.looseObject({ nomor: text, tentang: text }),
  bentuk_soal: z.array(z.looseObject({ kode: z.enum(["pg", "pgk_mcma", "pgk_kategori"]), nama: text })),
  // Map preset → skema level. Entri non-objek (mis. "catatan") diabaikan loader.
  level_kognitif_preset: z.record(z.string(), z.unknown()).optional(),
  aturan_pemilihan_mata_uji: z
    .looseObject({
      mata_uji_wajib: z.looseObject({ daftar_kode: z.array(code) }),
      mata_uji_pilihan: z.looseObject({ jumlah_dipilih: z.number().int().min(1) }),
    })
    .optional(),
  mata_uji: z.array(subjectSchema).min(1),
});

export const presetSchema = z.looseObject({
  nama: text,
  level: z.array(cognitiveLevelSchema).min(1),
});

export type FrameworkFile = z.infer<typeof frameworkFileSchema>;
export type RawCognitiveLevel = z.infer<typeof cognitiveLevelSchema>;
