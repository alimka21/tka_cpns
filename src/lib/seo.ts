// Helper SEO: slug halaman publik kerangka TKA & URL absolut.

import { SITE_URL } from "@/lib/site";

export const JENJANG_SLUGS = { sd: "SD", smp: "SMP", sma: "SMA" } as const;
export type JenjangSlug = keyof typeof JENJANG_SLUGS;

export const JENJANG_LABEL: Record<string, string> = { SD: "SD/MI", SMP: "SMP/MTs", SMA: "SMA/MA/SMK" };

/** Nama mapel yang terlalu panjang untuk URL. */
const SLUG_OVERRIDE: Record<string, string> = {
  "SMA-PPKN": "pendidikan-pancasila",
  "SMK-PKK": "produk-kreatif-kewirausahaan",
};

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, " ")
    .trim()
    .replace(/[\s_-]+/g, "-");
}

export function subjectSlug(subject: { code: string; name: string }) {
  return SLUG_OVERRIDE[subject.code] ?? slugify(subject.name);
}

export function jenjangPath(jenjang: string) {
  return `/tka/${jenjang.toLowerCase()}`;
}

export function subjectPath(jenjang: string, subject: { code: string; name: string }) {
  return `${jenjangPath(jenjang)}/${subjectSlug(subject)}`;
}

export function absoluteUrl(path = "/") {
  return `${SITE_URL}${path === "/" ? "" : path}`;
}
