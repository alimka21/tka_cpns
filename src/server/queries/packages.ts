// Query baca Paket Tes, Entitlement, dan bank soal terpublikasi untuk
// penyusunan paket (admin) & daftar tes (siswa). Tidak memuat kunci jawaban
// kecuali `getPackageDetail`, yang HANYA dipakai server-side (attempt
// service & halaman ujian) — jangan pernah kirim hasilnya utuh ke client.

import { and, asc, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import { db } from "@/server/db";
import {
  attempts,
  categories,
  entitlements,
  questionOptions,
  questions,
  stimuli,
  testPackageQuestions,
  testPackages,
  users,
} from "@/server/db/schema";
import type { QuestionType } from "@/lib/validation/enums";

export type CategoryOption = { id: number; code: string; name: string };

export async function listCategories(): Promise<CategoryOption[]> {
  const rows = await db.select({ id: categories.id, code: categories.code, name: categories.name }).from(categories);
  const order = ["SD", "SMP", "SMA"];
  return rows.sort((a, b) => order.indexOf(a.code) - order.indexOf(b.code));
}

export type PackageQuestionOption = {
  id: number;
  label: string;
  optionText: string;
  isCorrect: boolean;
  correctCategory: string | null;
};

export type PackageQuestion = {
  id: number;
  order: number;
  type: QuestionType;
  questionText: string;
  imageUrl: string | null;
  categoryLabels: [string, string] | null;
  stimulusId: number | null;
  stimulusOrder: number | null;
  subtopicId: number;
  pointsOverride: number | null;
  options: PackageQuestionOption[];
};

export type PackageDetail = {
  id: number;
  title: string;
  description: string | null;
  categoryId: number;
  categoryCode: string;
  durationMinutes: number;
  isPremium: boolean;
  status: "draft" | "published";
  questions: PackageQuestion[];
  stimuli: { id: number; title: string; content: string; imageUrl: string | null }[];
};

/** Detail lengkap 1 paket (soal + opsi, urut sesuai susunan admin). Server-only. */
export async function getPackageDetail(testPackageId: number): Promise<PackageDetail | undefined> {
  const [pkg] = await db
    .select({
      id: testPackages.id,
      title: testPackages.title,
      description: testPackages.description,
      categoryId: testPackages.categoryId,
      categoryCode: categories.code,
      durationMinutes: testPackages.durationMinutes,
      isPremium: testPackages.isPremium,
      status: testPackages.status,
    })
    .from(testPackages)
    .innerJoin(categories, eq(categories.id, testPackages.categoryId))
    .where(eq(testPackages.id, testPackageId));
  if (!pkg) return undefined;

  const rows = await db
    .select({
      id: questions.id,
      order: testPackageQuestions.order,
      type: questions.type,
      questionText: questions.questionText,
      imageUrl: questions.imageUrl,
      categoryLabels: questions.categoryLabels,
      stimulusId: questions.stimulusId,
      stimulusOrder: questions.stimulusOrder,
      subtopicId: questions.subtopicId,
      pointsOverride: testPackageQuestions.pointsOverride,
    })
    .from(testPackageQuestions)
    .innerJoin(questions, eq(questions.id, testPackageQuestions.questionId))
    .where(eq(testPackageQuestions.testPackageId, testPackageId))
    .orderBy(asc(testPackageQuestions.order));

  const questionIds = rows.map((r) => r.id);
  const optionRows = questionIds.length
    ? await db.select().from(questionOptions).where(inArray(questionOptions.questionId, questionIds)).orderBy(asc(questionOptions.order))
    : [];
  const optionsByQuestion = new Map<number, PackageQuestionOption[]>();
  for (const o of optionRows) {
    const list = optionsByQuestion.get(o.questionId) ?? [];
    list.push({ id: o.id, label: o.label, optionText: o.optionText, isCorrect: o.isCorrect, correctCategory: o.correctCategory });
    optionsByQuestion.set(o.questionId, list);
  }

  const stimulusIds = [...new Set(rows.map((r) => r.stimulusId).filter((id): id is number => id != null))];
  const stimulusRows = stimulusIds.length
    ? await db
        .select({ id: stimuli.id, title: stimuli.title, content: stimuli.content, imageUrl: stimuli.imageUrl })
        .from(stimuli)
        .where(inArray(stimuli.id, stimulusIds))
    : [];

  return {
    ...pkg,
    questions: rows.map((r) => ({ ...r, options: optionsByQuestion.get(r.id) ?? [] })),
    stimuli: stimulusRows,
  };
}

export type AdminPackageRow = {
  id: number;
  title: string;
  categoryCode: string;
  durationMinutes: number;
  isPremium: boolean;
  status: "draft" | "published";
  questionCount: number;
  createdAt: string;
};

export async function listPackagesAdmin(): Promise<AdminPackageRow[]> {
  const rows = await db
    .select({
      id: testPackages.id,
      title: testPackages.title,
      categoryCode: categories.code,
      durationMinutes: testPackages.durationMinutes,
      isPremium: testPackages.isPremium,
      status: testPackages.status,
      createdAt: testPackages.createdAt,
      questionCount: sql<number>`count(${testPackageQuestions.id})`,
    })
    .from(testPackages)
    .innerJoin(categories, eq(categories.id, testPackages.categoryId))
    .leftJoin(testPackageQuestions, eq(testPackageQuestions.testPackageId, testPackages.id))
    .groupBy(testPackages.id, categories.code)
    .orderBy(desc(testPackages.createdAt));
  return rows.map((r) => ({ ...r, questionCount: Number(r.questionCount), createdAt: r.createdAt.toISOString() }));
}

export type StudentPackageRow = {
  id: number;
  title: string;
  description: string | null;
  categoryCode: string;
  durationMinutes: number;
  isPremium: boolean;
  questionCount: number;
  unlocked: boolean;
  lastScore: number | null;
};

/** Paket tayang untuk siswa, dengan status akses & skor terakhir milik user itu. */
export async function listPackagesForStudent(userId: number): Promise<StudentPackageRow[]> {
  const rows = await db
    .select({
      id: testPackages.id,
      title: testPackages.title,
      description: testPackages.description,
      categoryCode: categories.code,
      durationMinutes: testPackages.durationMinutes,
      isPremium: testPackages.isPremium,
      questionCount: sql<number>`count(distinct ${testPackageQuestions.id})`,
      entitlementId: sql<number | null>`max(${entitlements.id})`,
    })
    .from(testPackages)
    .innerJoin(categories, eq(categories.id, testPackages.categoryId))
    .leftJoin(testPackageQuestions, eq(testPackageQuestions.testPackageId, testPackages.id))
    .leftJoin(entitlements, and(eq(entitlements.testPackageId, testPackages.id), eq(entitlements.userId, userId)))
    .where(eq(testPackages.status, "published"))
    .groupBy(testPackages.id, categories.code)
    .orderBy(desc(testPackages.id));

  const lastScoreRows = await db
    .select({ testPackageId: attempts.testPackageId, totalScore: attempts.totalScore, maxScore: attempts.maxScore })
    .from(attempts)
    .where(and(eq(attempts.userId, userId), eq(attempts.status, "submitted")))
    .orderBy(desc(attempts.submittedAt));
  const lastScoreByPackage = new Map<number, number>();
  for (const a of lastScoreRows) {
    if (!lastScoreByPackage.has(a.testPackageId) && a.totalScore != null && a.maxScore) {
      lastScoreByPackage.set(a.testPackageId, Math.round((a.totalScore / a.maxScore) * 100));
    }
  }

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    categoryCode: r.categoryCode,
    durationMinutes: r.durationMinutes,
    isPremium: r.isPremium,
    questionCount: Number(r.questionCount),
    unlocked: !r.isPremium || r.entitlementId != null,
    lastScore: lastScoreByPackage.get(r.id) ?? null,
  }));
}

export async function hasEntitlement(userId: number, testPackageId: number) {
  const [row] = await db
    .select({ id: entitlements.id })
    .from(entitlements)
    .where(and(eq(entitlements.userId, userId), eq(entitlements.testPackageId, testPackageId)));
  return Boolean(row);
}

export type EntitledUser = { id: number; name: string; email: string; grantedAt: string };

export async function listEntitledUsers(testPackageId: number): Promise<EntitledUser[]> {
  const rows = await db
    .select({ id: users.id, name: users.name, email: users.email, grantedAt: entitlements.grantedAt })
    .from(entitlements)
    .innerJoin(users, eq(users.id, entitlements.userId))
    .where(eq(entitlements.testPackageId, testPackageId))
    .orderBy(desc(entitlements.grantedAt));
  return rows.map((r) => ({ ...r, grantedAt: r.grantedAt.toISOString() }));
}

export type UserSearchResult = { id: number; name: string; email: string };

/** Cari user (nama/email) untuk diberi akses premium — dipanggil dari admin. */
export async function searchUsers(query: string, limit = 8): Promise<UserSearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const like_ = `%${q}%`;
  return db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(or(like(users.name, like_), like(users.email, like_)))
    .limit(limit);
}
