import { z } from "zod";
import { answerResponse } from "@/lib/validation/attempt";

export const DEMO_ANSWERS_COOKIE = "tka_demo_answers";

/** questionId (string di JSON) → jawaban; dibatasi supaya cookie tetap kecil. */
export const demoAnswersInput = z
  .record(z.string().regex(/^\d{1,4}$/), answerResponse.nullable())
  .refine((a) => Object.keys(a).length <= 20, "Terlalu banyak jawaban");

export function parseDemoAnswers(raw: string | undefined) {
  if (!raw) return null;
  try {
    const parsed = demoAnswersInput.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
