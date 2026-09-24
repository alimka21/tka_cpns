import { z } from "zod";

const id = z.number().int().positive();

/** Payload autosave dari client. Kepemilikan attempt & opsi dicek di server. */
export const saveAnswerInput = z.object({
  attemptId: id,
  questionId: id,
  selectedOptionId: id.nullable(),
  isFlagged: z.boolean().default(false),
});

export const submitAttemptInput = z.object({ attemptId: id });

export type SaveAnswerInput = z.infer<typeof saveAnswerInput>;
