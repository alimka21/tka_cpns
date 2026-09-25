import { z } from "zod";
import {
  CATEGORY_PAIRS,
  DIFFICULTIES,
  OPTION_LABELS,
  QUESTION_STATUSES,
  STIMULUS_STATUSES,
} from "./enums";

// Aturan per bentuk soal (docs/DECISIONS.md 2026-09-25):
// - pg           : 4–5 opsi, tepat 1 kunci.
// - pgk_mcma     : 4–5 opsi, kunci 1 s.d. (jumlah opsi − 1).
// - pgk_kategori : 3–5 pernyataan, tiap pernyataan punya kategori kunci
//                  dari satu pasangan (Benar/Salah atau Sesuai/Tidak Sesuai).

export const questionOptionInput = z.object({
  label: z.enum(OPTION_LABELS),
  optionText: z.string().trim().min(1, "Teks opsi wajib diisi"),
  isCorrect: z.boolean().default(false),
  /** Hanya PGK Kategori: kategori kunci untuk pernyataan ini. */
  correctCategory: z.string().trim().nullish(),
});

const categoryPair = z
  .tuple([z.string(), z.string()])
  .refine(
    (pair) => CATEGORY_PAIRS.some(([a, b]) => pair[0] === a && pair[1] === b),
    `Pasangan kategori harus ${CATEGORY_PAIRS.map((p) => p.join("/")).join(" atau ")}`,
  );

const common = {
  subtopicId: z.coerce.number().int().positive(),
  questionText: z.string().trim().min(1, "Pertanyaan wajib diisi"),
  imageUrl: z.url("URL gambar tidak valid").max(2048).nullish(),
  difficulty: z.enum(DIFFICULTIES),
  // Kecocokan level dengan mata uji dicek di server lewat kerangka asesmen.
  cognitiveLevel: z.string().regex(/^L\d$/, "Level kognitif harus L1, L2, atau L3").nullish(),
  status: z.enum(QUESTION_STATUSES).default("draft"),
  explanationText: z.string().trim().nullish(),
  /** Soal grup: terisi bila soal mengacu pada stimulus bersama. */
  stimulusId: z.coerce.number().int().positive().nullish(),
  stimulusOrder: z.coerce.number().int().min(1).nullish(),
};

const options = (min: number, max: number, unit: string) =>
  z.array(questionOptionInput).min(min, `Minimal ${min} ${unit}`).max(max, `Maksimal ${max} ${unit}`);

export const questionInput = z
  .discriminatedUnion("type", [
    z.object({ ...common, type: z.literal("pg"), options: options(4, 5, "opsi") }),
    z.object({ ...common, type: z.literal("pgk_mcma"), options: options(4, 5, "opsi") }),
    z.object({
      ...common,
      type: z.literal("pgk_kategori"),
      categoryLabels: categoryPair,
      options: options(3, 5, "pernyataan"),
    }),
  ])
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

    if ((q.stimulusId == null) !== (q.stimulusOrder == null)) {
      ctx.addIssue({
        code: "custom",
        path: ["stimulusOrder"],
        message: "Soal grup butuh stimulus dan nomor urut di dalam grup",
      });
    }

    const correct = q.options.filter((o) => o.isCorrect).length;
    switch (q.type) {
      case "pg":
        if (correct !== 1) {
          ctx.addIssue({ code: "custom", path: ["options"], message: "Soal PG harus punya tepat 1 kunci jawaban" });
        }
        break;
      case "pgk_mcma":
        if (correct < 1 || correct > q.options.length - 1) {
          ctx.addIssue({
            code: "custom",
            path: ["options"],
            message: `Soal PGK MCMA harus punya 1–${q.options.length - 1} kunci jawaban`,
          });
        }
        break;
      case "pgk_kategori":
        if (correct > 0) {
          ctx.addIssue({ code: "custom", path: ["options"], message: "PGK Kategori memakai kategori per pernyataan, bukan kunci opsi" });
        }
        q.options.forEach((o, i) => {
          if (!o.correctCategory || !(q.categoryLabels as readonly string[]).includes(o.correctCategory)) {
            ctx.addIssue({
              code: "custom",
              path: ["options", i, "correctCategory"],
              message: `Kategori kunci pernyataan ${o.label} harus ${q.categoryLabels.join(" atau ")}`,
            });
          }
        });
        break;
    }
    if (q.type !== "pgk_kategori" && q.options.some((o) => o.correctCategory)) {
      ctx.addIssue({ code: "custom", path: ["options"], message: "Kategori kunci hanya untuk PGK Kategori" });
    }
  });

export type QuestionInput = z.infer<typeof questionInput>;

/** Stimulus bersama untuk soal grup (teks bacaan, tabel, grafik, dsb.). */
export const stimulusInput = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]+(-[A-Z0-9]+)*$/, "Kode hanya huruf besar, angka, dan tanda -")
    .max(32),
  title: z.string().trim().min(1, "Judul wajib diisi").max(255),
  content: z.string().trim().min(1, "Isi stimulus wajib diisi"),
  imageUrl: z.url("URL gambar tidak valid").max(2048).nullish(),
  status: z.enum(STIMULUS_STATUSES).default("draft"),
});

export type StimulusInput = z.infer<typeof stimulusInput>;
