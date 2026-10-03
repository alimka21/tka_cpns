// Data halaman Pratinjau Paket (admin, /admin/paket-tes/[id]/pratinjau):
// metadata tinjauan per soal + ringkasan kesiapan terbit. Server-only —
// mode "kunci" memuat kunci jawaban (admin saja).

import { and, eq, inArray, sql } from "drizzle-orm";
import type { Difficulty } from "@/lib/validation/enums";
import { db } from "@/server/db";
import { questionExplanations, questionReports, questions, subtopics, topics } from "@/server/db/schema";

export type PreviewQuestionMeta = {
  status: "draft" | "pending_review" | "published";
  generatedBy: "manual" | "ai" | "import";
  difficulty: Difficulty;
  cognitiveLevel: string | null;
  subtopicName: string;
  topicName: string;
  explanation: string | null;
  openReports: number;
};

export async function loadPreviewMeta(questionIds: number[]): Promise<Map<number, PreviewQuestionMeta>> {
  if (questionIds.length === 0) return new Map();
  const [rows, reports] = await Promise.all([
    db
      .select({
        id: questions.id,
        status: questions.status,
        generatedBy: questions.generatedBy,
        difficulty: questions.difficulty,
        cognitiveLevel: questions.cognitiveLevel,
        subtopicName: subtopics.name,
        topicName: topics.name,
        explanation: questionExplanations.explanationText,
      })
      .from(questions)
      .innerJoin(subtopics, eq(subtopics.id, questions.subtopicId))
      .innerJoin(topics, eq(topics.id, subtopics.topicId))
      .leftJoin(questionExplanations, eq(questionExplanations.questionId, questions.id))
      .where(inArray(questions.id, questionIds)),
    db
      .select({ questionId: questionReports.questionId, n: sql<number>`count(*)` })
      .from(questionReports)
      .where(and(inArray(questionReports.questionId, questionIds), eq(questionReports.status, "open")))
      .groupBy(questionReports.questionId),
  ]);
  const reportCount = new Map(reports.map((r) => [r.questionId!, Number(r.n)]));
  return new Map(rows.map((r) => [r.id, { ...r, explanation: r.explanation ?? null, openReports: reportCount.get(r.id) ?? 0 }]));
}
