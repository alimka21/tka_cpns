import { z } from "zod";
import {
  CATEGORY_PAIRS,
  OPTION_LABELS,
  QUESTION_TYPES,
  type CategoryPair,
  type Difficulty,
  type OptionLabel,
  type QuestionType,
} from "./enums";
import { questionInput } from "./question";

// Kolom baku template import (ARCHITECTURE §3.4). Urutan = urutan kolom Excel.
export const IMPORT_COLUMNS = [
  "kode_subdomain",
  "bentuk_soal",
  "pertanyaan",
  "opsi_a",
  "opsi_b",
  "opsi_c",
  "opsi_d",
  "opsi_e",
  "kunci",
  "kategori",
  "pembahasan",
  "tingkat_kesulitan",
  "level_kognitif",
  "kode_stimulus",
] as const;

export type ImportColumn = (typeof IMPORT_COLUMNS)[number];
export type RawImportRow = Partial<Record<ImportColumn, string>>;

/** Kolom yang boleh tidak ada di file (selain itu wajib ada header-nya). */
export const IMPORT_OPTIONAL_COLUMNS: readonly ImportColumn[] = [
  "bentuk_soal",
  "opsi_d",
  "opsi_e",
  "kategori",
  "pembahasan",
  "level_kognitif",
  "kode_stimulus",
];

/** Kolom sheet "Stimulus" (opsional; wajib ada bila soal memakai kode_stimulus). */
export const STIMULUS_COLUMNS = ["kode_stimulus", "judul", "isi", "url_gambar"] as const;
export type StimulusColumn = (typeof STIMULUS_COLUMNS)[number];

const DIFFICULTY_ALIASES: Record<string, Difficulty> = {
  mudah: "easy",
  easy: "easy",
  sedang: "medium",
  medium: "medium",
  sulit: "hard",
  susah: "hard",
  hard: "hard",
};

const TYPE_ALIASES: Record<string, QuestionType> = {
  "": "pg",
  pg: "pg",
  "pilihan ganda": "pg",
  pgk_mcma: "pgk_mcma",
  "pgk mcma": "pgk_mcma",
  mcma: "pgk_mcma",
  pgk_kategori: "pgk_kategori",
  "pgk kategori": "pgk_kategori",
  kategori: "pgk_kategori",
};

// Singkatan kunci PGK Kategori per pasangan kategori.
const CATEGORY_KEY_ALIASES: Record<string, Record<string, string>> = {
  "Benar/Salah": { B: "Benar", BENAR: "Benar", S: "Salah", SALAH: "Salah" },
  "Sesuai/Tidak Sesuai": { S: "Sesuai", SESUAI: "Sesuai", TS: "Tidak Sesuai", "TIDAK SESUAI": "Tidak Sesuai" },
};

const required = (label: string) => z.string().trim().min(1, `${label} wajib diisi`);
const optional = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));

const rawRowSchema = z.object({
  // Keberadaan kode di kerangka asesmen dicek di server (question-import.ts).
  kode_subdomain: required("Kode subdomain")
    .toUpperCase()
    .regex(/^(SD|SMP|SMA|SMK)(-[A-Z0-9]+)+$/, "Kode subdomain tidak dikenali (contoh: SMP-MTK-D1-S1)"),
  bentuk_soal: z
    .string()
    .trim()
    .toLowerCase()
    .refine((v) => v in TYPE_ALIASES, `Bentuk soal harus ${QUESTION_TYPES.join(", ")}`)
    .transform((v) => TYPE_ALIASES[v]),
  pertanyaan: required("Pertanyaan"),
  opsi_a: optional,
  opsi_b: optional,
  opsi_c: optional,
  opsi_d: optional,
  opsi_e: optional,
  kunci: required("Kunci"),
  kategori: optional,
  pembahasan: optional,
  tingkat_kesulitan: z
    .string()
    .trim()
    .toLowerCase()
    .refine((v) => v in DIFFICULTY_ALIASES, "Tingkat kesulitan harus mudah/sedang/sulit")
    .transform((v) => DIFFICULTY_ALIASES[v]),
  level_kognitif: optional.pipe(
    z
      .string()
      .transform((v) => v.toUpperCase())
      .pipe(z.enum(["L1", "L2", "L3"], "Level kognitif harus L1, L2, atau L3"))
      .optional(),
  ),
  kode_stimulus: optional.pipe(
    z
      .string()
      .transform((v) => v.toUpperCase())
      .pipe(z.string().regex(/^[A-Z0-9]+(-[A-Z0-9]+)*$/, "Kode stimulus hanya huruf, angka, dan tanda -").max(32))
      .optional(),
  ),
});

export type ImportRow = {
  subdomainCode: string;
  type: QuestionType;
  questionText: string;
  difficulty: Difficulty;
  cognitiveLevel: string | null;
  explanationText: string | null;
  categoryLabels: CategoryPair | null;
  stimulusCode: string | null;
  options: { label: OptionLabel; optionText: string; isCorrect: boolean; correctCategory: string | null }[];
};

export type ImportRowError = { rowNumber: number; messages: string[]; sheet?: "Soal" | "Stimulus" };

export type ImportValidationResult = {
  valid: (ImportRow & { rowNumber: number })[];
  errors: ImportRowError[];
};

function parseCategoryPair(value: string | undefined): CategoryPair | null {
  if (!value) return null;
  const normalized = value.replace(/\s*[/|,]\s*/g, "/").toLowerCase();
  return CATEGORY_PAIRS.find((p) => p.join("/").toLowerCase() === normalized) ?? null;
}

/** Ubah satu baris Excel (sudah lolos format) jadi soal; kembalikan pesan error bila gagal. */
function buildRow(r: z.output<typeof rawRowSchema>): { row: ImportRow } | { errors: string[] } {
  const errors: string[] = [];

  const texts = [r.opsi_a, r.opsi_b, r.opsi_c, r.opsi_d, r.opsi_e];
  const lastFilled = texts.findLastIndex((t) => t !== undefined);
  if (texts.slice(0, lastFilled + 1).some((t) => t === undefined)) {
    errors.push("Opsi harus diisi berurutan tanpa loncat (opsi_a, opsi_b, ...)");
  }
  const optionTexts = texts.filter((t): t is string => t !== undefined);
  const labels = OPTION_LABELS.slice(0, optionTexts.length);

  let correctLabels = new Set<string>();
  let categories: string[] = [];
  let categoryLabels: CategoryPair | null = null;

  if (r.bentuk_soal === "pgk_kategori") {
    categoryLabels = parseCategoryPair(r.kategori);
    if (!categoryLabels) {
      errors.push(`Kolom kategori wajib untuk PGK Kategori: ${CATEGORY_PAIRS.map((p) => p.join("/")).join(" atau ")}`);
    } else {
      const aliases = CATEGORY_KEY_ALIASES[categoryLabels.join("/")];
      const tokens = r.kunci.split(/\s*[,;]\s*/).map((t) => t.trim().toUpperCase());
      categories = tokens.map((t) => aliases[t] ?? "");
      if (tokens.length !== optionTexts.length) {
        errors.push(`Kunci PGK Kategori harus ${optionTexts.length} nilai (satu per pernyataan), mis. ${categoryLabels[0] === "Benar" ? "B,S,B" : "S,TS,S"}`);
      } else if (categories.some((c) => c === "")) {
        errors.push(`Kunci PGK Kategori hanya boleh ${Object.keys(aliases).join("/")}`);
      }
    }
  } else {
    if (r.kategori) errors.push("Kolom kategori hanya untuk PGK Kategori");
    const tokens = r.kunci.toUpperCase().split(/[\s,;]+/).filter(Boolean);
    const invalid = tokens.filter((t) => !(labels as readonly string[]).includes(t));
    if (invalid.length > 0) {
      errors.push(`Kunci ${invalid.join(", ")} tidak ada di antara opsi ${labels.join("–") || "(kosong)"}`);
    }
    if (r.bentuk_soal === "pg" && tokens.length > 1) errors.push("Kunci PG hanya satu huruf (untuk banyak kunci pakai bentuk_soal pgk_mcma)");
    correctLabels = new Set(tokens);
  }
  if (errors.length > 0) return { errors };

  const row: ImportRow = {
    subdomainCode: r.kode_subdomain,
    type: r.bentuk_soal,
    questionText: r.pertanyaan,
    difficulty: r.tingkat_kesulitan,
    cognitiveLevel: r.level_kognitif ?? null,
    explanationText: r.pembahasan ?? null,
    categoryLabels,
    stimulusCode: r.kode_stimulus ?? null,
    options: optionTexts.map((optionText, i) => ({
      label: labels[i],
      optionText,
      isCorrect: correctLabels.has(labels[i]),
      correctCategory: r.bentuk_soal === "pgk_kategori" ? categories[i] : null,
    })),
  };

  // Aturan jumlah opsi/kunci per bentuk = aturan form admin (questionInput).
  const rules = questionInput.safeParse({
    ...row,
    subtopicId: 1,
    stimulusId: row.stimulusCode ? 1 : null,
    stimulusOrder: row.stimulusCode ? 1 : null,
  });
  if (!rules.success) {
    return { errors: [...new Set(rules.error.issues.map((i) => i.message))] };
  }
  return { row };
}

/** `rowNumber` = nomor baris di Excel (header = baris 1). */
export function validateImportRows(rows: { rowNumber: number; data: RawImportRow }[]): ImportValidationResult {
  const result: ImportValidationResult = { valid: [], errors: [] };
  for (const { rowNumber, data } of rows) {
    // Sel kosong di Excel tidak ikut ter-parse; samakan jadi "" supaya
    // pesan error-nya "wajib diisi", bukan "expected string".
    const normalized = Object.fromEntries(IMPORT_COLUMNS.map((c) => [c, data[c] ?? ""]));
    const parsed = rawRowSchema.safeParse(normalized);
    if (!parsed.success) {
      result.errors.push({ rowNumber, messages: parsed.error.issues.map((i) => i.message) });
      continue;
    }
    const built = buildRow(parsed.data);
    if ("errors" in built) result.errors.push({ rowNumber, messages: built.errors });
    else result.valid.push({ rowNumber, ...built.row });
  }
  return result;
}
