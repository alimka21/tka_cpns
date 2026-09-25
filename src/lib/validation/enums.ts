// Nilai enum dibagi dengan skema Drizzle (lihat docs/DATABASE.md §Enum penting).

// Bentuk soal sesuai kerangka asesmen TKA (asesmen/*.json → bentuk_soal):
// pg = pilihan ganda sederhana, pgk_mcma = PG kompleks multi jawaban,
// pgk_kategori = PG kompleks kategori (tiap pernyataan diberi kategori).
export const QUESTION_TYPES = ["pg", "pgk_mcma", "pgk_kategori"] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

/** Pasangan kategori PGK Kategori yang diizinkan kerangka. */
export const CATEGORY_PAIRS = [
  ["Benar", "Salah"],
  ["Sesuai", "Tidak Sesuai"],
] as const;
export type CategoryPair = (typeof CATEGORY_PAIRS)[number];
export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export const QUESTION_STATUSES = ["draft", "pending_review", "published"] as const;
export const OPTION_LABELS = ["A", "B", "C", "D", "E"] as const;
export const PACKAGE_STATUSES = ["draft", "published"] as const;

export const STIMULUS_STATUSES = ["draft", "published"] as const;

export type OptionLabel = (typeof OPTION_LABELS)[number];
export type Difficulty = (typeof DIFFICULTIES)[number];
