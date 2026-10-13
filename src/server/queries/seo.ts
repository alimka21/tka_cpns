// Angka nyata untuk halaman publik kerangka TKA (per jenjang & mapel).
// DB tidak tersedia (mis. saat build) → null; halaman tetap tampil tanpa angka.

import { and, count, eq, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { categories, questionExplanations, questions, subjects, subtopics, testPackages, topics } from "@/server/db/schema";

export type SubjectStats = { packages: number; questions: number };

/** Per kode mapel: paket terbit & soal terbit berpembahasan. */
export async function subjectStatsByCode(jenjang: string): Promise<Map<string, SubjectStats> | null> {
  try {
    const [pkgs, qs] = await Promise.all([
      db
        .select({ code: subjects.code, n: count() })
        .from(testPackages)
        .innerJoin(subjects, eq(subjects.id, testPackages.subjectId))
        .innerJoin(categories, eq(categories.id, subjects.categoryId))
        .where(and(eq(testPackages.status, "published"), eq(categories.code, jenjang)))
        .groupBy(subjects.code),
      db
        .select({ code: subjects.code, n: count() })
        .from(questions)
        .innerJoin(questionExplanations, eq(questionExplanations.questionId, questions.id))
        .innerJoin(subtopics, eq(subtopics.id, questions.subtopicId))
        .innerJoin(topics, eq(topics.id, subtopics.topicId))
        .innerJoin(subjects, eq(subjects.id, topics.subjectId))
        .innerJoin(categories, eq(categories.id, subjects.categoryId))
        .where(and(eq(questions.status, "published"), eq(categories.code, jenjang), sql`TRIM(${questionExplanations.explanationText}) <> ''`))
        .groupBy(subjects.code),
    ]);
    const map = new Map<string, SubjectStats>();
    for (const r of pkgs) map.set(r.code, { packages: Number(r.n), questions: 0 });
    for (const r of qs) map.set(r.code, { packages: map.get(r.code)?.packages ?? 0, questions: Number(r.n) });
    return map;
  } catch {
    return null;
  }
}
