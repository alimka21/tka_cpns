// Ubah kerangka asesmen menjadi baris tabel konten (tanpa id DB).
// Dipakai oleh script seed; dipisah supaya bisa dites tanpa database.

import type { Framework } from "./index";

export type SeedPlan = {
  categories: { code: string; name: string }[];
  subjects: {
    categoryCode: string;
    code: string;
    name: string;
    fullName: string;
    type: "wajib" | "pilihan";
    structure: "kompetensi_subkompetensi" | "elemen_subelemen";
    order: number;
  }[];
  topics: { subjectCode: string; code: string; name: string; description: string | null; order: number }[];
  subtopics: { topicCode: string; code: string; name: string; order: number }[];
};

export function buildSeedPlan(frameworks: Framework[]): SeedPlan {
  const plan: SeedPlan = { categories: [], subjects: [], topics: [], subtopics: [] };
  for (const fw of frameworks) {
    plan.categories.push({ code: fw.jenjang, name: fw.jenjangName });
    for (const s of fw.subjects) {
      plan.subjects.push({
        categoryCode: fw.jenjang,
        code: s.code,
        name: s.name,
        fullName: s.fullName,
        type: s.type,
        structure: s.structure,
        order: s.order,
      });
      for (const d of s.domains) {
        plan.topics.push({ subjectCode: s.code, code: d.code, name: d.name, description: d.description, order: d.order });
        for (const sub of d.subdomains) {
          plan.subtopics.push({ topicCode: d.code, code: sub.code, name: sub.name, order: sub.order });
        }
      }
    }
  }
  return plan;
}
