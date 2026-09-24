import { z } from "zod";
import { PACKAGE_STATUSES } from "./enums";

export const testPackageQuestionInput = z.object({
  questionId: z.number().int().positive(),
  order: z.number().int().min(0),
  pointsOverride: z.number().int().min(1).max(100).nullable().default(null),
});

export const testPackageInput = z
  .object({
    title: z.string().trim().min(1, "Judul wajib diisi").max(255),
    description: z.string().trim().nullish(),
    categoryId: z.coerce.number().int().positive(),
    durationMinutes: z.coerce
      .number()
      .int()
      .min(1, "Durasi minimal 1 menit")
      .max(600, "Durasi maksimal 600 menit"),
    isPremium: z.boolean().default(false),
    status: z.enum(PACKAGE_STATUSES).default("draft"),
    questions: z.array(testPackageQuestionInput),
  })
  .superRefine((p, ctx) => {
    const ids = p.questions.map((q) => q.questionId);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: "custom", path: ["questions"], message: "Ada soal yang dipilih dua kali" });
    }
    if (p.status === "published" && p.questions.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["questions"],
        message: "Paket yang diterbitkan minimal berisi 1 soal",
      });
    }
  });

export type TestPackageInput = z.infer<typeof testPackageInput>;
