import { z } from "zod";

// Hierarki konten mengikuti kerangka asesmen TKA (docs/DATABASE.md §Konten):
// jenjang (categories) → mata uji (subjects) → domain (topics) → subdomain (subtopics).
// Normalnya diisi lewat seed `npm run db:seed:asesmen`, bukan input manual.

const name = (max = 255) => z.string().trim().min(1, "Nama wajib diisi").max(max);
const order = z.coerce.number().int().min(0).default(0);
const id = z.coerce.number().int().positive();
/** Kode baku kerangka, mis. "SMP-MTK-D1-S1". */
export const frameworkCode = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]+(-[A-Z0-9]+)*$/, "Kode hanya huruf besar, angka, dan tanda -")
  .max(32);

export const categoryInput = z.object({ code: z.enum(["SD", "SMP", "SMA"]), name: name() });

export const subjectInput = z.object({
  categoryId: id,
  code: frameworkCode,
  name: name(),
  fullName: name(),
  type: z.enum(["wajib", "pilihan"]),
  structure: z.enum(["kompetensi_subkompetensi", "elemen_subelemen"]),
  order,
});

export const topicInput = z.object({
  subjectId: id,
  code: frameworkCode,
  name: name(),
  description: z.string().trim().nullish(),
  order,
});

export const subtopicInput = z.object({ topicId: id, code: frameworkCode, name: name(512), order });

export type CategoryInput = z.infer<typeof categoryInput>;
export type SubjectInput = z.infer<typeof subjectInput>;
export type TopicInput = z.infer<typeof topicInput>;
export type SubtopicInput = z.infer<typeof subtopicInput>;
