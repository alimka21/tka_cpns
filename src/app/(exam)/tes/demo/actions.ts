"use server";

// Server action tiruan untuk halaman demo — belum ada database.
// Ganti dengan action asli di src/server/actions/ setelah tabel attempts siap.

import { saveAnswerInput } from "@/lib/validation/attempt";

export async function demoSaveAnswer(input: {
  questionId: number;
  selectedOptionId: number | null;
  isFlagged: boolean;
}) {
  const parsed = saveAnswerInput.safeParse({ attemptId: 1, ...input });
  if (!parsed.success) return { ok: false, error: "Data jawaban tidak valid." };
  return { ok: true };
}

export async function demoSubmitAttempt() {
  return { ok: true, redirectTo: "/hasil/demo" };
}
