import { z } from "zod";
import { DIFFICULTIES, OPTION_LABELS, QUESTION_STATUSES, QUESTION_TYPES } from "./enums";

export const questionOptionInput = z.object({
  label: z.enum(OPTION_LABELS),
  optionText: z.string().trim().min(1, "Teks opsi wajib diisi"),
  isCorrect: z.boolean().default(false),
});

export const questionInput = z
  .object({
    subtopicId: z.coerce.number().int().positive(),
    type: z.enum(QUESTION_TYPES).default("single_choice"),
    questionText: z.string().trim().min(1, "Pertanyaan wajib diisi"),
    imageUrl: z.url("URL gambar tidak valid").max(2048).nullish(),
    difficulty: z.enum(DIFFICULTIES),
    status: z.enum(QUESTION_STATUSES).default("draft"),
    options: z.array(questionOptionInput).min(4, "Minimal 4 opsi").max(5, "Maksimal 5 opsi"),
    explanationText: z.string().trim().nullish(),
  })
  .superRefine((q, ctx) => {
    // Label harus berurutan A, B, C, ... tanpa loncat/duplikat.
    q.options.forEach((o, i) => {
      if (o.label !== OPTION_LABELS[i]) {
        ctx.addIssue({
          code: "custom",
          path: ["options", i, "label"],
          message: `Label opsi ke-${i + 1} harus ${OPTION_LABELS[i]}`,
        });
      }
    });

    const correct = q.options.filter((o) => o.isCorrect).length;
    if (correct !== 1) {
      ctx.addIssue({
        code: "custom",
        path: ["options"],
        message: "Soal harus punya tepat 1 kunci jawaban",
      });
    }
  });

export type QuestionInput = z.infer<typeof questionInput>;
