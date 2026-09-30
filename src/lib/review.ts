// Bentuk data pembahasan per soal (kunci + jawaban siswa + pembahasan).
// Dipakai halaman pembahasan attempt & hasil demo.

import type { QuestionType } from "@/lib/validation/enums";
import type { Completeness } from "@/server/services/scoring";

export type ReviewOption = {
  id: number;
  label: string;
  html: string;
  /** PG & MCMA: opsi kunci. */
  isKey: boolean;
  /** PG & MCMA: dipilih siswa. */
  chosen: boolean;
  /** PGK Kategori: kategori kunci & jawaban siswa (null = tidak dijawab). */
  keyCategory: string | null;
  chosenCategory: string | null;
};

export type ReviewItem = {
  number: number;
  questionId: number;
  type: QuestionType;
  html: string;
  imageUrl: string | null;
  subtopic: string;
  categoryLabels: [string, string] | null;
  stimulusId: number | null;
  options: ReviewOption[];
  completeness: Completeness;
  isCorrect: boolean;
  /** null = soal ini belum punya pembahasan. */
  explanationHtml: string | null;
};

export type ReviewStatus = "benar" | "salah" | "kosong";

export function reviewStatus(item: Pick<ReviewItem, "isCorrect" | "completeness">): ReviewStatus {
  if (item.isCorrect) return "benar";
  return item.completeness === "blank" ? "kosong" : "salah";
}
