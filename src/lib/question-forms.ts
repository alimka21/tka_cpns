// Label & deskripsi bentuk soal untuk UI (admin, import, bank soal).

import type { QuestionType } from "@/lib/validation/enums";

export const QUESTION_TYPE_META: Record<QuestionType, { short: string; label: string; description: string }> = {
  pg: {
    short: "PG",
    label: "Pilihan Ganda",
    description: "Satu jawaban benar dari 4–5 opsi.",
  },
  pgk_mcma: {
    short: "PGK MCMA",
    label: "PG Kompleks — Multi Jawaban",
    description: "Jawaban benar bisa lebih dari satu (1 s.d. jumlah opsi − 1).",
  },
  pgk_kategori: {
    short: "PGK Kategori",
    label: "PG Kompleks — Kategori",
    description: "3–5 pernyataan, masing-masing diberi kategori Benar/Salah atau Sesuai/Tidak Sesuai.",
  },
};
