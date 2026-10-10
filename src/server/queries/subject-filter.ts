// Filter "Mata Pelajaran" di dashboard, latihan, progres, dan riwayat siswa.
// Pilihan = mapel jenjang siswa yang punya paket tayang atau pernah dikerjakan.
// Nilai aktif: ?mapel=<kode> di URL, atau pilihan terakhir (cookie `mapel`);
// "semua" = tanpa filter.

import { cookies } from "next/headers";
import { and, asc, eq, ne } from "drizzle-orm";
import { db } from "@/server/db";
import { attempts, categories, subjects, testPackages } from "@/server/db/schema";

export type SubjectOption = { id: number; code: string; name: string; jenjang: string };

export const SUBJECT_COOKIE = "mapel";

export async function listSubjectOptions(userId: number, jenjang: string | null): Promise<SubjectOption[]> {
  const cols = { id: subjects.id, code: subjects.code, name: subjects.name, jenjang: categories.code, catId: categories.id, order: subjects.order };
  const [published, attempted] = await Promise.all([
    db
      .selectDistinct(cols)
      .from(testPackages)
      .innerJoin(subjects, eq(subjects.id, testPackages.subjectId))
      .innerJoin(categories, eq(categories.id, subjects.categoryId))
      .where(and(eq(testPackages.status, "published"), jenjang ? eq(categories.code, jenjang) : undefined)),
    db
      .selectDistinct(cols)
      .from(attempts)
      .innerJoin(testPackages, eq(testPackages.id, attempts.testPackageId))
      .innerJoin(subjects, eq(subjects.id, testPackages.subjectId))
      .innerJoin(categories, eq(categories.id, subjects.categoryId))
      .where(and(eq(attempts.userId, userId), ne(attempts.status, "in_progress"), jenjang ? eq(categories.code, jenjang) : undefined))
      .orderBy(asc(categories.id)),
  ]);
  const byId = new Map([...published, ...attempted].map((s) => [s.id, s]));
  return [...byId.values()]
    .sort((a, b) => a.catId - b.catId || a.order - b.order)
    .map(({ id, code, name, jenjang: j }) => ({ id, code, name, jenjang: j }));
}

/** Mapel aktif dari ?mapel= atau cookie; null = Semua. */
export async function selectedSubject(param: string | string[] | undefined, options: SubjectOption[]): Promise<SubjectOption | null> {
  const raw = typeof param === "string" ? param : (await cookies()).get(SUBJECT_COOKIE)?.value;
  if (!raw || raw === "semua") return null;
  return options.find((o) => o.code === raw) ?? null;
}
