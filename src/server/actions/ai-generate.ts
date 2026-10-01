"use server";

// Generate soal AI untuk bank (admin). Memakai API key Gemini milik admin
// yang sedang login; hasil selalu `pending_review`.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { frameworkCode } from "@/lib/validation/content";
import { DIFFICULTIES, QUESTION_TYPES } from "@/lib/validation/enums";
import { VARIATION_STYLES, type VariationStyle } from "@/server/asesmen/generation-context";
import { getAdminSession } from "@/server/auth/session";
import { AI_GENERATION_MODES } from "@/server/db/schema";
import { generateAiQuestions, type AiGenerateResult } from "@/server/services/ai-generate";

const id = z.number().int().positive();

const input = z.object({
  mode: z.enum(AI_GENERATION_MODES),
  subdomainCode: frameworkCode,
  form: z.enum([...QUESTION_TYPES, "campuran"]),
  count: z.number().int().min(1).max(10),
  difficulty: z.enum(DIFFICULTIES),
  cognitiveLevel: z.string().regex(/^L\d$/).nullable(),
  sourceQuestionId: id.nullish(),
  variation: z.enum(Object.keys(VARIATION_STYLES) as [VariationStyle, ...VariationStyle[]]).optional(),
  imageId: id.nullish(),
  stimulusId: id.nullish(),
  extraSubdomainCodes: z.array(frameworkCode).max(8).nullish(),
  extraInstruction: z.string().trim().max(500).nullish(),
});

export async function generateAiQuestionsAction(raw: unknown): Promise<AiGenerateResult> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: "Sesi admin berakhir. Silakan masuk lagi." };
  const parsed = input.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Isian belum lengkap atau tidak valid." };
  const result = await generateAiQuestions(Number(session.user.id), parsed.data);
  if (result.ok) {
    revalidatePath("/admin/soal");
    revalidatePath("/admin/soal/generate-ai");
  }
  return result;
}
