// Query pembahasan attempt: soal + kunci + jawaban siswa + pembahasan.
// Kunci jawaban BOLEH dikirim ke client di sini karena hanya dipanggil untuk
// attempt yang SUDAH selesai (submitted/expired) dan milik siswa itu sendiri.

import { eq, inArray } from "drizzle-orm";
import type { AnswerResponse } from "@/lib/validation/attempt";
import { db } from "@/server/db";
import { attemptAnswers, attempts, questionExplanations, subtopics } from "@/server/db/schema";
import { renderMathToHtml } from "@/server/services/math-render";
import { buildReviewItem } from "@/server/services/review";
import type { ReviewItem } from "@/lib/review";
import { getPackageDetail } from "./packages";

export type { ReviewItem, ReviewOption } from "@/lib/review";

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

  const items = pkg.questions.map((q, i) =>
    buildReviewItem(q, answers.get(q.id) ?? null, i + 1, subtopicNames.get(q.subtopicId) ?? "", explanations.get(q.id)),
  );

  return {
    attemptId,
    packageTitle: pkg.title,
    items,
    stimuli: pkg.stimuli.map((s) => ({ id: s.id, title: s.title, html: renderMathToHtml(s.content), imageUrl: s.imageUrl })),
  };
}
