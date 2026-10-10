// Data halaman /progres & kartu prioritas di dashboard: diagnosa per
// subdomain (service `diagnose`, dari tes resmi + latihan) dipetakan ke
// hierarki mata uji → domain →
// subdomain. Subdomain yang belum pernah diujikan ikut tampil ("Belum diuji")
// untuk mata uji yang sudah pernah dikerjakan siswa.

import { and, asc, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/server/db";
import { attempts, categories, subjects, subtopics, testPackages, topics } from "@/server/db/schema";
import { loadDiagnosisRecords, subtopicIdsOfSubject } from "./practice";
import { diagnose, practicePriorities, type SubtopicDiagnosis } from "@/server/services/diagnosis";
import type { SubtopicTrendOption } from "@/components/analytics/subtopic-trend";

export type ProgressSubdomain = {
  id: number;
  code: string;
  name: string;
  /** null = belum diuji. */
  diagnosis: SubtopicDiagnosis | null;
};

export type ProgressSubject = {
  id: number;
  jenjang: string;
  name: string;
  domains: { id: number; name: string; subdomains: ProgressSubdomain[] }[];
  tested: number;
  total: number;
};

export type PrioritySubdomain = {
  subtopicId: number;
  name: string;
  domain: string;
  subject: string;
  jenjang: string;
  diagnosis: SubtopicDiagnosis;
};

export type StudentProgress = {
  subjects: ProgressSubject[];
  priorities: PrioritySubdomain[];
  strongest: PrioritySubdomain | null;
  /** Skor per tes (0–100), lama → baru, maks 20 terakhir. */
  scoreTrend: { label: string; score: number; title: string }[];
  testCount: number;
  /** Sesi latihan yang punya minimal 1 soal terjawab. */
  practiceCount: number;
  /** Subdomain dengan ≥ 2 tes/latihan — bahan grafik "Tren per subdomain". */
  trends: SubtopicTrendOption[];
  /** Subdomain yang dipilih pertama di grafik (prioritas #1 bila punya tren). */
  trendInitialId: number | null;
};

const trendLabel = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "Asia/Jakarta" });

/** `subjectId` terisi = hanya data mata uji itu (filter mapel di dashboard/progres/latihan). */
export async function getStudentProgress(userId: number, subjectId: number | null = null): Promise<StudentProgress> {
  const finished = and(eq(attempts.userId, userId), ne(attempts.status, "in_progress"), subjectId ? eq(testPackages.subjectId, subjectId) : undefined);

  const [allRecords, attemptRows, subjectSubtopics] = await Promise.all([
    loadDiagnosisRecords(userId),
    db
      .select({
        submittedAt: attempts.submittedAt,
        startedAt: attempts.startedAt,
        totalScore: attempts.totalScore,
        maxScore: attempts.maxScore,
        title: testPackages.title,
      })
      .from(attempts)
      .innerJoin(testPackages, eq(testPackages.id, attempts.testPackageId))
      .where(finished)
      .orderBy(asc(attempts.startedAt)),
    subjectId ? subtopicIdsOfSubject(subjectId) : Promise.resolve(null),
  ]);
  const inSubject = subjectSubtopics ? new Set(subjectSubtopics) : null;
  const records = inSubject ? allRecords.filter((r) => inSubject.has(r.subtopicId)) : allRecords;

  const diagnoses = diagnose(records);
  const practiceCount = new Set(records.filter((r) => r.source === "practice").map((r) => r.sourceId)).size;
  const byId = new Map(diagnoses.map((d) => [d.subtopicId, d]));

  const scoreTrend = attemptRows
    .filter((a) => a.maxScore)
    .slice(-20)
    .map((a) => ({
      label: trendLabel.format(a.submittedAt ?? a.startedAt),
      score: Math.round(((a.totalScore ?? 0) / a.maxScore!) * 100),
      title: a.title,
    }));

  if (diagnoses.length === 0) {
    return { subjects: [], priorities: [], strongest: null, scoreTrend, testCount: attemptRows.length, practiceCount, trends: [], trendInitialId: null };
  }

  // Mata uji yang pernah diujikan → semua subdomainnya (termasuk yang belum diuji).
  const testedSubjects = await db
    .selectDistinct({ id: subjects.id })
    .from(subtopics)
    .innerJoin(topics, eq(topics.id, subtopics.topicId))
    .innerJoin(subjects, eq(subjects.id, topics.subjectId))
    .where(inArray(subtopics.id, [...byId.keys()]));
  const rows = await db
    .select({
      subjectId: subjects.id,
      subject: subjects.name,
      jenjang: categories.code,
      domainId: topics.id,
      domain: topics.name,
      id: subtopics.id,
      code: subtopics.code,
      name: subtopics.name,
    })
    .from(subtopics)
    .innerJoin(topics, eq(topics.id, subtopics.topicId))
    .innerJoin(subjects, eq(subjects.id, topics.subjectId))
    .innerJoin(categories, eq(categories.id, subjects.categoryId))
    .where(inArray(subjects.id, testedSubjects.map((s) => s.id)))
    .orderBy(asc(categories.id), asc(subjects.order), asc(topics.order), asc(subtopics.order));

  const subjectMap = new Map<number, ProgressSubject>();
  const info = new Map<number, Omit<PrioritySubdomain, "diagnosis">>();
  for (const r of rows) {
    let subject = subjectMap.get(r.subjectId);
    if (!subject) {
      subject = { id: r.subjectId, jenjang: r.jenjang, name: r.subject, domains: [], tested: 0, total: 0 };
      subjectMap.set(r.subjectId, subject);
    }
    let domain = subject.domains.find((d) => d.id === r.domainId);
    if (!domain) {
      domain = { id: r.domainId, name: r.domain, subdomains: [] };
      subject.domains.push(domain);
    }
    const diagnosis = byId.get(r.id) ?? null;
    domain.subdomains.push({ id: r.id, code: r.code, name: r.name, diagnosis });
    subject.total += 1;
    if (diagnosis) subject.tested += 1;
    info.set(r.id, { subtopicId: r.id, name: r.name, domain: r.domain, subject: r.subject, jenjang: r.jenjang });
  }

  const withInfo = (d: SubtopicDiagnosis): PrioritySubdomain | null => {
    const i = info.get(d.subtopicId);
    return i ? { ...i, diagnosis: d } : null;
  };
  const strongestDiag = diagnoses
    .filter((d) => d.status === "baik")
    .sort((a, b) => b.accuracy - a.accuracy || b.totalQuestions - a.totalQuestions)[0];

  const subjectsList = [...subjectMap.values()];
  const trends: SubtopicTrendOption[] = subjectsList.flatMap((sub) =>
    sub.domains.flatMap((dom) =>
      dom.subdomains
        .filter((s) => (s.diagnosis?.history.length ?? 0) >= 2)
        .map((s) => ({
          id: s.id,
          name: s.name,
          group: `${sub.jenjang} · ${sub.name} — ${dom.name}`,
          points: s.diagnosis!.history.map((h) => ({
            label: trendLabel.format(h.at),
            percentage: h.percentage,
            rolling: h.rolling,
            questions: h.questions,
            source: h.source,
          })),
        })),
    ),
  );
  const priorities = practicePriorities(diagnoses).map(withInfo).filter((p): p is PrioritySubdomain => p != null);
  const trendIds = new Set(trends.map((t) => t.id));
  const trendInitialId = priorities.find((p) => trendIds.has(p.subtopicId))?.subtopicId ?? trends[0]?.id ?? null;

  return {
    subjects: subjectsList,
    priorities,
    trends,
    trendInitialId,
    strongest: strongestDiag ? withInfo(strongestDiag) : null,
    scoreTrend,
    testCount: attemptRows.length,
    practiceCount,
  };
}
