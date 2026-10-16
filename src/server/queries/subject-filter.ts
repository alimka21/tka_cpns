// Filter "Mata Pelajaran" di dashboard, latihan, progres, dan riwayat siswa.
// Pilihan = mapel jenjang siswa yang punya paket tayang atau pernah dikerjakan.
// Nilai aktif: ?mapel=<kode> di URL, atau pilihan terakhir (cookie `mapel`);
// "semua" = tanpa filter.

import { cookies } from "next/headers";
import { and, count, eq, ne } from "drizzle-orm";
import { db } from "@/server/db";
import { attempts, categories, subjects, testPackages } from "@/server/db/schema";

export type SubjectOption = {
  id: number;
  code: string;
  name: string;
  jenjang: string;
  /** Paket tes tayang untuk mapel ini. */
  packageCount: number;
  /** Tes selesai milik siswa di mapel ini. */
  doneCount: number;
};

export const SUBJECT_COOKIE = "mapel";

export async function listSubjectOptions(userId: number, jenjang: string | null): Promise<SubjectOption[]> {
  const cols = { id: subjects.id, code: subjects.code, name: subjects.name, jenjang: categories.code, catId: categories.id, order: subjects.order, n: count() };
  const group = [subjects.id, subjects.code, subjects.name, categories.code, categories.id, subjects.order] as const;
  const [published, attempted] = await Promise.all([
    db
      .select(cols)
      .from(testPackages)
      .innerJoin(subjects, eq(subjects.id, testPackages.subjectId))
      .innerJoin(categories, eq(categories.id, subjects.categoryId))
      .where(and(eq(testPackages.status, "published"), jenjang ? eq(categories.code, jenjang) : undefined))
      .groupBy(...group),
    db
      .select(cols)
      .from(attempts)
      .innerJoin(testPackages, eq(testPackages.id, attempts.testPackageId))
      .innerJoin(subjects, eq(subjects.id, testPackages.subjectId))
      .innerJoin(categories, eq(categories.id, subjects.categoryId))
      .where(and(eq(attempts.userId, userId), ne(attempts.status, "in_progress"), jenjang ? eq(categories.code, jenjang) : undefined))
      .groupBy(...group),
  ]);
  const byId = new Map<number, (typeof published)[number] & { packageCount: number; doneCount: number }>();
  for (const s of published) byId.set(s.id, { ...s, packageCount: Number(s.n), doneCount: 0 });
  for (const s of attempted) {
    const row = byId.get(s.id) ?? { ...s, packageCount: 0, doneCount: 0 };
    row.doneCount = Number(s.n);
    byId.set(s.id, row);
  }
  return [...byId.values()]
    .sort((a, b) => a.catId - b.catId || a.order - b.order)
    .map(({ id, code, name, jenjang: j, packageCount, doneCount }) => ({ id, code, name, jenjang: j, packageCount, doneCount }));
}

/** Mapel aktif dari ?mapel= atau cookie; null = Semua. */
export async function selectedSubject(param: string | string[] | undefined, options: SubjectOption[]): Promise<SubjectOption | null> {
  const raw = typeof param === "string" ? param : (await cookies()).get(SUBJECT_COOKIE)?.value;
  if (!raw || raw === "semua") return null;
  return options.find((o) => o.code === raw) ?? null;
}
