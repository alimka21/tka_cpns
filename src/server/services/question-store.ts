// Penyimpanan soal ke DB — dipakai form admin & import Excel supaya aturan
// simpannya satu. Pemanggil WAJIB sudah memvalidasi input (questionInput)
// dan mengecek sesi admin.

import { and, eq, inArray } from "drizzle-orm";
import type { db as Db } from "@/server/db";
import { questionExplanations, questionOptions, questions, stimuli, subtopics } from "@/server/db/schema";
import type { QuestionInput } from "@/lib/validation/question";

type Tx = Parameters<Parameters<typeof Db.transaction>[0]>[0];
type Executor = typeof Db | Tx;

export type QuestionSource = { generatedBy: "manual" | "import" | "ai"; userId: number };

export async function insertQuestion(tx: Executor, q: QuestionInput, source: QuestionSource) {
  const [{ id }] = await tx
    .insert(questions)
    .values({
      subtopicId: q.subtopicId,
      type: q.type,
      questionText: q.questionText,
      imageUrl: q.imageUrl ?? null,
      difficulty: q.difficulty,
      cognitiveLevel: q.cognitiveLevel ?? null,
      categoryLabels: q.type === "pgk_kategori" ? [q.categoryLabels[0], q.categoryLabels[1]] : null,
      stimulusId: q.stimulusId ?? null,
      stimulusOrder: q.stimulusOrder ?? null,
      status: q.status,
      generatedBy: source.generatedBy,
      sourceUserId: source.generatedBy === "manual" ? null : source.userId,
      createdBy: source.userId,
    })
    .$returningId();

  await tx.insert(questionOptions).values(
    q.options.map((o, i) => ({
      questionId: id,
      label: o.label,
      optionText: o.optionText,
      isCorrect: q.type === "pgk_kategori" ? false : o.isCorrect,
      correctCategory: q.type === "pgk_kategori" ? (o.correctCategory ?? null) : null,
      order: i,
    })),
  );
  if (q.explanationText) {
    await tx.insert(questionExplanations).values({ questionId: id, explanationText: q.explanationText });
  }
  return id;
}

/** Peta kode subdomain → subtopics.id (hanya kode yang sudah di-seed). */
export async function subtopicIdsByCode(tx: Executor, codes: string[]) {
  if (codes.length === 0) return new Map<string, number>();
  const rows = await tx.select({ id: subtopics.id, code: subtopics.code }).from(subtopics).where(inArray(subtopics.code, codes));
  return new Map(rows.map((r) => [r.code, r.id]));
}

export async function stimulusExists(tx: Executor, stimulusId: number) {
  const [row] = await tx.select({ id: stimuli.id }).from(stimuli).where(eq(stimuli.id, stimulusId));
  return Boolean(row);
}

export async function stimulusOrderTaken(tx: Executor, stimulusId: number, order: number) {
  const [row] = await tx
    .select({ id: questions.id })
    .from(questions)
    .where(and(eq(questions.stimulusId, stimulusId), eq(questions.stimulusOrder, order)));
  return Boolean(row);
}
