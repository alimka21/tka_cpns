"use server";

// Server action pengerjaan tes (siswa). Dibungkus dengan `.bind(null, attemptId)`
// di halaman ujian sebelum dikirim ke <ExamShell> (lihat lib/exam.ts
// SaveAnswerFn/SubmitAttemptFn). Setiap panggilan mengecek ulang kepemilikan
// attempt — jangan percaya `attemptId` dari client begitu saja.

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import type { AnswerResponse } from "@/lib/validation/attempt";
import { saveAnswerInput, submitAttemptInput } from "@/lib/validation/attempt";
import { getSession } from "@/server/auth/session";
import { db } from "@/server/db";
import { attemptAnswers, attempts, testPackageQuestions } from "@/server/db/schema";
import { finalizeAttempt } from "@/server/services/attempts";

async function loadOwnedAttempt(attemptId: number) {
  const session = await getSession();
  if (!session) return { error: "Sesi berakhir. Silakan masuk lagi." };
  const [attempt] = await db.select().from(attempts).where(eq(attempts.id, attemptId));
  if (!attempt || attempt.userId !== Number(session.user.id)) return { error: "Percobaan tidak ditemukan." };
  return { attempt };
}

export async function saveAnswerAction(
  attemptId: number,
  input: { questionId: number; response: AnswerResponse | null; isFlagged: boolean },
): Promise<{ ok: boolean; error?: string }> {
  const owned = await loadOwnedAttempt(attemptId);
  if ("error" in owned) return { ok: false, error: owned.error };
  const { attempt } = owned;

  if (attempt.status !== "in_progress") return { ok: false, error: "Percobaan ini sudah selesai." };
  if (attempt.endsAt.getTime() <= Date.now()) {
    await finalizeAttempt(attemptId, "expired");
    return { ok: false, error: "Waktu sudah habis." };
  }

  const parsed = saveAnswerInput.safeParse({ attemptId, ...input });
  if (!parsed.success) return { ok: false, error: "Data jawaban tidak valid." };

  const [belongs] = await db
    .select({ id: testPackageQuestions.id })
    .from(testPackageQuestions)
    .where(
      and(
        eq(testPackageQuestions.testPackageId, attempt.testPackageId),
        eq(testPackageQuestions.questionId, parsed.data.questionId),
      ),
    );
  if (!belongs) return { ok: false, error: "Soal tidak ada di paket ini." };

  await db
    .insert(attemptAnswers)
    .values({
      attemptId,
      questionId: parsed.data.questionId,
      response: parsed.data.response,
      isFlagged: parsed.data.isFlagged,
    })
    .onDuplicateKeyUpdate({ set: { response: parsed.data.response, isFlagged: parsed.data.isFlagged } });

  return { ok: true };
}

export async function submitAttemptAction(attemptId: number): Promise<{ ok: boolean; error?: string; redirectTo?: string }> {
  const owned = await loadOwnedAttempt(attemptId);
  if ("error" in owned) return { ok: false, error: owned.error };
  const { attempt } = owned;

  if (!submitAttemptInput.safeParse({ attemptId }).success) return { ok: false, error: "Percobaan tidak valid." };
  if (attempt.status === "in_progress") await finalizeAttempt(attemptId, "submitted");

  revalidatePath("/dashboard");
  return { ok: true, redirectTo: `/hasil/${attemptId}` };
}
