// Nilai enum dibagi dengan skema Drizzle (lihat docs/DATABASE.md §Enum penting).

// Tipe soal lain (mis. pilihan ganda kompleks) bisa ditambah di sini nanti.
export const QUESTION_TYPES = ["single_choice"] as const;
export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export const QUESTION_STATUSES = ["draft", "pending_review", "published"] as const;
export const OPTION_LABELS = ["A", "B", "C", "D", "E"] as const;
export const PACKAGE_STATUSES = ["draft", "published"] as const;

export type OptionLabel = (typeof OPTION_LABELS)[number];
export type Difficulty = (typeof DIFFICULTIES)[number];
