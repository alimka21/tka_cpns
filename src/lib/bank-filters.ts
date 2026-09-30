// Filter Bank Soal (admin) dari query string: jenjang → mapel → topik →
// subtopik + status/bentuk/kesulitan/teks. Dipakai halaman server & komponen
// filter (client) supaya nama parameter URL satu sumber.

import { z } from "zod";
import { DIFFICULTIES, QUESTION_STATUSES, QUESTION_TYPES } from "@/lib/validation/enums";

const code = z.string().trim().regex(/^[A-Z0-9-]{1,32}$/);

export const bankFilterSchema = z.object({
  jenjang: z.enum(["SD", "SMP", "SMA"]).optional().catch(undefined),
  mapel: code.optional().catch(undefined),
  topik: code.optional().catch(undefined),
  sub: code.optional().catch(undefined),
  status: z.enum(QUESTION_STATUSES).optional().catch(undefined),
  bentuk: z.enum(QUESTION_TYPES).optional().catch(undefined),
  tingkat: z.enum(DIFFICULTIES).optional().catch(undefined),
  sumber: z.enum(["manual", "import", "ai"]).optional().catch(undefined),
  q: z.string().trim().max(100).optional().catch(undefined),
  hal: z.coerce.number().int().min(1).max(1000).optional().catch(undefined),
});

export type BankFilters = z.infer<typeof bankFilterSchema>;

export function parseBankFilters(params: Record<string, string | string[] | undefined>): BankFilters {
  const flat = Object.fromEntries(Object.entries(params).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v || undefined]));
  const f = bankFilterSchema.parse(flat);
  // Kode anak harus berada di bawah induknya (SMP-MTK-D1-S1 ⊂ SMP-MTK-D1 ⊂ SMP-MTK ⊂ SMP).
  if (f.mapel && f.jenjang && !f.mapel.startsWith(`${f.jenjang}-`)) f.mapel = undefined;
  if (f.topik && (!f.mapel || !f.topik.startsWith(`${f.mapel}-`))) f.topik = undefined;
  if (f.sub && (!f.topik || !f.sub.startsWith(`${f.topik}-`))) f.sub = undefined;
  if (f.mapel && !f.jenjang) f.jenjang = f.mapel.split("-")[0] as BankFilters["jenjang"];
  return f;
}

/** URL bank soal dengan filter; `undefined`/kosong dibuang. */
export function bankHref(filters: Partial<Record<keyof BankFilters, string | number | undefined>>) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) if (v !== undefined && v !== "") qs.set(k, String(v));
  const s = qs.toString();
  return s ? `/admin/soal?${s}` : "/admin/soal";
}
