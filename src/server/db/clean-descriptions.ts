// Bersihkan deskripsi paket tes dari catatan internal (nama AI, "tinjau sebelum terbit").
// Default: pratinjau saja. Tulis ke database dengan `-- --apply`.
//   npm run db:clean-descriptions            (lokal, pratinjau)
//   npm run prod:db:clean-descriptions -- --apply

import { count, eq } from "drizzle-orm";
import { cleanPackageDescription, needsDescriptionCleanup } from "@/lib/package-description";
import { db } from "./index";
import { testPackageQuestions, testPackages } from "./schema";

async function main() {
  const apply = process.argv.includes("--apply");
  const rows = await db.select({ id: testPackages.id, title: testPackages.title, description: testPackages.description }).from(testPackages);
  const targets = rows.filter((r) => needsDescriptionCleanup(r.description));
  for (const r of targets) {
    const [{ n }] = await db.select({ n: count() }).from(testPackageQuestions).where(eq(testPackageQuestions.testPackageId, r.id));
    const next = cleanPackageDescription(r.description!, Number(n));
    console.log(`#${r.id} ${r.title}\n  - ${r.description}\n  + ${next}\n`);
    if (apply) await db.update(testPackages).set({ description: next }).where(eq(testPackages.id, r.id));
  }
  console.log(`${targets.length} paket ${apply ? "diperbarui" : "akan diperbarui (pratinjau — tambahkan --apply untuk menyimpan)"}.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
