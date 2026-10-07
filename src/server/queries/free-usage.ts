// Kuota akun gratis: 1 paket gratis per mata pelajaran (lihat services/access.ts).
// Modul terpisah tanpa ketergantungan ke queries/packages supaya tidak melingkar.

import { and, asc, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { attempts, testPackages } from "@/server/db/schema";

/**
 * Paket gratis pertama yang pernah dicoba user per mata pelajaran
 * (subjectId → testPackageId). Paket lama tanpa mapel tidak dihitung.
 */
export async function freeUsageBySubject(userId: number): Promise<Map<number, number>> {
  const rows = await db
    .select({ subjectId: testPackages.subjectId, packageId: attempts.testPackageId })
    .from(attempts)
    .innerJoin(testPackages, eq(testPackages.id, attempts.testPackageId))
    .where(and(eq(attempts.userId, userId), eq(testPackages.isPremium, false)))
    .orderBy(asc(attempts.startedAt), asc(attempts.id));
  const used = new Map<number, number>();
  for (const r of rows) if (r.subjectId != null && !used.has(r.subjectId)) used.set(r.subjectId, r.packageId);
  return used;
}
