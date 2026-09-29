// Query ringkasan untuk Dashboard Admin. Angka aktivitas (grafik & tabel)
// diturunkan dari tabel `attempts` yang sungguhan ada — tidak ada tabel log
// aktivitas terpisah, jadi cakupannya terbatas ke percobaan tes (belum
// mencakup mis. "admin mengimpor soal").

import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { attempts, categories, entitlements, questions, testPackages, users } from "@/server/db/schema";

export type AdminStats = {
  users: number;
  premiumUsers: number;
  questions: number;
  pendingReview: number;
  publishedPackages: number;
  attemptsToday: number;
};

export async function getAdminStats(): Promise<AdminStats> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [[u], [q], [pkg], [today]] = await Promise.all([
    db.select({ n: sql<number>`count(*)`, premium: sql<number>`count(distinct ${entitlements.userId})` }).from(users).leftJoin(entitlements, eq(entitlements.userId, users.id)),
    db
      .select({ n: sql<number>`count(*)`, pending: sql<number>`sum(case when ${questions.status} = 'pending_review' then 1 else 0 end)` })
      .from(questions),
    db.select({ n: sql<number>`count(*)` }).from(testPackages).where(eq(testPackages.status, "published")),
    db.select({ n: sql<number>`count(*)` }).from(attempts).where(and(eq(attempts.status, "submitted"), gte(attempts.submittedAt, startOfToday))),
  ]);

  return {
    users: Number(u?.n ?? 0),
    premiumUsers: Number(u?.premium ?? 0),
    questions: Number(q?.n ?? 0),
    pendingReview: Number(q?.pending ?? 0),
    publishedPackages: Number(pkg?.n ?? 0),
    attemptsToday: Number(today?.n ?? 0),
  };
}

export type AttemptsPerDay = { day: string; count: number };

const DAY_LABEL = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export async function getAttemptsPerDay(days = 7): Promise<AttemptsPerDay[]> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  const rows = await db
    .select({ day: sql<string>`date(${attempts.submittedAt})`, count: sql<number>`count(*)` })
    .from(attempts)
    .where(and(eq(attempts.status, "submitted"), gte(attempts.submittedAt, start)))
    .groupBy(sql`date(${attempts.submittedAt})`);
  const countByDate = new Map(rows.map((r) => [r.day, Number(r.count)]));

  const result: AttemptsPerDay[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    result.push({ day: DAY_LABEL[d.getDay()], count: countByDate.get(key) ?? 0 });
  }
  return result;
}

export type RecentAttempt = {
  id: number;
  userName: string;
  packageTitle: string;
  jenjang: string;
  score: number;
  submittedAt: string;
};

export async function getRecentAttempts(limit = 8): Promise<RecentAttempt[]> {
  const rows = await db
    .select({
      id: attempts.id,
      userName: users.name,
      packageTitle: testPackages.title,
      jenjang: categories.code,
      totalScore: attempts.totalScore,
      maxScore: attempts.maxScore,
      submittedAt: attempts.submittedAt,
    })
    .from(attempts)
    .innerJoin(users, eq(users.id, attempts.userId))
    .innerJoin(testPackages, eq(testPackages.id, attempts.testPackageId))
    .innerJoin(categories, eq(categories.id, testPackages.categoryId))
    .where(eq(attempts.status, "submitted"))
    .orderBy(desc(attempts.submittedAt))
    .limit(limit);
  return rows.map((r) => ({
    id: r.id,
    userName: r.userName,
    packageTitle: r.packageTitle,
    jenjang: r.jenjang,
    score: r.maxScore ? Math.round(((r.totalScore ?? 0) / r.maxScore) * 100) : 0,
    submittedAt: (r.submittedAt ?? new Date()).toISOString(),
  }));
}
