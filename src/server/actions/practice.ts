"use server";

// Server action Latihan Kelemahan (siswa). Setiap panggilan cek sesi login
// & kepemilikan sesi latihan di service — jangan percaya id dari client.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { answerResponse } from "@/lib/validation/attempt";
import { MAX_PRACTICE_TARGETS, PRACTICE_SIZES } from "@/lib/practice";
import type { ReviewItem } from "@/lib/review";
import { getActiveSession } from "@/server/auth/session";
import { answerPracticeItem, finishPracticeSession, startPracticeSession } from "@/server/services/practice";
import type { PracticeAiNotice } from "@/server/services/practice-ai-plan";

const id = z.number().int().positive();

const startInput = z.object({
  subtopicIds: z.array(id).min(1, "Pilih minimal 1 subdomain.").max(MAX_PRACTICE_TARGETS, `Pilih maksimal ${MAX_PRACTICE_TARGETS} subdomain.`)
    .refine((ids) => new Set(ids).size === ids.length, "Subdomain tidak boleh ganda."),
  count: z.number().int().refine((n) => (PRACTICE_SIZES as readonly number[]).includes(n), "Jumlah soal tidak valid."),
});

const NOT_LOGGED_IN = { ok: false as const, error: "Sesi berakhir. Silakan masuk lagi." };

export async function startPracticeAction(input: {
  subtopicIds: number[];
  count: number;
}): Promise<{ ok: true; sessionId: number; notice: PracticeAiNotice | null } | { ok: false; error: string }> {
  const session = await getActiveSession();
  if (!session) return NOT_LOGGED_IN;
  const parsed = startInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const result = await startPracticeSession(Number(session.user.id), parsed.data.subtopicIds, parsed.data.count);
  if (result.ok) revalidatePath("/latihan");
  return result;
}

export async function answerPracticeAction(
  sessionId: number,
  input: { itemId: number; response: unknown },
): Promise<{ ok: true; review: ReviewItem } | { ok: false; error: string }> {
  const session = await getActiveSession();
  if (!session) return NOT_LOGGED_IN;
  const parsed = z.object({ sessionId: id, itemId: id, response: answerResponse }).safeParse({ sessionId, ...input });
  if (!parsed.success) return { ok: false, error: "Jawaban tidak valid." };
  return answerPracticeItem(Number(session.user.id), parsed.data.sessionId, parsed.data.itemId, parsed.data.response);
}

export async function finishPracticeAction(sessionId: number): Promise<{ ok: true; redirectTo: string } | { ok: false; error: string }> {
  const session = await getActiveSession();
  if (!session) return NOT_LOGGED_IN;
  const parsed = id.safeParse(sessionId);
  if (!parsed.success) return { ok: false, error: "Sesi tidak valid." };
  const result = await finishPracticeSession(Number(session.user.id), parsed.data);
  if (!result.ok) return result;
  revalidatePath("/latihan");
  revalidatePath("/progres");
  revalidatePath("/dashboard");
  return { ok: true, redirectTo: `/latihan/${parsed.data}/hasil` };
}
