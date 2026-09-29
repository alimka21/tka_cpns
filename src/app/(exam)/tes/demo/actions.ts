"use server";

// Server action tiruan untuk halaman demo publik — tidak menyimpan apa pun.

import type { AnswerResponse } from "@/lib/validation/attempt";
import { saveAnswerInput } from "@/lib/validation/attempt";

export async function demoSaveAnswer(input: {
  questionId: number;
  response: AnswerResponse | null;
  isFlagged: boolean;
}) {
  const parsed = saveAnswerInput.safeParse({ attemptId: 1, ...input });
  if (!parsed.success) return { ok: false, error: "Data jawaban tidak valid." };
  return { ok: true };
}

export async function demoSubmitAttempt() {
  // Tanpa redirectTo: ExamShell menampilkan pop-up `doneWithoutResult`
  // (demo tidak punya attempt di DB, jadi tidak ada halaman hasil).
  return { ok: true };
}
