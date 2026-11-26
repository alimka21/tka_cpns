// Kelas guru (DECISIONS 2026-11-26). Guru = users.is_teacher ATAU afiliasi aktif. Siswa bergabung
// dengan kode kelas (bukan kode afiliasi). Selama menjadi anggota, guru melihat seluruh hasil tes &
// latihan siswa itu. Tugas = paket tes tayang jenjang kelas; aksesnya tetap aturan biasa (Premium/kuota).

import { and, asc, count, desc, eq, gt, inArray, isNull, max, or, sql } from "drizzle-orm";
import { assignmentPhase, attemptCountsForAssignment, generateClassCode, type AssignmentInput, type AssignmentPhase, type ClassInput } from "@/lib/classroom";
import { averageScore, type ScoreView } from "@/lib/score-display";
import type { ScoreScale } from "@/lib/score-scale";
import { db } from "@/server/db";
import {
  attempts,
  categories,
  classAssignments,
  classes,
  classMembers,
  memberships,
  practiceSessions,
  subjects,
  subtopics,
  testPackages,
  topics,
  users,
} from "@/server/db/schema";
import { freeUsageBySubject } from "@/server/queries/free-usage";
import { loadDiagnosisRecords } from "@/server/queries/practice";
import { diagnose, type DiagnosisStatus } from "./diagnosis";
import { affiliateOfUser } from "./affiliates";
import { buildScoreView } from "./score-view";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };
type Jenjang = ClassInput["jenjang"];

export const MAX_CLASSES_PER_TEACHER = 30;
export const MAX_MEMBERS_PER_CLASS = 200;

// ——— Guru ———

/** `hasAffiliate` = punya baris afiliasi (status apa pun) — halaman Afiliasi tetap terbuka untuk riwayat komisi. */
export type TeacherInfo = { isTeacher: boolean; selfServe: boolean; affiliateActive: boolean; hasAffiliate: boolean };

export async function teacherInfo(userId: number): Promise<TeacherInfo> {
  const [[row], affiliate] = await Promise.all([db.select({ isTeacher: users.isTeacher }).from(users).where(eq(users.id, userId)), affiliateOfUser(userId)]);
  const affiliateActive = affiliate?.status === "active";
  const selfServe = Boolean(row?.isTeacher);
  return { isTeacher: selfServe || affiliateActive, selfServe, affiliateActive, hasAffiliate: affiliate != null };
}

export async function enableTeacher(userId: number) {
  await db.update(users).set({ isTeacher: true }).where(eq(users.id, userId));
}

/** Guru yang mendaftar sendiri dan belum menjadi afiliasi — untuk admin (calon afiliasi). */
export async function listSelfServeTeachers() {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      school: users.schoolName,
      createdAt: users.createdAt,
      classCount: sql<number>`(select count(*) from classes c where c.teacher_id = users.id)`,
      studentCount: sql<number>`(select count(*) from class_members m inner join classes c on c.id = m.class_id where c.teacher_id = users.id)`,
    })
    .from(users)
    .where(and(eq(users.isTeacher, true), sql`not exists (select 1 from affiliates a where a.user_id = ${users.id})`))
    .orderBy(desc(users.createdAt));
  return rows.map((r) => ({ ...r, classCount: Number(r.classCount), studentCount: Number(r.studentCount), createdAt: r.createdAt.toISOString() }));
}

// ——— Kelas (sisi guru) ———

async function newUniqueClassCode() {
  for (let i = 0; i < 10; i++) {
    const code = generateClassCode();
    const [dup] = await db.select({ id: classes.id }).from(classes).where(eq(classes.joinCode, code));
    if (!dup) return code;
  }
  throw new Error("Gagal membuat kode kelas unik.");
}

export type TeacherClassRow = { id: number; name: string; jenjang: Jenjang; joinCode: string; archived: boolean; members: number; assignments: number; createdAt: string };

export async function listTeacherClasses(teacherId: number): Promise<TeacherClassRow[]> {
  const rows = await db
    .select({
      id: classes.id,
      name: classes.name,
      jenjang: classes.jenjang,
      joinCode: classes.joinCode,
      archivedAt: classes.archivedAt,
      createdAt: classes.createdAt,
      members: sql<number>`(select count(*) from class_members m where m.class_id = classes.id)`,
      assignments: sql<number>`(select count(*) from class_assignments a where a.class_id = classes.id)`,
    })
    .from(classes)
    .where(eq(classes.teacherId, teacherId))
    .orderBy(sql`${classes.archivedAt} is not null`, desc(classes.createdAt));
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    jenjang: r.jenjang,
    joinCode: r.joinCode,
    archived: r.archivedAt != null,
    members: Number(r.members),
    assignments: Number(r.assignments),
    createdAt: r.createdAt.toISOString(),
  }));
}

/** Kelas milik guru ini (cek kepemilikan); null bila bukan miliknya. */
export async function getOwnedClass(teacherId: number, classId: number) {
  const [row] = await db.select().from(classes).where(and(eq(classes.id, classId), eq(classes.teacherId, teacherId)));
  return row ?? null;
}

export async function createClass(teacherId: number, input: ClassInput): Promise<Result<{ id: number; joinCode: string }>> {
  const [{ n }] = await db.select({ n: count() }).from(classes).where(eq(classes.teacherId, teacherId));
  if (n >= MAX_CLASSES_PER_TEACHER) return { ok: false, error: `Maksimal ${MAX_CLASSES_PER_TEACHER} kelas per guru. Arsipkan atau hapus kelas lama.` };
  const joinCode = await newUniqueClassCode();
  const [res] = await db.insert(classes).values({ teacherId, name: input.name, jenjang: input.jenjang, joinCode }).$returningId();
  return { ok: true, id: res.id, joinCode };
}

export async function renameClass(teacherId: number, classId: number, name: string): Promise<Result> {
  if (!(await getOwnedClass(teacherId, classId))) return { ok: false, error: "Kelas tidak ditemukan." };
  await db.update(classes).set({ name }).where(eq(classes.id, classId));
  return { ok: true };
}

export async function setClassArchived(teacherId: number, classId: number, archived: boolean): Promise<Result> {
  if (!(await getOwnedClass(teacherId, classId))) return { ok: false, error: "Kelas tidak ditemukan." };
  await db.update(classes).set({ archivedAt: archived ? new Date() : null }).where(eq(classes.id, classId));
  return { ok: true };
}

export async function regenerateClassCode(teacherId: number, classId: number): Promise<Result<{ joinCode: string }>> {
  if (!(await getOwnedClass(teacherId, classId))) return { ok: false, error: "Kelas tidak ditemukan." };
  const joinCode = await newUniqueClassCode();
  await db.update(classes).set({ joinCode }).where(eq(classes.id, classId));
  return { ok: true, joinCode };
}

export async function deleteClass(teacherId: number, classId: number): Promise<Result> {
  if (!(await getOwnedClass(teacherId, classId))) return { ok: false, error: "Kelas tidak ditemukan." };
  await db.delete(classes).where(eq(classes.id, classId));
  return { ok: true };
}

export async function removeMember(teacherId: number, classId: number, userId: number): Promise<Result> {
  if (!(await getOwnedClass(teacherId, classId))) return { ok: false, error: "Kelas tidak ditemukan." };
  await db.delete(classMembers).where(and(eq(classMembers.classId, classId), eq(classMembers.userId, userId)));
  return { ok: true };
}

/** Guru boleh melihat data siswa ini hanya bila siswa anggota kelas milik guru. */
export async function isMemberOfOwnedClass(teacherId: number, classId: number, userId: number) {
  const [row] = await db
    .select({ id: classMembers.id })
    .from(classMembers)
    .innerJoin(classes, eq(classes.id, classMembers.classId))
    .where(and(eq(classMembers.classId, classId), eq(classMembers.userId, userId), eq(classes.teacherId, teacherId)));
  return Boolean(row);
}

// ——— Gabung kelas (sisi siswa) ———

export async function findClassByCode(code: string) {
  const [row] = await db
    .select({ id: classes.id, name: classes.name, jenjang: classes.jenjang, teacherId: classes.teacherId, archivedAt: classes.archivedAt, teacherName: users.name })
    .from(classes)
    .innerJoin(users, eq(users.id, classes.teacherId))
    .where(eq(classes.joinCode, code));
  return row ?? null;
}

export async function joinClass(user: { id: number; jenjang: string | null }, code: string): Promise<Result<{ classId: number; name: string; already: boolean }>> {
  const cls = await findClassByCode(code);
  if (!cls) return { ok: false, error: "Kode kelas tidak ditemukan. Periksa lagi ke gurumu." };
  if (cls.archivedAt) return { ok: false, error: "Kelas ini sudah diarsipkan guru dan tidak menerima anggota baru." };
  if (cls.teacherId === user.id) return { ok: false, error: "Ini kelas milik Anda sendiri." };
  if (cls.jenjang !== user.jenjang) return { ok: false, error: `Kelas ini untuk jenjang ${cls.jenjang}, akunmu jenjang ${user.jenjang ?? "-"}.` };
  const [existing] = await db
    .select({ id: classMembers.id })
    .from(classMembers)
    .where(and(eq(classMembers.classId, cls.id), eq(classMembers.userId, user.id)));
  if (existing) return { ok: true, classId: cls.id, name: cls.name, already: true };
  const [{ n }] = await db.select({ n: count() }).from(classMembers).where(eq(classMembers.classId, cls.id));
  if (n >= MAX_MEMBERS_PER_CLASS) return { ok: false, error: "Kelas sudah penuh. Hubungi gurumu." };
  await db.insert(classMembers).values({ classId: cls.id, userId: user.id }).onDuplicateKeyUpdate({ set: { classId: cls.id } });
  return { ok: true, classId: cls.id, name: cls.name, already: false };
}

export async function leaveClass(userId: number, classId: number) {
  await db.delete(classMembers).where(and(eq(classMembers.classId, classId), eq(classMembers.userId, userId)));
}

// ——— Tugas ———

export async function createAssignment(teacherId: number, input: AssignmentInput): Promise<Result> {
  const cls = await getOwnedClass(teacherId, input.classId);
  if (!cls) return { ok: false, error: "Kelas tidak ditemukan." };
  const [pkg] = await db
    .select({ id: testPackages.id, status: testPackages.status, jenjang: categories.code })
    .from(testPackages)
    .innerJoin(categories, eq(categories.id, testPackages.categoryId))
    .where(eq(testPackages.id, input.testPackageId));
  if (!pkg || pkg.status !== "published") return { ok: false, error: "Paket tes tidak tersedia." };
  if (pkg.jenjang !== cls.jenjang) return { ok: false, error: `Pilih paket jenjang ${cls.jenjang}.` };
  await db.insert(classAssignments).values({
    classId: cls.id,
    testPackageId: pkg.id,
    note: input.note,
    startsAt: new Date(input.startsAt),
    dueAt: input.dueAt ? new Date(input.dueAt) : null,
  });
  return { ok: true };
}

export async function deleteAssignment(teacherId: number, assignmentId: number): Promise<Result> {
  const [row] = await db
    .select({ id: classAssignments.id })
    .from(classAssignments)
    .innerJoin(classes, eq(classes.id, classAssignments.classId))
    .where(and(eq(classAssignments.id, assignmentId), eq(classes.teacherId, teacherId)));
  if (!row) return { ok: false, error: "Tugas tidak ditemukan." };
  await db.delete(classAssignments).where(eq(classAssignments.id, assignmentId));
  return { ok: true };
}

export type PackageChoice = { id: number; title: string; subjectName: string | null; isPremium: boolean; questionCount: number; durationMinutes: number };

/** Paket tayang jenjang kelas untuk dipilih guru. */
export async function packageChoicesFor(jenjang: Jenjang): Promise<PackageChoice[]> {
  const rows = await db
    .select({
      id: testPackages.id,
      title: testPackages.title,
      subjectName: subjects.name,
      isPremium: testPackages.isPremium,
      durationMinutes: testPackages.durationMinutes,
      questionCount: sql<number>`(select count(*) from test_package_questions q where q.test_package_id = test_packages.id)`,
    })
    .from(testPackages)
    .innerJoin(categories, eq(categories.id, testPackages.categoryId))
    .leftJoin(subjects, eq(subjects.id, testPackages.subjectId))
    .where(and(eq(testPackages.status, "published"), eq(categories.code, jenjang)))
    .orderBy(asc(testPackages.isPremium), asc(subjects.name), desc(testPackages.id));
  return rows.map((r) => ({ ...r, subjectName: r.subjectName ?? null, questionCount: Number(r.questionCount) }));
}

type AssignmentBase = {
  id: number;
  testPackageId: number;
  title: string;
  subjectName: string | null;
  isPremium: boolean;
  note: string | null;
  startsAt: string;
  dueAt: string | null;
  phase: AssignmentPhase;
};

async function loadAssignments(classIds: number[]) {
  if (classIds.length === 0) return [];
  return db
    .select({
      id: classAssignments.id,
      classId: classAssignments.classId,
      testPackageId: classAssignments.testPackageId,
      note: classAssignments.note,
      startsAt: classAssignments.startsAt,
      dueAt: classAssignments.dueAt,
      title: testPackages.title,
      isPremium: testPackages.isPremium,
      subjectName: subjects.name,
      subjectId: testPackages.subjectId,
      jenjang: categories.code,
    })
    .from(classAssignments)
    .innerJoin(testPackages, eq(testPackages.id, classAssignments.testPackageId))
    .innerJoin(categories, eq(categories.id, testPackages.categoryId))
    .leftJoin(subjects, eq(subjects.id, testPackages.subjectId))
    .where(inArray(classAssignments.classId, classIds))
    .orderBy(desc(classAssignments.startsAt));
}

function toBase(a: Awaited<ReturnType<typeof loadAssignments>>[number], now: Date): AssignmentBase {
  return {
    id: a.id,
    testPackageId: a.testPackageId,
    title: a.title,
    subjectName: a.subjectName ?? null,
    isPremium: a.isPremium,
    note: a.note,
    startsAt: a.startsAt.toISOString(),
    dueAt: a.dueAt?.toISOString() ?? null,
    phase: assignmentPhase(now, a.startsAt, a.dueAt),
  };
}

type AttemptRow = {
  id: number;
  userId: number;
  testPackageId: number;
  startedAt: Date;
  submittedAt: Date | null;
  totalScore: number | null;
  maxScore: number | null;
  scoreScale: ScoreScale | null;
  scaledScore: string | null;
  jenjang: string;
  title: string;
};

async function submittedAttempts(userIds: number[], testPackageIds?: number[]): Promise<AttemptRow[]> {
  if (userIds.length === 0 || testPackageIds?.length === 0) return [];
  return db
    .select({
      id: attempts.id,
      userId: attempts.userId,
      testPackageId: attempts.testPackageId,
      startedAt: attempts.startedAt,
      submittedAt: attempts.submittedAt,
      totalScore: attempts.totalScore,
      maxScore: attempts.maxScore,
      scoreScale: attempts.scoreScale,
      scaledScore: attempts.scaledScore,
      jenjang: categories.code,
      title: testPackages.title,
    })
    .from(attempts)
    .innerJoin(testPackages, eq(testPackages.id, attempts.testPackageId))
    .innerJoin(categories, eq(categories.id, testPackages.categoryId))
    .where(and(inArray(attempts.userId, userIds), eq(attempts.status, "submitted"), testPackageIds ? inArray(attempts.testPackageId, testPackageIds) : undefined))
    .orderBy(asc(attempts.submittedAt));
}

const scoreOf = (a: AttemptRow): ScoreView => buildScoreView(a, null);

/** Attempt pertama yang memenuhi tugas (dimulai setelah dibuka, sebelum batas). */
function attemptForAssignment(rows: AttemptRow[], userId: number, a: { testPackageId: number; startsAt: Date; dueAt: Date | null }) {
  return rows.find((r) => r.userId === userId && r.testPackageId === a.testPackageId && attemptCountsForAssignment(r, a.startsAt, a.dueAt)) ?? null;
}

/** Siswa Premium untuk jenjang itu (batch, sama dengan billing.getActiveMembership). */
async function premiumUserIds(userIds: number[], jenjang: string): Promise<Set<number>> {
  if (userIds.length === 0) return new Set();
  const rows = await db
    .select({ userId: memberships.userId })
    .from(memberships)
    .where(
      and(
        inArray(memberships.userId, userIds),
        isNull(memberships.revokedAt),
        or(isNull(memberships.endsAt), gt(memberships.endsAt, new Date())),
        or(isNull(memberships.jenjang), sql`${memberships.jenjang} = ${jenjang}`),
      ),
    );
  return new Set(rows.map((r) => r.userId));
}

/**
 * Siswa tidak bisa membuka paket tugas ini: paket Premium & siswa bukan Premium, atau paket gratis
 * tetapi kuota 1 paket gratis per mapel sudah dipakai di paket lain (services/access.ts).
 */
function isLocked(a: { testPackageId: number; isPremium: boolean; subjectId: number | null }, premium: boolean, freeUsage: Map<number, number> | null) {
  if (premium) return false;
  if (a.isPremium) return true;
  const used = a.subjectId != null ? freeUsage?.get(a.subjectId) : undefined;
  return used != null && used !== a.testPackageId;
}

// ——— Halaman kelas guru ———

export type RosterRow = {
  userId: number;
  name: string;
  username: string | null;
  school: string | null;
  premium: boolean;
  joinedAt: string;
  testCount: number;
  practiceCount: number;
  average: { value: string; scale: ScoreView["scale"] } | null;
  last: ScoreView | null;
  lastActivity: string | null;
};

export type TeacherAssignment = AssignmentBase & {
  done: number;
  results: { userId: number; name: string; score: ScoreView | null; submittedAt: string | null; locked: boolean }[];
};

export async function getClassOverview(cls: { id: number; jenjang: Jenjang }) {
  const members = await db
    .select({ userId: users.id, name: users.name, username: users.username, school: users.schoolName, joinedAt: classMembers.joinedAt })
    .from(classMembers)
    .innerJoin(users, eq(users.id, classMembers.userId))
    .where(eq(classMembers.classId, cls.id))
    .orderBy(asc(users.name));
  const ids = members.map((m) => m.userId);
  const now = new Date();
  const [allAttempts, practice, premium, assignmentRows] = await Promise.all([
    submittedAttempts(ids),
    ids.length
      ? db
          .select({ userId: practiceSessions.userId, n: count(), last: max(practiceSessions.completedAt) })
          .from(practiceSessions)
          .where(and(inArray(practiceSessions.userId, ids), eq(practiceSessions.status, "completed")))
          .groupBy(practiceSessions.userId)
      : Promise.resolve([]),
    premiumUserIds(ids, cls.jenjang),
    loadAssignments([cls.id]),
  ]);
  const practiceBy = new Map(practice.map((p) => [p.userId, p]));
  const freeUsage = new Map(
    await Promise.all(ids.filter((uid) => !premium.has(uid)).map(async (uid) => [uid, await freeUsageBySubject(uid)] as const)),
  );

  const roster: RosterRow[] = members.map((m) => {
    const mine = allAttempts.filter((a) => a.userId === m.userId);
    const scores = mine.map(scoreOf);
    const avg = averageScore(scores);
    const p = practiceBy.get(m.userId);
    const lastTest = mine.at(-1)?.submittedAt ?? null;
    const lastPractice = p?.last ? new Date(p.last) : null;
    const lastActivity = [lastTest, lastPractice].filter((d): d is Date => d != null).sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
    return {
      userId: m.userId,
      name: m.name,
      username: m.username,
      school: m.school,
      premium: premium.has(m.userId),
      joinedAt: m.joinedAt.toISOString(),
      testCount: mine.length,
      practiceCount: Number(p?.n ?? 0),
      average: avg ? { value: avg.value, scale: avg.scale } : null,
      last: scores.at(-1) ?? null,
      lastActivity: lastActivity?.toISOString() ?? null,
    };
  });

  const assignments: TeacherAssignment[] = assignmentRows.map((a) => {
    const results = members.map((m) => {
      const hit = attemptForAssignment(allAttempts, m.userId, a);
      return {
        userId: m.userId,
        name: m.name,
        score: hit ? scoreOf(hit) : null,
        submittedAt: hit?.submittedAt?.toISOString() ?? null,
        locked: !hit && isLocked(a, premium.has(m.userId), freeUsage.get(m.userId) ?? null),
      };
    });
    return { ...toBase(a, now), done: results.filter((r) => r.score).length, results };
  });

  return { roster, assignments };
}

export type WeakSubtopic = {
  subtopicId: number;
  name: string;
  domain: string;
  subject: string;
  tested: number;
  weak: number;
  fair: number;
  strong: number;
  avgAccuracy: number;
};

/** Kelemahan kelas: diagnosa tiap siswa (tes + latihan) digabung per subdomain, terlemah dulu. */
export async function classWeakSubtopics(userIds: number[]): Promise<WeakSubtopic[]> {
  if (userIds.length === 0) return [];
  const perStudent = await Promise.all(userIds.map(async (id) => diagnose(await loadDiagnosisRecords(id))));
  const agg = new Map<number, { tested: number; counts: Record<DiagnosisStatus, number>; accSum: number }>();
  for (const list of perStudent) {
    for (const d of list) {
      if (d.status === "insufficient") continue;
      const cur = agg.get(d.subtopicId) ?? { tested: 0, counts: { insufficient: 0, perlu_latihan: 0, cukup: 0, kuat: 0 }, accSum: 0 };
      cur.tested++;
      cur.counts[d.status]++;
      cur.accSum += d.accuracy;
      agg.set(d.subtopicId, cur);
    }
  }
  if (agg.size === 0) return [];
  const names = await db
    .select({ id: subtopics.id, name: subtopics.name, domain: topics.name, subject: subjects.name })
    .from(subtopics)
    .innerJoin(topics, eq(topics.id, subtopics.topicId))
    .innerJoin(subjects, eq(subjects.id, topics.subjectId))
    .where(inArray(subtopics.id, [...agg.keys()]));
  return names
    .map((n) => {
      const a = agg.get(n.id)!;
      return {
        subtopicId: n.id,
        name: n.name,
        domain: n.domain,
        subject: n.subject,
        tested: a.tested,
        weak: a.counts.perlu_latihan,
        fair: a.counts.cukup,
        strong: a.counts.kuat,
        avgAccuracy: Math.round(a.accSum / a.tested),
      };
    })
    .sort((x, y) => x.avgAccuracy - y.avgAccuracy || y.weak - x.weak);
}

/** Riwayat tes siswa (baru → lama) untuk halaman detail guru. */
export async function studentTestHistory(userId: number, limit = 30) {
  const rows = await submittedAttempts([userId]);
  return rows
    .slice(-limit)
    .reverse()
    .map((r) => ({ id: r.id, title: r.title, submittedAt: r.submittedAt?.toISOString() ?? null, score: scoreOf(r) }));
}

// ——— Halaman Kelas Saya (siswa) ———

export type StudentAssignment = AssignmentBase & { score: ScoreView | null; submittedAt: string | null; locked: boolean };
export type StudentClass = { id: number; name: string; jenjang: Jenjang; teacherName: string; joinedAt: string; assignments: StudentAssignment[] };

export async function listStudentClasses(user: { id: number; jenjang: string | null }, premium: boolean): Promise<StudentClass[]> {
  const rows = await db
    .select({ id: classes.id, name: classes.name, jenjang: classes.jenjang, teacherName: users.name, joinedAt: classMembers.joinedAt })
    .from(classMembers)
    .innerJoin(classes, eq(classes.id, classMembers.classId))
    .innerJoin(users, eq(users.id, classes.teacherId))
    .where(eq(classMembers.userId, user.id))
    .orderBy(desc(classMembers.joinedAt));
  const assignmentRows = await loadAssignments(rows.map((r) => r.id));
  const [attemptsRows, freeUsage] = await Promise.all([
    submittedAttempts([user.id], [...new Set(assignmentRows.map((a) => a.testPackageId))]),
    premium ? Promise.resolve(null) : freeUsageBySubject(user.id),
  ]);
  const now = new Date();
  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    jenjang: c.jenjang,
    teacherName: c.teacherName,
    joinedAt: c.joinedAt.toISOString(),
    assignments: assignmentRows
      .filter((a) => a.classId === c.id)
      .map((a) => {
        const hit = attemptForAssignment(attemptsRows, user.id, a);
        return {
          ...toBase(a, now),
          score: hit ? scoreOf(hit) : null,
          submittedAt: hit?.submittedAt?.toISOString() ?? null,
          locked: !hit && isLocked(a, premium, freeUsage),
        };
      }),
  }));
}
