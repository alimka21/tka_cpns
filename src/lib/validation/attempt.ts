import { z } from "zod";

const id = z.number().int().positive();

/**
 * Jawaban satu soal, disimpan di `attempt_answers.response` (JSON).
 * `null` = belum dijawab. Kepemilikan opsi & kategori dicek saat skor.
 */
export const answerResponse = z.discriminatedUnion("type", [
  z.object({ type: z.literal("pg"), optionId: id }),
  z.object({
    type: z.literal("pgk_mcma"),
    optionIds: z.array(id).min(1).max(5).refine((ids) => new Set(ids).size === ids.length, "Opsi tidak boleh ganda"),
  }),
  z.object({
    type: z.literal("pgk_kategori"),
    answers: z
      .array(z.object({ optionId: id, category: z.string().trim().min(1).max(32) }))
      .min(1)
      .max(5)
      .refine((a) => new Set(a.map((x) => x.optionId)).size === a.length, "Pernyataan tidak boleh ganda"),
  }),
]);

export type AnswerResponse = z.infer<typeof answerResponse>;

/** Payload autosave dari client. Kepemilikan attempt & opsi dicek di server. */
export const saveAnswerInput = z.object({
  attemptId: id,
  questionId: id,
  response: answerResponse.nullable(),
  isFlagged: z.boolean().default(false),
});

export const submitAttemptInput = z.object({ attemptId: id });

export type SaveAnswerInput = z.infer<typeof saveAnswerInput>;
