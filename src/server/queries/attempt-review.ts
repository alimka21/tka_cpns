// Query pembahasan attempt: soal + kunci + jawaban siswa + pembahasan.
// Kunci jawaban BOLEH dikirim ke client di sini karena hanya dipanggil untuk
// attempt yang SUDAH selesai (submitted/expired) dan milik siswa itu sendiri.

import { eq, inArray } from "drizzle-orm";
import type { AnswerResponse } from "@/lib/validation/attempt";
import type { QuestionType } from "@/lib/validation/enums";
import { db } from "@/server/db";
import { attemptAnswers, attempts, questionExplanations, subtopics } from "@/server/db/schema";
import { renderMathToHtml } from "@/server/services/math-render";
import { scoreQuestion, type Completeness } from "@/server/services/scoring";
import { getPackageDetail } from "./packages";

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

export type AttemptReview = {
  attemptId: number;
  packageTitle: string;
  items: ReviewItem[];
  stimuli: { id: number; title: string; html: string; imageUrl: string | null }[];
};

/** `null` bila attempt tidak ada, bukan milik `userId`, atau belum selesai. */
export async function getAttemptReview(attemptId: number, userId: number): Promise<AttemptReview | null> {
  const [attempt] = await db.select().from(attempts).where(eq(attempts.id, attemptId));
  if (!attempt || attempt.userId !== userId || attempt.status === "in_progress") return null;

  const pkg = await getPackageDetail(attempt.testPackageId);
  if (!pkg) return null;

  const questionIds = pkg.questions.map((q) => q.id);
  const subtopicIds = [...new Set(pkg.questions.map((q) => q.subtopicId))];
  const [answerRows, explanationRows, subtopicRows] = await Promise.all([
    db
      .select({ questionId: attemptAnswers.questionId, response: attemptAnswers.response })
      .from(attemptAnswers)
      .where(eq(attemptAnswers.attemptId, attemptId)),
    questionIds.length
      ? db
          .select({ questionId: questionExplanations.questionId, text: questionExplanations.explanationText })
          .from(questionExplanations)
          .where(inArray(questionExplanations.questionId, questionIds))
      : [],
    subtopicIds.length
      ? db.select({ id: subtopics.id, name: subtopics.name }).from(subtopics).where(inArray(subtopics.id, subtopicIds))
      : [],
  ]);
  const answers = new Map(answerRows.map((r) => [r.questionId, r.response as AnswerResponse | null]));
  const explanations = new Map(explanationRows.map((r) => [r.questionId, r.text]));
  const subtopicNames = new Map(subtopicRows.map((r) => [r.id, r.name]));

  const items = pkg.questions.map((q, i): ReviewItem => {
    const response = answers.get(q.id) ?? null;
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
    const explanation = explanations.get(q.id);

    return {
      number: i + 1,
      questionId: q.id,
      type: q.type,
      html: renderMathToHtml(q.questionText),
      imageUrl: q.imageUrl,
      subtopic: subtopicNames.get(q.subtopicId) ?? "",
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
      explanationHtml: explanation?.trim() ? renderMathToHtml(explanation) : null,
    };
  });

  return {
    attemptId,
    packageTitle: pkg.title,
    items,
    stimuli: pkg.stimuli.map((s) => ({ id: s.id, title: s.title, html: renderMathToHtml(s.content), imageUrl: s.imageUrl })),
  };
}
