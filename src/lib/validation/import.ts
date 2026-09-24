import { z } from "zod";
import { OPTION_LABELS, type Difficulty } from "./enums";

// Kolom baku template import (ARCHITECTURE §3.4). Urutan = urutan kolom Excel.
export const IMPORT_COLUMNS = [
  "topik",
  "subtopik",
  "pertanyaan",
  "opsi_a",
  "opsi_b",
  "opsi_c",
  "opsi_d",
  "opsi_e",
  "kunci",
  "pembahasan",
  "tingkat_kesulitan",
] as const;

export type ImportColumn = (typeof IMPORT_COLUMNS)[number];
export type RawImportRow = Partial<Record<ImportColumn, string>>;

const DIFFICULTY_ALIASES: Record<string, Difficulty> = {
  mudah: "easy",
  easy: "easy",
  sedang: "medium",
  medium: "medium",
  sulit: "hard",
  susah: "hard",
  hard: "hard",
};

const required = (label: string) => z.string().trim().min(1, `${label} wajib diisi`);
const optional = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));

export const importRowSchema = z
  .object({
    topik: required("Topik"),
    subtopik: required("Subtopik"),
    pertanyaan: required("Pertanyaan"),
    opsi_a: required("Opsi A"),
    opsi_b: required("Opsi B"),
    opsi_c: required("Opsi C"),
    opsi_d: required("Opsi D"),
    opsi_e: optional,
    kunci: z
      .string()
      .trim()
      .toUpperCase()
      .pipe(z.enum(OPTION_LABELS, "Kunci harus salah satu dari A–E")),
    pembahasan: optional,
    tingkat_kesulitan: z
      .string()
      .trim()
      .toLowerCase()
      .refine((v) => v in DIFFICULTY_ALIASES, "Tingkat kesulitan harus mudah/sedang/sulit")
      .transform((v) => DIFFICULTY_ALIASES[v]),
  })
  .refine((r) => r.kunci !== "E" || r.opsi_e !== undefined, {
    path: ["kunci"],
    message: "Kunci E tapi opsi E kosong",
  })
  .transform((r) => {
    const texts = [r.opsi_a, r.opsi_b, r.opsi_c, r.opsi_d, r.opsi_e].filter(
      (t): t is string => t !== undefined,
    );
    return {
      topicName: r.topik,
      subtopicName: r.subtopik,
      questionText: r.pertanyaan,
      difficulty: r.tingkat_kesulitan,
      explanationText: r.pembahasan ?? null,
      options: texts.map((optionText, i) => ({
        label: OPTION_LABELS[i],
        optionText,
        isCorrect: OPTION_LABELS[i] === r.kunci,
        scoreWeight: null,
      })),
    };
  });

export type ImportRow = z.output<typeof importRowSchema>;

export type ImportRowError = { rowNumber: number; messages: string[] };

export type ImportValidationResult = {
  valid: (ImportRow & { rowNumber: number })[];
  errors: ImportRowError[];
};

/** `rowNumber` = nomor baris di Excel (header = baris 1). */
export function validateImportRows(
  rows: { rowNumber: number; data: RawImportRow }[],
): ImportValidationResult {
  const result: ImportValidationResult = { valid: [], errors: [] };
  for (const { rowNumber, data } of rows) {
    // Sel kosong di Excel tidak ikut ter-parse; samakan jadi "" supaya
    // pesan error-nya "wajib diisi", bukan "expected string".
    const normalized = Object.fromEntries(IMPORT_COLUMNS.map((c) => [c, data[c] ?? ""]));
    const parsed = importRowSchema.safeParse(normalized);
    if (parsed.success) {
      result.valid.push({ rowNumber, ...parsed.data });
    } else {
      result.errors.push({
        rowNumber,
        messages: parsed.error.issues.map((i) => i.message),
      });
    }
  }
  return result;
}
