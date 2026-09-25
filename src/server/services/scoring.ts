// Logika skor — HANYA dipanggil di server (saat finalize attempt).
// Aturan (docs/DATABASE.md §Aturan skor, DECISIONS 2026-09-25):
// benar penuh = 1 poin (atau `points_override`), selain itu 0 — berlaku
// untuk semua bentuk soal (PGK tidak ada skor parsial).
//   pg           : opsi terpilih = kunci.
//   pgk_mcma     : himpunan opsi terpilih PERSIS sama dengan himpunan kunci.
//   pgk_kategori : SEMUA pernyataan dijawab dan kategorinya sesuai kunci.

import type { AnswerResponse } from "@/lib/validation/attempt";
import type { QuestionType } from "@/lib/validation/enums";

export type ScorableOption = {
  id: number;
  /** PG & PGK MCMA. */
  isCorrect: boolean;
  /** PGK Kategori. */
  correctCategory?: string | null;
};

export type ScorableQuestion = {
  questionId: number;
  subtopicId: number;
  type: QuestionType;
  options: ScorableOption[];
  /** PGK Kategori: pasangan kategori yang sah. */
  categoryLabels?: readonly string[] | null;
  /** `test_package_questions.points_override`. */
  pointsOverride?: number | null;
};

/** questionId → jawaban (null/undefined = tidak dijawab). */
export type AnswerMap = ReadonlyMap<number, AnswerResponse | null | undefined>;

/**
 * - `blank`   : tidak ada jawaban sah.
 * - `partial` : PGK Kategori baru sebagian pernyataan dijawab.
 * - `complete`: jawaban lengkap (belum tentu benar).
 */
export type Completeness = "blank" | "partial" | "complete";

export type QuestionScore = {
  questionId: number;
  subtopicId: number;
  /** Ada jawaban sah (termasuk sebagian) — dipakai statistik "kosong". */
  answered: boolean;
  completeness: Completeness;
  isCorrect: boolean;
  score: number;
  maxScore: number;
};

export type AttemptScore = {
  totalScore: number;
  maxScore: number;
  questions: QuestionScore[];
};

export const DEFAULT_POINTS = 1;

type Evaluation = { completeness: Completeness; isCorrect: boolean };

const BLANK: Evaluation = { completeness: "blank", isCorrect: false };

// Opsi/pernyataan yang bukan milik soal diabaikan (defensif terhadap payload
// client yang dimanipulasi). Bentuk jawaban yang tidak cocok = tidak dijawab.
function evaluate(q: ScorableQuestion, response: AnswerResponse | null | undefined): Evaluation {
  if (!response || response.type !== q.type) return BLANK;
  const byId = new Map(q.options.map((o) => [o.id, o]));

  switch (response.type) {
    case "pg": {
      const option = byId.get(response.optionId);
      return option ? { completeness: "complete", isCorrect: option.isCorrect } : BLANK;
    }
    case "pgk_mcma": {
      const chosen = new Set(response.optionIds.filter((id) => byId.has(id)));
      if (chosen.size === 0) return BLANK;
      const keys = q.options.filter((o) => o.isCorrect).map((o) => o.id);
      const isCorrect = keys.length > 0 && chosen.size === keys.length && keys.every((id) => chosen.has(id));
      return { completeness: "complete", isCorrect };
    }
    case "pgk_kategori": {
      const labels = new Set(q.categoryLabels ?? []);
      const given = new Map<number, string>();
      for (const a of response.answers) {
        if (byId.has(a.optionId) && labels.has(a.category) && !given.has(a.optionId)) given.set(a.optionId, a.category);
      }
      if (given.size === 0) return BLANK;
      if (given.size < q.options.length) return { completeness: "partial", isCorrect: false };
      const isCorrect = q.options.every((o) => o.correctCategory != null && given.get(o.id) === o.correctCategory);
      return { completeness: "complete", isCorrect };
    }
  }
}

export function scoreQuestion(question: ScorableQuestion, response: AnswerResponse | null | undefined): QuestionScore {
  const { completeness, isCorrect } = evaluate(question, response);
  const maxScore = question.pointsOverride ?? DEFAULT_POINTS;
  return {
    questionId: question.questionId,
    subtopicId: question.subtopicId,
    answered: completeness !== "blank",
    completeness,
    isCorrect,
    score: isCorrect ? maxScore : 0,
    maxScore,
  };
}

export function scoreAttempt(questions: ScorableQuestion[], answers: AnswerMap): AttemptScore {
  const scored = questions.map((q) => scoreQuestion(q, answers.get(q.questionId)));
  return {
    totalScore: scored.reduce((sum, q) => sum + q.score, 0),
    maxScore: scored.reduce((sum, q) => sum + q.maxScore, 0),
    questions: scored,
  };
}
