// Query Latihan Kelemahan (Fase 2.5). Kunci jawaban hanya keluar dari sini
// dalam bentuk ReviewItem untuk soal yang SUDAH dijawab siswa di sesi itu.

import { and, asc, count, desc, eq, inArray, isNotNull, max, ne, sql } from "drizzle-orm";
import type { ExamQuestion, ExamStimulus } from "@/lib/exam";
import type { ReviewItem } from "@/lib/review";
import { db } from "@/server/db";
import {
  attemptAnswers,
  attempts,
  attemptSubtopicScores,
  practiceSessionItems,
  practiceSessions,
  questionExplanations,
  questionOptions,
  questions,
  stimuli,
  subtopics,
} from "@/server/db/schema";
import { diagnose, type SubtopicDiagnosis, type SubtopicRecord } from "@/server/services/diagnosis";
import { toExamQuestion, toExamStimulus } from "@/server/services/math-render";
import type { PracticeCandidate } from "@/server/services/practice-selection";
import { buildReviewItem, type ReviewSourceQuestion } from "@/server/services/review";

/** Record diagnosa + sumbernya, supaya bisa dikecualikan per sesi/attempt. */
export type SourcedRecord = SubtopicRecord & { source: "test" | "practice"; sourceId: number };

/** Semua ringkasan benar/total per subdomain dari tes resmi (selesai) & latihan (soal terjawab). */
export async function loadDiagnosisRecords(userId: number): Promise<SourcedRecord[]> {
  const [testRows, practiceRows] = await Promise.all([
    db
      .select({
        sourceId: attempts.id,
        subtopicId: attemptSubtopicScores.subtopicId,
        correct: attemptSubtopicScores.correctCount,
        total: attemptSubtopicScores.totalCount,
        submittedAt: attempts.submittedAt,
        startedAt: attempts.startedAt,
      })
      .from(attemptSubtopicScores)
      .innerJoin(attempts, eq(attempts.id, attemptSubtopicScores.attemptId))
      .where(and(eq(attempts.userId, userId), ne(attempts.status, "in_progress"))),
    db
      .select({
        sourceId: practiceSessions.id,
        subtopicId: questions.subtopicId,
        correct: sql<number>`sum(case when ${practiceSessionItems.isCorrect} then 1 else 0 end)`,
        total: count(),
        at: max(practiceSessionItems.answeredAt),
      })
      .from(practiceSessionItems)
      .innerJoin(practiceSessions, eq(practiceSessions.id, practiceSessionItems.sessionId))
      .innerJoin(questions, eq(questions.id, practiceSessionItems.questionId))
      .where(and(eq(practiceSessions.userId, userId), isNotNull(practiceSessionItems.answeredAt)))
      .groupBy(practiceSessions.id, questions.subtopicId),
  ]);
  return [
    ...testRows.map((r) => ({
      source: "test" as const,
      sourceId: r.sourceId,
      subtopicId: r.subtopicId,
      correct: r.correct,
      total: r.total,
      at: r.submittedAt ?? r.startedAt,
    })),
    ...practiceRows.map((r) => ({
      source: "practice" as const,
      sourceId: r.sourceId,
      subtopicId: r.subtopicId,
      correct: Number(r.correct),
      total: Number(r.total),
      at: r.at ?? new Date(0),
    })),
  ];
}

/** Soal bank tayang di subdomain target + seluruh anggota grup stimulusnya. */
export async function listPracticeCandidates(subtopicIds: number[]): Promise<PracticeCandidate[]> {
  if (subtopicIds.length === 0) return [];
  const cols = { id: questions.id, subtopicId: questions.subtopicId, stimulusId: questions.stimulusId, stimulusOrder: questions.stimulusOrder };
  const direct = await db
    .select(cols)
    .from(questions)
    .where(and(eq(questions.status, "published"), inArray(questions.subtopicId, subtopicIds)));
  const stimulusIds = [...new Set(direct.map((q) => q.stimulusId).filter((id): id is number => id != null))];
  const groupMates = stimulusIds.length
    ? await db
        .select(cols)
        .from(questions)
        .where(and(eq(questions.status, "published"), inArray(questions.stimulusId, stimulusIds)))
    : [];
  const byId = new Map([...direct, ...groupMates].map((q) => [q.id, q]));
  return [...byId.values()];
}

/** Kapan terakhir siswa mengerjakan tiap soal (tes & latihan). */
export async function lastSeenByQuestion(userId: number, questionIds: number[]): Promise<Map<number, Date>> {
  if (questionIds.length === 0) return new Map();
  const [fromTests, fromPractice] = await Promise.all([
    db
      .select({ questionId: attemptAnswers.questionId, at: max(attemptAnswers.answeredAt) })
      .from(attemptAnswers)
      .innerJoin(attempts, eq(attempts.id, attemptAnswers.attemptId))
      .where(and(eq(attempts.userId, userId), inArray(attemptAnswers.questionId, questionIds)))
      .groupBy(attemptAnswers.questionId),
    db
      .select({ questionId: practiceSessionItems.questionId, at: max(practiceSessionItems.answeredAt) })
      .from(practiceSessionItems)
      .innerJoin(practiceSessions, eq(practiceSessions.id, practiceSessionItems.sessionId))
      .where(
        and(
          eq(practiceSessions.userId, userId),
          inArray(practiceSessionItems.questionId, questionIds),
          isNotNull(practiceSessionItems.answeredAt),
        ),
      )
      .groupBy(practiceSessionItems.questionId),
  ]);
  const result = new Map<number, Date>();
  for (const r of [...fromTests, ...fromPractice]) {
    if (!r.at) continue;
    const prev = result.get(r.questionId);
    if (!prev || prev < r.at) result.set(r.questionId, r.at);
  }
  return result;
}

/** Jumlah soal bank tayang per subdomain (untuk pilihan di halaman /latihan). */
export async function countPublishedBySubtopic(subtopicIds: number[]): Promise<Map<number, number>> {
  if (subtopicIds.length === 0) return new Map();
  const rows = await db
    .select({ subtopicId: questions.subtopicId, n: count() })
    .from(questions)
    .where(and(eq(questions.status, "published"), inArray(questions.subtopicId, subtopicIds)))
    .groupBy(questions.subtopicId);
  return new Map(rows.map((r) => [r.subtopicId, Number(r.n)]));
}

type QuestionWithKeys = ReviewSourceQuestion & { explanation: string | null; subtopicName: string; stimulusOrder: number | null };

/** Soal lengkap dengan kunci — SERVER-ONLY. */
export async function loadQuestionsWithKeys(ids: number[]): Promise<Map<number, QuestionWithKeys>> {
  if (ids.length === 0) return new Map();
  const [rows, optionRows] = await Promise.all([
    db
      .select({ q: questions, subtopicName: subtopics.name, explanation: questionExplanations.explanationText })
      .from(questions)
      .innerJoin(subtopics, eq(subtopics.id, questions.subtopicId))
      .leftJoin(questionExplanations, eq(questionExplanations.questionId, questions.id))
      .where(inArray(questions.id, ids)),
    db.select().from(questionOptions).where(inArray(questionOptions.questionId, ids)).orderBy(asc(questionOptions.order)),
  ]);
  const map = new Map<number, QuestionWithKeys>();
  for (const { q, subtopicName, explanation } of rows) {
    map.set(q.id, {
      id: q.id,
      type: q.type,
      questionText: q.questionText,
      imageUrl: q.imageUrl,
      subtopicId: q.subtopicId,
      categoryLabels: q.categoryLabels,
      stimulusId: q.stimulusId,
      stimulusOrder: q.stimulusOrder,
      explanation,
      subtopicName,
      options: optionRows
        .filter((o) => o.questionId === q.id)
        .map((o) => ({ id: o.id, label: o.label, optionText: o.optionText, isCorrect: o.isCorrect, correctCategory: o.correctCategory })),
    });
  }
  return map;
}

export type PracticeItemView = {
  itemId: number;
  number: number;
  subtopic: string;
  /** Tanpa kunci — untuk soal yang belum dijawab. */
  question: ExamQuestion;
  /** Terisi setelah dijawab (kunci + pembahasan). */
  review: ReviewItem | null;
};

export type PracticeSessionView = {
  id: number;
  status: "in_progress" | "completed" | "abandoned";
  startedAt: string;
  completedAt: string | null;
  items: PracticeItemView[];
  stimuli: ExamStimulus[];
  targetSubtopicIds: number[];
  totalScore: number | null;
  maxScore: number | null;
};

/** `null` bila sesi tidak ada atau bukan milik `userId`. */
export async function getPracticeSession(sessionId: number, userId: number): Promise<PracticeSessionView | null> {
  const [session] = await db.select().from(practiceSessions).where(eq(practiceSessions.id, sessionId));
  if (!session || session.userId !== userId) return null;

  const items = await db
    .select()
    .from(practiceSessionItems)
    .where(eq(practiceSessionItems.sessionId, sessionId))
    .orderBy(asc(practiceSessionItems.order));
  const questionMap = await loadQuestionsWithKeys(items.map((i) => i.questionId));
  const stimulusIds = [...new Set([...questionMap.values()].map((q) => q.stimulusId).filter((id): id is number => id != null))];
  const stimulusRows = stimulusIds.length
    ? await db.select({ id: stimuli.id, title: stimuli.title, content: stimuli.content, imageUrl: stimuli.imageUrl }).from(stimuli).where(inArray(stimuli.id, stimulusIds))
    : [];

  const views: PracticeItemView[] = [];
  for (const [i, item] of items.entries()) {
    const q = questionMap.get(item.questionId);
    if (!q) continue;
    views.push({
      itemId: item.id,
      number: i + 1,
      subtopic: q.subtopicName,
      question: toExamQuestion({
        id: q.id,
        type: q.type,
        text: q.questionText,
        imageUrl: q.imageUrl,
        categoryLabels: q.categoryLabels,
        stimulusId: q.stimulusId,
        options: q.options.map((o) => ({ id: o.id, label: o.label, text: o.optionText })),
      }),
      review: item.answeredAt ? buildReviewItem(q, item.response ?? null, i + 1, q.subtopicName, q.explanation) : null,
    });
  }

  return {
    id: session.id,
    status: session.status,
    startedAt: session.startedAt.toISOString(),
    completedAt: session.completedAt?.toISOString() ?? null,
    items: views,
    stimuli: stimulusRows.map(toExamStimulus),
    targetSubtopicIds: session.targetSubtopicIds,
    totalScore: session.totalScore,
    maxScore: session.maxScore,
  };
}

export type PracticeHistoryItem = {
  id: number;
  status: "in_progress" | "completed" | "abandoned";
  startedAt: string;
  completedAt: string | null;
  answered: number;
  correct: number;
  total: number;
  subtopics: string[];
};

export async function listPracticeHistory(userId: number, limit = 50): Promise<PracticeHistoryItem[]> {
  const sessions = await db
    .select()
    .from(practiceSessions)
    .where(eq(practiceSessions.userId, userId))
    .orderBy(desc(practiceSessions.startedAt))
    .limit(limit);
  if (sessions.length === 0) return [];
  const ids = sessions.map((s) => s.id);
  const [stats, names] = await Promise.all([
    db
      .select({
        sessionId: practiceSessionItems.sessionId,
        total: count(),
        answered: count(practiceSessionItems.answeredAt),
        correct: sql<number>`sum(case when ${practiceSessionItems.isCorrect} then 1 else 0 end)`,
      })
      .from(practiceSessionItems)
      .where(inArray(practiceSessionItems.sessionId, ids))
      .groupBy(practiceSessionItems.sessionId),
    db
      .select({ id: subtopics.id, name: subtopics.name })
      .from(subtopics)
      .where(inArray(subtopics.id, [...new Set(sessions.flatMap((s) => s.targetSubtopicIds))])),
  ]);
  const statBy = new Map(stats.map((s) => [s.sessionId, s]));
  const nameBy = new Map(names.map((n) => [n.id, n.name]));
  return sessions.map((s) => {
    const st = statBy.get(s.id);
    return {
      id: s.id,
      status: s.status,
      startedAt: s.startedAt.toISOString(),
      completedAt: s.completedAt?.toISOString() ?? null,
      answered: Number(st?.answered ?? 0),
      correct: Number(st?.correct ?? 0),
      total: Number(st?.total ?? 0),
      subtopics: s.targetSubtopicIds.map((id) => nameBy.get(id) ?? "").filter(Boolean),
    };
  });
}

export type PracticeSubtopicChange = {
  subtopicId: number;
  name: string;
  correct: number;
  answered: number;
  before: SubtopicDiagnosis | null;
  after: SubtopicDiagnosis | null;
};

/** Perubahan diagnosa subdomain yang dilatih: tanpa sesi ini vs dengan sesi ini. */
export async function getPracticeChanges(userId: number, view: PracticeSessionView): Promise<PracticeSubtopicChange[]> {
  const records = await loadDiagnosisRecords(userId);
  const before = new Map(
    diagnose(records.filter((r) => !(r.source === "practice" && r.sourceId === view.id))).map((d) => [d.subtopicId, d]),
  );
  const after = new Map(diagnose(records).map((d) => [d.subtopicId, d]));

  // Subdomain yang benar-benar muncul di sesi (termasuk anggota grup stimulus) + target.
  const answered = view.items.filter((i) => i.review);
  const ids = [...new Set([...view.targetSubtopicIds, ...answered.map((i) => i.review!.subtopicId)])];
  const names = ids.length ? await db.select({ id: subtopics.id, name: subtopics.name }).from(subtopics).where(inArray(subtopics.id, ids)) : [];
  const nameBy = new Map(names.map((n) => [n.id, n.name]));

  return ids
    .map((id) => {
      const mine = answered.filter((i) => i.review!.subtopicId === id);
      return {
        subtopicId: id,
        name: nameBy.get(id) ?? "",
        correct: mine.filter((i) => i.review!.isCorrect).length,
        answered: mine.length,
        before: before.get(id) ?? null,
        after: after.get(id) ?? null,
      };
    })
    .filter((c) => c.answered > 0 || view.targetSubtopicIds.includes(c.subtopicId));
}
