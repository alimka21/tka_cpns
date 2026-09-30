// Query baca Bank Soal & Stimulus (admin). Tidak memuat kunci jawaban,
// kecuali `getQuestionForEdit` (halaman Edit Soal, admin saja).

import { and, asc, count, desc, eq, isNotNull, like, sql, type SQL } from "drizzle-orm";
import type { BankFilters } from "@/lib/bank-filters";
import { db } from "@/server/db";
import { categories, questionExplanations, questionOptions, questions, stimuli, subjects, subtopics, topics } from "@/server/db/schema";
import type { QuestionEditData, QuestionListRow, StimulusListItem } from "@/lib/question-bank-types";
import { renderMathToHtml } from "@/lib/math-html";
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
      hasImage: sql<number>`${questions.imageUrl} is not null`,
    })
    .from(questions)
    .innerJoin(subtopics, eq(subtopics.id, questions.subtopicId))
    .innerJoin(topics, eq(topics.id, subtopics.topicId))
    .innerJoin(subjects, eq(subjects.id, topics.subjectId))
    .innerJoin(categories, eq(categories.id, subjects.categoryId))
    .leftJoin(stimuli, eq(stimuli.id, questions.stimulusId))
    .orderBy(desc(questions.createdAt), desc(questions.id))
    .limit(LIST_LIMIT);
  return rows.map((r) => ({ ...r, html: renderMathToHtml(r.text), hasImage: Boolean(Number(r.hasImage)), createdAt: r.createdAt.toISOString() }));
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

// ── Bank Soal berjenjang (filter server-side) ─────────────────────────────

export type BankCount = { total: number; published: number; pending: number };

export type BankNode = { code: string; name: string; count: BankCount; children: BankNode[] };

const emptyCount = (): BankCount => ({ total: 0, published: 0, pending: 0 });
function addCount(into: BankCount, c: BankCount) {
  into.total += c.total;
  into.published += c.published;
  into.pending += c.pending;
}

/** Jenjang → mata uji → topik (domain) → subtopik, masing-masing dengan jumlah soal (termasuk 0). */
export async function getBankHierarchy(): Promise<BankNode[]> {
  const [cats, subs, tops, subtops, counts] = await Promise.all([
    db.select({ id: categories.id, code: categories.code, name: categories.name }).from(categories),
    db.select({ id: subjects.id, categoryId: subjects.categoryId, code: subjects.code, name: subjects.name }).from(subjects).orderBy(asc(subjects.order)),
    db.select({ id: topics.id, subjectId: topics.subjectId, code: topics.code, name: topics.name }).from(topics).orderBy(asc(topics.order)),
    db.select({ id: subtopics.id, topicId: subtopics.topicId, code: subtopics.code, name: subtopics.name }).from(subtopics).orderBy(asc(subtopics.order)),
    db
      .select({
        subtopicId: questions.subtopicId,
        total: count(),
        published: sql<number>`sum(case when ${questions.status} = 'published' then 1 else 0 end)`,
        pending: sql<number>`sum(case when ${questions.status} = 'pending_review' then 1 else 0 end)`,
      })
      .from(questions)
      .groupBy(questions.subtopicId),
  ]);
  const countBy = new Map(counts.map((c) => [c.subtopicId, { total: Number(c.total), published: Number(c.published), pending: Number(c.pending) }]));

  const build = <T extends { id: number; code: string; name: string }>(rows: T[], children: (row: T) => BankNode[], own?: (row: T) => BankCount) =>
    rows.map((r) => {
      const kids = children(r);
      const count = own ? own(r) : emptyCount();
      if (!own) kids.forEach((k) => addCount(count, k.count));
      return { code: r.code, name: r.name, count, children: kids };
    });

  const order = ["SD", "SMP", "SMA"];
  return build(
    [...cats].sort((a, b) => order.indexOf(a.code) - order.indexOf(b.code)),
    (c) =>
      build(
        subs.filter((s) => s.categoryId === c.id),
        (s) =>
          build(
            tops.filter((t) => t.subjectId === s.id),
            (t) => build(subtops.filter((st) => st.topicId === t.id), () => [], (st) => countBy.get(st.id) ?? emptyCount()),
          ),
      ),
  );
}

export const BANK_PAGE_SIZE = 30;

/** Daftar soal sesuai filter, terbaru dulu, dengan paginasi. */
export async function searchQuestions(f: BankFilters): Promise<{ rows: QuestionListRow[]; total: number }> {
  const conditions = [
    f.jenjang && eq(categories.code, f.jenjang),
    f.mapel && eq(subjects.code, f.mapel),
    f.topik && eq(topics.code, f.topik),
    f.sub && eq(subtopics.code, f.sub),
    f.status && eq(questions.status, f.status),
    f.bentuk && eq(questions.type, f.bentuk),
    f.tingkat && eq(questions.difficulty, f.tingkat),
    f.sumber && eq(questions.generatedBy, f.sumber),
    f.q && like(questions.questionText, `%${f.q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`),
  ].filter((c): c is SQL => Boolean(c));
  const where = conditions.length ? and(...conditions) : undefined;

  const page = f.hal ?? 1;
  const [rows, [{ n }]] = await Promise.all([
    db
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
        hasImage: sql<number>`${questions.imageUrl} is not null`,
      })
      .from(questions)
      .innerJoin(subtopics, eq(subtopics.id, questions.subtopicId))
      .innerJoin(topics, eq(topics.id, subtopics.topicId))
      .innerJoin(subjects, eq(subjects.id, topics.subjectId))
      .innerJoin(categories, eq(categories.id, subjects.categoryId))
      .leftJoin(stimuli, eq(stimuli.id, questions.stimulusId))
      .where(where)
      .orderBy(desc(questions.createdAt), desc(questions.id))
      .limit(BANK_PAGE_SIZE)
      .offset((page - 1) * BANK_PAGE_SIZE),
    db
      .select({ n: count() })
      .from(questions)
      .innerJoin(subtopics, eq(subtopics.id, questions.subtopicId))
      .innerJoin(topics, eq(topics.id, subtopics.topicId))
      .innerJoin(subjects, eq(subjects.id, topics.subjectId))
      .innerJoin(categories, eq(categories.id, subjects.categoryId))
      .where(where),
  ]);
  return { rows: rows.map((r) => ({ ...r, html: renderMathToHtml(r.text), hasImage: Boolean(Number(r.hasImage)), createdAt: r.createdAt.toISOString() })), total: Number(n) };
}
