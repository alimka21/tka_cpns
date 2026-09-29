// Query baca Bank Soal & Stimulus (admin). Tidak memuat kunci jawaban,
// kecuali `getQuestionForEdit` (halaman Edit Soal, admin saja).

import { asc, desc, eq, isNotNull } from "drizzle-orm";
import { db } from "@/server/db";
import { categories, questionExplanations, questionOptions, questions, stimuli, subjects, subtopics, topics } from "@/server/db/schema";
import type { QuestionEditData, QuestionListRow, StimulusListItem } from "@/lib/question-bank-types";
import { questionUsage } from "@/server/services/question-store";

/** Batas sementara sebelum ada paginasi server. */
const LIST_LIMIT = 500;

export async function listQuestions(): Promise<QuestionListRow[]> {
  const rows = await db
    .select({
      id: questions.id,
      text: questions.questionText,
      jenjang: categories.code,
      topic: subjects.name,
      subtopicId: subtopics.id,
      subtopicCode: subtopics.code,
      subtopic: subtopics.name,
      difficulty: questions.difficulty,
      type: questions.type,
      status: questions.status,
      generatedBy: questions.generatedBy,
      createdAt: questions.createdAt,
      stimulusCode: stimuli.code,
      stimulusOrder: questions.stimulusOrder,
    })
    .from(questions)
    .innerJoin(subtopics, eq(subtopics.id, questions.subtopicId))
    .innerJoin(topics, eq(topics.id, subtopics.topicId))
    .innerJoin(subjects, eq(subjects.id, topics.subjectId))
    .innerJoin(categories, eq(categories.id, subjects.categoryId))
    .leftJoin(stimuli, eq(stimuli.id, questions.stimulusId))
    .orderBy(desc(questions.createdAt), desc(questions.id))
    .limit(LIST_LIMIT);
  return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
}

export async function listStimuli(): Promise<StimulusListItem[]> {
  const [stimulusRows, questionRows] = await Promise.all([
    db.select().from(stimuli).orderBy(desc(stimuli.createdAt), desc(stimuli.id)),
    db
      .select({
        id: questions.id,
        stimulusId: questions.stimulusId,
        order: questions.stimulusOrder,
        type: questions.type,
        text: questions.questionText,
        subtopic: subtopics.name,
      })
      .from(questions)
      .innerJoin(subtopics, eq(subtopics.id, questions.subtopicId))
      .where(isNotNull(questions.stimulusId))
      .orderBy(asc(questions.stimulusOrder)),
  ]);
  return stimulusRows.map((s) => ({
    id: s.id,
    code: s.code,
    title: s.title,
    content: s.content,
    status: s.status,
    createdAt: s.createdAt.toISOString(),
    questions: questionRows
      .filter((q) => q.stimulusId === s.id)
      .map((q) => ({ id: q.id, order: q.order, type: q.type, text: q.text, subtopic: q.subtopic })),
  }));
}

export async function getQuestionForEdit(id: number): Promise<QuestionEditData | undefined> {
  const [row] = await db
    .select({ question: questions, subdomainCode: subtopics.code, explanation: questionExplanations.explanationText })
    .from(questions)
    .innerJoin(subtopics, eq(subtopics.id, questions.subtopicId))
    .leftJoin(questionExplanations, eq(questionExplanations.questionId, questions.id))
    .where(eq(questions.id, id));
  if (!row) return undefined;
  const q = row.question;
  const [options, usage] = await Promise.all([
    db.select().from(questionOptions).where(eq(questionOptions.questionId, id)).orderBy(asc(questionOptions.order)),
    questionUsage(db, id),
  ]);
  return {
    id: q.id,
    subdomainCode: row.subdomainCode,
    type: q.type,
    questionText: q.questionText,
    imageUrl: q.imageUrl,
    difficulty: q.difficulty,
    cognitiveLevel: q.cognitiveLevel,
    status: q.status,
    categoryLabels: q.categoryLabels,
    stimulusId: q.stimulusId,
    stimulusOrder: q.stimulusOrder,
    explanationText: row.explanation ?? "",
    options: options.map((o) => ({ text: o.optionText, isCorrect: o.isCorrect, correctCategory: o.correctCategory })),
    usage,
  };
}
