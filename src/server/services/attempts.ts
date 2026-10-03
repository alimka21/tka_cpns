// Alur pengerjaan tes: mulai/lanjutkan attempt & finalize (hitung skor).
// Dipanggil dari Server Component halaman ujian & dari server actions
// (src/server/actions/attempts.ts) — bukan action itu sendiri.

import { and, eq } from "drizzle-orm";
import type { AnswerResponse } from "@/lib/validation/attempt";
import { db } from "@/server/db";
import { attemptAnswers, attemptSubtopicScores, attempts } from "@/server/db/schema";
import { getPackageDetailCached, hasEntitlement, type PackageDetail } from "@/server/queries/packages";
import { getActiveMembership } from "@/server/services/billing";
import { summarizeBySubtopic } from "./analytics";
import { scoreAttempt, type AnswerMap, type ScorableQuestion } from "./scoring";

function toScorable(pkg: PackageDetail): ScorableQuestion[] {
  return pkg.questions.map((q) => ({
    questionId: q.id,
    subtopicId: q.subtopicId,
    type: q.type,
    options: q.options.map((o) => ({ id: o.id, isCorrect: o.isCorrect, correctCategory: o.correctCategory })),
    categoryLabels: q.categoryLabels,
    pointsOverride: q.pointsOverride,
  }));
}

/**
 * Hitung & simpan skor akhir + ringkasan subtopik. Idempoten: attempt yang
 * statusnya sudah bukan `in_progress` diabaikan (aman dipanggil ulang, mis.
 * dari `startOrResumeAttempt` dan dari tombol submit yang double-klik).
 */
export async function finalizeAttempt(attemptId: number, status: "submitted" | "expired") {
  const [attempt] = await db.select().from(attempts).where(eq(attempts.id, attemptId));
  if (!attempt || attempt.status !== "in_progress") return;

  const pkg = await getPackageDetailCached(attempt.testPackageId);
  if (!pkg) return;

  const answerRows = await db
    .select({ questionId: attemptAnswers.questionId, response: attemptAnswers.response })
    .from(attemptAnswers)
    .where(eq(attemptAnswers.attemptId, attemptId));
  const answers: AnswerMap = new Map(answerRows.map((r) => [r.questionId, r.response as AnswerResponse | null]));

  const result = scoreAttempt(toScorable(pkg), answers);
  const subtopicSummaries = summarizeBySubtopic(result.questions);

  await db.transaction(async (tx) => {
    await tx
      .update(attempts)
      .set({ status, submittedAt: new Date(), totalScore: result.totalScore, maxScore: result.maxScore })
      .where(eq(attempts.id, attemptId));
    await tx.delete(attemptSubtopicScores).where(eq(attemptSubtopicScores.attemptId, attemptId));
    if (subtopicSummaries.length > 0) {
      await tx.insert(attemptSubtopicScores).values(
        subtopicSummaries.map((s) => ({
          attemptId,
          subtopicId: s.subtopicId,
          correctCount: s.correctCount,
          totalCount: s.totalCount,
          score: s.score,
          percentage: s.percentage,
        })),
      );
    }
  });
}

export type StartAttemptResult = { ok: true; attemptId: number } | { ok: false; error: string };

/**
 * Lanjutkan attempt in_progress yang masih berjalan, atau mulai baru.
 * Attempt in_progress yang waktunya sudah habis (tab ditutup tanpa submit)
 * di-finalize otomatis sebagai `expired` sebelum attempt baru dibuat —
 * jawaban yang sempat ter-autosave tetap dinilai (NFR ketahanan koneksi).
 */
/** `jenjang`: jenjang siswa — paket jenjang lain ditolak (admin: null = bebas). */
export async function startOrResumeAttempt(
  userId: number,
  testPackageId: number,
  jenjang: string | null,
  isAdmin = false,
): Promise<StartAttemptResult> {
  const pkg = await getPackageDetailCached(testPackageId);
  if (!pkg || pkg.status !== "published") return { ok: false, error: "Paket tes tidak ditemukan." };
  if (jenjang && pkg.categoryCode !== jenjang) {
    return { ok: false, error: `Paket ini untuk TKA ${pkg.categoryCode}, sedangkan akunmu jenjang ${jenjang}. Ganti jenjang di Pengaturan bila keliru.` };
  }
  if (pkg.questions.length === 0) return { ok: false, error: "Paket tes ini belum berisi soal." };
  if (pkg.isPremium && !isAdmin && !(await hasEntitlement(userId, testPackageId)) && !(await getActiveMembership(userId, pkg.categoryCode))) {
    return { ok: false, error: "Paket ini khusus Premium. Buka Premium di menu Langganan untuk mengerjakannya." };
  }

  const [existing] = await db
    .select()
    .from(attempts)
    .where(and(eq(attempts.userId, userId), eq(attempts.testPackageId, testPackageId), eq(attempts.status, "in_progress")));

  if (existing) {
    if (existing.endsAt.getTime() > Date.now()) return { ok: true, attemptId: existing.id };
    await finalizeAttempt(existing.id, "expired");
  }

  const endsAt = new Date(Date.now() + pkg.durationMinutes * 60_000);
  const [{ id }] = await db.insert(attempts).values({ userId, testPackageId, endsAt }).$returningId();
  return { ok: true, attemptId: id };
}
