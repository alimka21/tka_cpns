// Isi nilai skala attempt yang sudah dinilai (migrasi 0021, docs/PENSKORAN-DAN-PELAPORAN-TKA.md).
// Idempoten: hanya attempt selesai yang `scaled_score`-nya masih NULL — nilai
// yang sudah dibekukan tidak pernah diubah. Skor mentah tidak disentuh.
//
//   npm run db:rescore          # DB lokal (.env)
//   npm run prod:db:rescore     # produksi (.env.prod)

import { and, eq, inArray, isNotNull, isNull } from "drizzle-orm";
import { db } from "@/server/db";
import { attempts, categories, testPackages } from "@/server/db/schema";
import { scaledScorer } from "@/server/services/scaled-result";

async function main() {
  const rows = await db
    .select({ id: attempts.id, totalScore: attempts.totalScore, maxScore: attempts.maxScore, jenjang: categories.code })
    .from(attempts)
    .innerJoin(testPackages, eq(testPackages.id, attempts.testPackageId))
    .innerJoin(categories, eq(categories.id, testPackages.categoryId))
    .where(and(inArray(attempts.status, ["submitted", "expired"]), isNotNull(attempts.totalScore), isNotNull(attempts.maxScore), isNull(attempts.scaledScore)));

  const score = await scaledScorer();
  const perScale = new Map<string, number>();
  for (const row of rows) {
    const result = score(row.jenjang, row.totalScore!, row.maxScore!);
    await db.update(attempts).set(result).where(and(eq(attempts.id, row.id), isNull(attempts.scaledScore)));
    perScale.set(result.scoreScale, (perScale.get(result.scoreScale) ?? 0) + 1);
  }
  const pending = await db.$count(attempts, and(inArray(attempts.status, ["submitted", "expired"]), isNull(attempts.scaledScore)));
  console.log(`Nilai skala dihitung ulang: ${rows.length} attempt` + (rows.length ? ` (${[...perScale].map(([s, n]) => `${s}: ${n}`).join(", ")})` : ""));
  console.log(`Attempt selesai yang masih tanpa nilai skala: ${pending}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
