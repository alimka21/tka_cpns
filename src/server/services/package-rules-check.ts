// Jalankan aturan paket (lib/package-rules.ts) terhadap data asli di DB —
// dipakai server sebelum paket diterbitkan (tidak percaya hitungan client).

import { eq, inArray } from "drizzle-orm";
import { checkPackageRules, type PackageRuleReport } from "@/lib/package-rules";
import { db } from "@/server/db";
import { categories, questions, subjects, subtopics, topics } from "@/server/db/schema";

export async function packageRuleReport(p: {
  categoryId: number;
  subjectId: number | null | undefined;
  durationMinutes: number;
  questionIds: number[];
}): Promise<PackageRuleReport> {
  const [cat] = await db.select({ code: categories.code }).from(categories).where(eq(categories.id, p.categoryId));
  const [subject] = p.subjectId
    ? await db.select({ code: subjects.code, type: subjects.type, categoryId: subjects.categoryId }).from(subjects).where(eq(subjects.id, p.subjectId))
    : [];
  const rows = p.questionIds.length
    ? await db
        .select({ id: questions.id, type: questions.type, stimulusId: questions.stimulusId, imageUrl: questions.imageUrl, subjectCode: subjects.code })
        .from(questions)
        .innerJoin(subtopics, eq(subtopics.id, questions.subtopicId))
        .innerJoin(topics, eq(topics.id, subtopics.topicId))
        .innerJoin(subjects, eq(subjects.id, topics.subjectId))
        .where(inArray(questions.id, p.questionIds))
    : [];
  return checkPackageRules({
    jenjang: cat?.code ?? "",
    // Mapel dari jenjang lain dianggap tidak dipilih.
    subject: subject && subject.categoryId === p.categoryId ? { code: subject.code, type: subject.type } : null,
    durationMinutes: p.durationMinutes,
    questions: rows.map((r) => ({ type: r.type, subjectCode: r.subjectCode, stimulusKey: r.stimulusId, hasImage: r.imageUrl != null })),
  });
}
