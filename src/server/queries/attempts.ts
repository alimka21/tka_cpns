// Query baca hasil attempt untuk siswa: dashboard (ringkasan & riwayat) dan
// halaman /hasil/[attemptId]. Menghitung ulang benar/salah/kosong dari
// jawaban tersimpan lewat scoreAttempt (fungsi murni yang sama dipakai saat
// finalize) — bukan cuma membaca ringkasan subtopik.

import { and, desc, eq, inArray, ne, sql } from "drizzle-orm";
import type { AnswerResponse } from "@/lib/validation/attempt";
import { db } from "@/server/db";
import {
  attemptAnswers,
  attemptSubtopicScores,
  attempts,
  categories,
  subtopics,
  testPackages,
  topics,
} from "@/server/db/schema";
import { getPackageDetail } from "./packages";
import { scoreAttempt, type AnswerMap, type ScorableQuestion } from "@/server/services/scoring";

function shortLabel(name: string, max = 18) {
  return name.length <= max ? name : `${name.slice(0, max - 1).trimEnd()}…`;
}

const dateLabel = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "Asia/Jakarta" });

export type AttemptResult = {
  attemptId: number;
  packageId: number;
  packageTitle: string;
  jenjang: string;
  finishedAt: string;
  durationUsedMinutes: number;
  durationMinutes: number;
  /** 0–100. */
  score: number;
  correct: number;
  wrong: number;
  blank: number;
  total: number;
  subtopics: { subtopic: string; short: string; topic: string; correct: number; total: number; percentage: number }[];
  trend: { label: string; score: number }[];
};

/** `null` bila attempt tidak ada, bukan milik `userId`, atau belum selesai. */
export async function getAttemptResult(attemptId: number, userId: number): Promise<AttemptResult | null> {
  const [attempt] = await db.select().from(attempts).where(eq(attempts.id, attemptId));
  if (!attempt || attempt.userId !== userId || attempt.status === "in_progress") return null;

  const [pkgRow] = await db
    .select({ title: testPackages.title, durationMinutes: testPackages.durationMinutes, jenjang: categories.code })
    .from(testPackages)
    .innerJoin(categories, eq(categories.id, testPackages.categoryId))
    .where(eq(testPackages.id, attempt.testPackageId));
  if (!pkgRow) return null;

  const pkg = await getPackageDetail(attempt.testPackageId);
  let correct = 0;
  let blank = 0;
  let total = 0;
  if (pkg) {
    const scorable: ScorableQuestion[] = pkg.questions.map((q) => ({
      questionId: q.id,
      subtopicId: q.subtopicId,
      type: q.type,
      options: q.options.map((o) => ({ id: o.id, isCorrect: o.isCorrect, correctCategory: o.correctCategory })),
      categoryLabels: q.categoryLabels,
      pointsOverride: q.pointsOverride,
    }));
    const answerRows = await db
      .select({ questionId: attemptAnswers.questionId, response: attemptAnswers.response })
      .from(attemptAnswers)
      .where(eq(attemptAnswers.attemptId, attemptId));
    const answerMap: AnswerMap = new Map(answerRows.map((r) => [r.questionId, r.response as AnswerResponse | null]));
    const scored = scoreAttempt(scorable, answerMap);
    total = scored.questions.length;
    correct = scored.questions.filter((q) => q.isCorrect).length;
    blank = scored.questions.filter((q) => q.completeness === "blank").length;
  }
  const wrong = Math.max(0, total - correct - blank);

  const subtopicRows = await db
    .select({
      subtopic: subtopics.name,
      topic: topics.name,
      correctCount: attemptSubtopicScores.correctCount,
      totalCount: attemptSubtopicScores.totalCount,
      percentage: attemptSubtopicScores.percentage,
    })
    .from(attemptSubtopicScores)
    .innerJoin(subtopics, eq(subtopics.id, attemptSubtopicScores.subtopicId))
    .innerJoin(topics, eq(topics.id, subtopics.topicId))
    .where(eq(attemptSubtopicScores.attemptId, attemptId))
    .orderBy(attemptSubtopicScores.percentage);

  const trendRows = await db
    .select({ submittedAt: attempts.submittedAt, totalScore: attempts.totalScore, maxScore: attempts.maxScore })
    .from(attempts)
    .where(and(eq(attempts.userId, userId), eq(attempts.testPackageId, attempt.testPackageId), eq(attempts.status, "submitted")))
    .orderBy(attempts.submittedAt)
    .limit(10);

  const finishedAt = attempt.submittedAt ?? attempt.startedAt;
  const durationUsedMinutes = Math.max(1, Math.round((finishedAt.getTime() - attempt.startedAt.getTime()) / 60_000));
  const score = attempt.maxScore ? Math.round(((attempt.totalScore ?? 0) / attempt.maxScore) * 100) : 0;

  return {
    attemptId: attempt.id,
    packageId: attempt.testPackageId,
    packageTitle: pkgRow.title,
    jenjang: pkgRow.jenjang,
    finishedAt: finishedAt.toISOString(),
    durationUsedMinutes,
    durationMinutes: pkgRow.durationMinutes,
    score,
    correct,
    wrong,
    blank,
    total,
    subtopics: subtopicRows.map((s) => ({
      subtopic: s.subtopic,
      short: shortLabel(s.subtopic),
      topic: s.topic,
      correct: s.correctCount,
      total: s.totalCount,
      percentage: Number(s.percentage),
    })),
    trend: trendRows
      .filter((t): t is typeof t & { submittedAt: Date; maxScore: number } => t.submittedAt != null && !!t.maxScore)
      .map((t) => ({ label: dateLabel.format(t.submittedAt), score: Math.round(((t.totalScore ?? 0) / t.maxScore) * 100) })),
  };
}

export type StudentHistoryItem = {
  attemptId: number;
  /** `expired` = waktu habis sebelum siswa menekan kirim (tetap dinilai). */
  status: "submitted" | "expired";
  packageTitle: string;
  jenjang: string;
  finishedAt: string;
  correct: number;
  total: number;
  score: number;
};

/** Tes yang sudah selesai (dikirim atau waktu habis), terbaru dulu. */
export async function listStudentHistory(userId: number, limit = 10): Promise<StudentHistoryItem[]> {
  const rows = await db
    .select({
      attemptId: attempts.id,
      status: attempts.status,
      startedAt: attempts.startedAt,
      packageTitle: testPackages.title,
      jenjang: categories.code,
      submittedAt: attempts.submittedAt,
      totalScore: attempts.totalScore,
      maxScore: attempts.maxScore,
    })
    .from(attempts)
    .innerJoin(testPackages, eq(testPackages.id, attempts.testPackageId))
    .innerJoin(categories, eq(categories.id, testPackages.categoryId))
    .where(and(eq(attempts.userId, userId), ne(attempts.status, "in_progress")))
    .orderBy(desc(attempts.startedAt))
    .limit(limit);
  if (rows.length === 0) return [];

  const totals = await db
    .select({
      attemptId: attemptSubtopicScores.attemptId,
      correct: sql<number>`sum(${attemptSubtopicScores.correctCount})`,
      total: sql<number>`sum(${attemptSubtopicScores.totalCount})`,
    })
    .from(attemptSubtopicScores)
    .where(inArray(attemptSubtopicScores.attemptId, rows.map((r) => r.attemptId)))
    .groupBy(attemptSubtopicScores.attemptId);
  const totalsByAttempt = new Map(totals.map((t) => [t.attemptId, { correct: Number(t.correct), total: Number(t.total) }]));

  return rows.map((r) => ({
    attemptId: r.attemptId,
    status: r.status === "expired" ? "expired" : "submitted",
    packageTitle: r.packageTitle,
    jenjang: r.jenjang,
    finishedAt: (r.submittedAt ?? r.startedAt).toISOString(),
    correct: totalsByAttempt.get(r.attemptId)?.correct ?? 0,
    total: totalsByAttempt.get(r.attemptId)?.total ?? 0,
    score: r.maxScore ? Math.round(((r.totalScore ?? 0) / r.maxScore) * 100) : 0,
  }));
}
