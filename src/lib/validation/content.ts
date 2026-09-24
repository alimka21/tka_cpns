import { z } from "zod";

const name = z.string().trim().min(1, "Nama wajib diisi").max(255);
const slug = z
  .string()
  .trim()
  .min(1, "Slug wajib diisi")
  .max(255)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug hanya huruf kecil, angka, dan tanda -");
const order = z.coerce.number().int().min(0).default(0);
const id = z.coerce.number().int().positive();

export const categoryInput = z.object({ name });

export const topicInput = z.object({ categoryId: id, name, slug, order });

export const subtopicInput = z.object({ topicId: id, name, slug, order });

export type CategoryInput = z.infer<typeof categoryInput>;
export type TopicInput = z.infer<typeof topicInput>;
export type SubtopicInput = z.infer<typeof subtopicInput>;

/** "Aritmatika Sosial" → "aritmatika-sosial" */
export function slugify(text: string) {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
