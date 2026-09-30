"use server";

// Server action halaman demo publik — tanpa database. Jawaban demo disimpan
// di cookie httpOnly lalu dinilai ulang di server oleh /tes/demo/hasil
// (kunci tidak pernah dikirim ke client, skor tidak bisa dimanipulasi).

import { cookies } from "next/headers";
import { saveAnswerInput, type AnswerResponse } from "@/lib/validation/attempt";
import { DEMO_ANSWERS_COOKIE, demoAnswersInput } from "./demo-answers";

export async function demoSaveAnswer(input: {
  questionId: number;
  response: AnswerResponse | null;
  isFlagged: boolean;
}) {
  const parsed = saveAnswerInput.safeParse({ attemptId: 1, ...input });
  if (!parsed.success) return { ok: false, error: "Data jawaban tidak valid." };
  return { ok: true };
}

export async function demoSubmitAttempt(answers?: Record<number, AnswerResponse | null>) {
  const parsed = demoAnswersInput.safeParse(answers ?? {});
  if (!parsed.success) return { ok: false, error: "Data jawaban tidak valid." };
  (await cookies()).set(DEMO_ANSWERS_COOKIE, JSON.stringify(parsed.data), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/tes/demo",
    maxAge: 60 * 60 * 24,
  });
  return { ok: true, redirectTo: "/tes/demo/hasil" };
}
