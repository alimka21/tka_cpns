// Susun data pembahasan satu soal dari soal (dengan kunci) + jawaban siswa.
// Server-only karena menerima kunci; hasilnya boleh dikirim ke client hanya
// setelah tes selesai.

import type { ReviewItem } from "@/lib/review";
import type { AnswerResponse } from "@/lib/validation/attempt";
import type { QuestionType } from "@/lib/validation/enums";
import { renderMathToHtml, renderRichText } from "@/server/services/math-render";
import { scoreQuestion } from "@/server/services/scoring";

export type ReviewSourceQuestion = {
  id: number;
  type: QuestionType;
  questionText: string;
  imageUrl: string | null;
  subtopicId: number;
  categoryLabels: [string, string] | null;
  stimulusId: number | null;
  options: { id: number; label: string; optionText: string; isCorrect: boolean; correctCategory: string | null }[];
  /** Soal Latihan AI privat. */
  aiPracticeId?: number | null;
};

export function buildReviewItem(
  q: ReviewSourceQuestion,
  response: AnswerResponse | null,
  number: number,
  subtopicName: string,
  explanation: string | null | undefined,
): ReviewItem {
  const scored = scoreQuestion(
    {
      questionId: q.id,
      subtopicId: q.subtopicId,
      type: q.type,
      options: q.options.map((o) => ({ id: o.id, isCorrect: o.isCorrect, correctCategory: o.correctCategory })),
      categoryLabels: q.categoryLabels,
    },
    response,
  );
  // Jawaban yang bentuknya tidak cocok dengan soal diperlakukan kosong (sama seperti skor).
  const matching = response?.type === q.type ? response : null;
  const chosenIds = new Set(
    matching?.type === "pg" ? [matching.optionId] : matching?.type === "pgk_mcma" ? matching.optionIds : [],
  );
  const chosenCategories = new Map(matching?.type === "pgk_kategori" ? matching.answers.map((a) => [a.optionId, a.category]) : []);

  return {
    number,
    questionId: q.id,
    type: q.type,
    html: renderRichText(q.questionText),
    imageUrl: q.imageUrl,
    subtopicId: q.subtopicId,
    subtopic: subtopicName,
    aiPracticeId: q.aiPracticeId ?? null,
    categoryLabels: q.type === "pgk_kategori" ? q.categoryLabels : null,
    stimulusId: q.stimulusId,
    options: q.options.map((o) => ({
      id: o.id,
      label: o.label,
      html: renderMathToHtml(o.optionText),
      isKey: o.isCorrect,
      chosen: chosenIds.has(o.id),
      keyCategory: o.correctCategory,
      chosenCategory: chosenCategories.get(o.id) ?? null,
    })),
    completeness: scored.completeness,
    isCorrect: scored.isCorrect,
    explanationHtml: explanation?.trim() ? renderRichText(explanation) : null,
  };
}
