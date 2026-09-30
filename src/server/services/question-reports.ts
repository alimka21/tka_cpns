// Laporan soal dari siswa & antrean admin.

import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type { ReviewItem } from "@/lib/review";
import { db } from "@/server/db";
import { practiceQuestions, questionReports, questions, users, type ReportReason } from "@/server/db/schema";
import { loadPracticeAiQuestions, loadQuestionsWithKeys } from "@/server/queries/practice";
import { buildReviewItem } from "@/server/services/review";

export type ReportTarget = { questionId: number } | { practiceQuestionId: number };

type Result = { ok: true } | { ok: false; error: string };

/** Satu laporan per siswa per soal — laporan ulang memperbarui alasan & membuka lagi. */
export async function submitReport(userId: number, target: ReportTarget, reason: ReportReason, note: string | null): Promise<Result> {
  if ("practiceQuestionId" in target) {
    const [pq] = await db.select({ owner: practiceQuestions.ownerUserId }).from(practiceQuestions).where(eq(practiceQuestions.id, target.practiceQuestionId));
    // Soal Latihan AI hanya bisa dilaporkan pemiliknya.
    if (!pq || pq.owner !== userId) return { ok: false, error: "Soal tidak ditemukan." };
  } else {
    const [q] = await db.select({ id: questions.id }).from(questions).where(eq(questions.id, target.questionId));
    if (!q) return { ok: false, error: "Soal tidak ditemukan." };
  }
  const values = { reason, note, status: "open" as const, resolvedBy: null, resolvedAt: null, createdAt: new Date() };
  await db
    .insert(questionReports)
    .values({ userId, ...target, ...values })
    .onDuplicateKeyUpdate({ set: values });
  return { ok: true };
}

export type ReportGroup = {
  key: string;
  target: ReportTarget;
  isAi: boolean;
  /** Pemilik soal Latihan AI (nama siswa). */
  owner: string | null;
  review: ReviewItem | null;
  reports: { reporter: string; reason: ReportReason; note: string | null; createdAt: string }[];
};

/** Laporan terbuka, dikelompokkan per soal (terbanyak dilaporkan dulu). */
export async function listOpenReports(): Promise<ReportGroup[]> {
  const rows = await db
    .select({
      questionId: questionReports.questionId,
      practiceQuestionId: questionReports.practiceQuestionId,
      reason: questionReports.reason,
      note: questionReports.note,
      createdAt: questionReports.createdAt,
      reporter: users.name,
    })
    .from(questionReports)
    .innerJoin(users, eq(users.id, questionReports.userId))
    .where(eq(questionReports.status, "open"))
    .orderBy(desc(questionReports.createdAt))
    .limit(500);

  const groups = new Map<string, ReportGroup>();
  for (const r of rows) {
    const target: ReportTarget = r.questionId != null ? { questionId: r.questionId } : { practiceQuestionId: r.practiceQuestionId! };
    const key = r.questionId != null ? `q${r.questionId}` : `p${r.practiceQuestionId}`;
    const g = groups.get(key) ?? { key, target, isAi: r.questionId == null, owner: null, review: null, reports: [] };
    g.reports.push({ reporter: r.reporter, reason: r.reason, note: r.note, createdAt: r.createdAt.toISOString() });
    groups.set(key, g);
  }

  const list = [...groups.values()];
  const bankIds = list.flatMap((g) => ("questionId" in g.target ? [g.target.questionId] : []));
  const aiIds = list.flatMap((g) => ("practiceQuestionId" in g.target ? [g.target.practiceQuestionId] : []));
  const [bank, ai, owners] = await Promise.all([
    loadQuestionsWithKeys(bankIds),
    loadPracticeAiQuestions(aiIds),
    aiIds.length
      ? db
          .select({ id: practiceQuestions.id, name: users.name })
          .from(practiceQuestions)
          .innerJoin(users, eq(users.id, practiceQuestions.ownerUserId))
          .where(inArray(practiceQuestions.id, aiIds))
      : [],
  ]);
  const ownerOf = new Map(owners.map((o) => [o.id, o.name]));
  for (const g of list) {
    const q = "questionId" in g.target ? bank.get(g.target.questionId) : ai.get(g.target.practiceQuestionId);
    if (q) g.review = buildReviewItem(q, null, 0, q.subtopicName, q.explanation);
    if ("practiceQuestionId" in g.target) g.owner = ownerOf.get(g.target.practiceQuestionId) ?? null;
  }
  return list.sort((a, b) => b.reports.length - a.reports.length);
}

export async function countOpenReports() {
  const [{ n }] = await db.select({ n: sql<number>`count(distinct coalesce(concat('q', ${questionReports.questionId}), concat('p', ${questionReports.practiceQuestionId})))` }).from(questionReports).where(eq(questionReports.status, "open"));
  return Number(n);
}

/** Tutup semua laporan terbuka untuk satu soal. */
export async function resolveReports(adminId: number, target: ReportTarget) {
  const cond = "questionId" in target ? eq(questionReports.questionId, target.questionId) : eq(questionReports.practiceQuestionId, target.practiceQuestionId);
  await db
    .update(questionReports)
    .set({ status: "resolved", resolvedBy: adminId, resolvedAt: new Date() })
    .where(and(cond, eq(questionReports.status, "open")));
}
