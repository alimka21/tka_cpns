// Alur sesi Latihan Kelemahan (bank-only). Dipanggil server action setelah
// sesi user dicek; fungsi di sini tetap memeriksa kepemilikan sesi.

import { and, eq, inArray, isNull } from "drizzle-orm";
import type { ReviewItem } from "@/lib/review";
import type { AnswerResponse } from "@/lib/validation/attempt";
import { db } from "@/server/db";
import { practiceSessionItems, practiceSessions, subtopics } from "@/server/db/schema";
import { lastSeenByQuestion, listPracticeCandidates, loadQuestionsWithKeys } from "@/server/queries/practice";
import { selectPracticeQuestions } from "@/server/services/practice-selection";
import { buildReviewItem } from "@/server/services/review";
import { scoreQuestion } from "@/server/services/scoring";

type Result<T> = ({ ok: true } & T) | { ok: false; error: string };

export async function startPracticeSession(userId: number, targets: number[], count: number): Promise<Result<{ sessionId: number }>> {
  const existing = await db.select({ id: subtopics.id }).from(subtopics).where(inArray(subtopics.id, targets));
  if (existing.length !== targets.length) return { ok: false, error: "Subdomain tidak ditemukan." };

  const candidates = await listPracticeCandidates(targets);
  const lastSeen = await lastSeenByQuestion(userId, candidates.map((c) => c.id));
  const questionIds = selectPracticeQuestions(targets, candidates, lastSeen, count);
  if (questionIds.length === 0) {
    return { ok: false, error: "Belum ada soal tayang di subdomain yang dipilih. Pilih subdomain lain atau coba lagi nanti." };
  }

  const sessionId = await db.transaction(async (tx) => {
    // Satu sesi aktif per siswa: sesi lama yang belum selesai ditinggalkan.
    await tx
      .update(practiceSessions)
      .set({ status: "abandoned" })
      .where(and(eq(practiceSessions.userId, userId), eq(practiceSessions.status, "in_progress")));
    const [{ id }] = await tx
      .insert(practiceSessions)
      .values({ userId, targetSubtopicIds: targets, questionCount: questionIds.length })
      .$returningId();
    await tx.insert(practiceSessionItems).values(questionIds.map((questionId, order) => ({ sessionId: id, order, questionId })));
    return id;
  });
  return { ok: true, sessionId };
}

async function ownedActiveSession(userId: number, sessionId: number) {
  const [session] = await db.select().from(practiceSessions).where(eq(practiceSessions.id, sessionId));
  if (!session || session.userId !== userId) return { error: "Sesi latihan tidak ditemukan." };
  if (session.status !== "in_progress") return { error: "Sesi latihan ini sudah selesai." };
  return { session };
}

/** Nilai satu jawaban (sekali saja) lalu kembalikan kunci + pembahasannya. */
export async function answerPracticeItem(
  userId: number,
  sessionId: number,
  itemId: number,
  response: AnswerResponse,
): Promise<Result<{ review: ReviewItem }>> {
  const owned = await ownedActiveSession(userId, sessionId);
  if ("error" in owned) return { ok: false, error: owned.error! };

  const [item] = await db
    .select()
    .from(practiceSessionItems)
    .where(and(eq(practiceSessionItems.id, itemId), eq(practiceSessionItems.sessionId, sessionId)));
  if (!item) return { ok: false, error: "Soal tidak ditemukan di sesi ini." };

  const q = (await loadQuestionsWithKeys([item.questionId])).get(item.questionId);
  if (!q) return { ok: false, error: "Soal tidak ditemukan." };

  if (item.answeredAt) {
    // Sudah dijawab (mis. klik ganda) — kembalikan hasil tersimpan, jangan ubah.
    return { ok: true, review: buildReviewItem(q, item.response ?? null, item.order + 1, q.subtopicName, q.explanation) };
  }

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
  if (scored.completeness === "blank") return { ok: false, error: "Pilih jawaban dulu." };

  await db
    .update(practiceSessionItems)
    .set({ response, isCorrect: scored.isCorrect, answeredAt: new Date() })
    .where(and(eq(practiceSessionItems.id, itemId), isNull(practiceSessionItems.answeredAt)));

  return { ok: true, review: buildReviewItem(q, response, item.order + 1, q.subtopicName, q.explanation) };
}

/** Tutup sesi: skor = benar / soal yang dijawab. Tanpa jawaban sama sekali → ditinggalkan. */
export async function finishPracticeSession(userId: number, sessionId: number): Promise<Result<object>> {
  const owned = await ownedActiveSession(userId, sessionId);
  if ("error" in owned) return { ok: false, error: owned.error! };

  const items = await db.select().from(practiceSessionItems).where(eq(practiceSessionItems.sessionId, sessionId));
  const answered = items.filter((i) => i.answeredAt);
  const correct = answered.filter((i) => i.isCorrect).length;
  await db
    .update(practiceSessions)
    .set(
      answered.length === 0
        ? { status: "abandoned", completedAt: new Date() }
        : { status: "completed", completedAt: new Date(), totalScore: correct, maxScore: answered.length },
    )
    .where(and(eq(practiceSessions.id, sessionId), eq(practiceSessions.status, "in_progress")));
  return { ok: true };
}
