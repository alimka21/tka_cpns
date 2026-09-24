// Seed hierarki konten dari kerangka asesmen: `npm run db:seed:asesmen`.
// Idempoten — upsert berdasarkan `code`, aman dijalankan ulang setelah file
// kerangka diperbarui. Kode yang sudah tidak ada di kerangka TIDAK dihapus
// (mungkin masih dipakai soal); script hanya melaporkannya.

import { inArray, notInArray, sql } from "drizzle-orm";
import type { AnyMySqlColumn } from "drizzle-orm/mysql-core";
import { FRAMEWORKS } from "@/server/asesmen";
import { buildSeedPlan } from "@/server/asesmen/seed-plan";
import { db } from "./index";
import { categories, subjects, subtopics, topics } from "./schema";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Harus lewat `tx` yang sama: koneksi lain di pool belum melihat baris yang
// baru di-insert di dalam transaksi ini.
async function idsByCode(tx: Tx, table: typeof categories | typeof subjects | typeof topics, codes: string[]) {
  const rows = await tx.select({ id: table.id, code: table.code }).from(table).where(inArray(table.code, codes));
  return new Map(rows.map((r) => [r.code, r.id]));
}

/** `VALUES(kolom)` untuk ON DUPLICATE KEY UPDATE — nama kolom tanpa prefix tabel. */
function fromInsert(column: AnyMySqlColumn) {
  return sql`values(${sql.identifier(column.name)})`;
}

function mustGet(map: Map<string, number>, code: string) {
  const id = map.get(code);
  if (id == null) throw new Error(`Induk dengan kode ${code} tidak ditemukan setelah upsert`);
  return id;
}

async function main() {
  const plan = buildSeedPlan(Object.values(FRAMEWORKS));

  await db.transaction(async (tx) => {
    await tx
      .insert(categories)
      .values(plan.categories)
      .onDuplicateKeyUpdate({ set: { name: fromInsert(categories.name) } });
    const categoryIds = await idsByCode(tx, categories, plan.categories.map((c) => c.code));

    await tx
      .insert(subjects)
      .values(plan.subjects.map(({ categoryCode, ...s }) => ({ ...s, categoryId: mustGet(categoryIds, categoryCode) })))
      .onDuplicateKeyUpdate({
        set: {
          categoryId: fromInsert(subjects.categoryId),
          name: fromInsert(subjects.name),
          fullName: fromInsert(subjects.fullName),
          type: fromInsert(subjects.type),
          structure: fromInsert(subjects.structure),
          order: fromInsert(subjects.order),
        },
      });
    const subjectIds = await idsByCode(tx, subjects, plan.subjects.map((s) => s.code));

    await tx
      .insert(topics)
      .values(plan.topics.map(({ subjectCode, ...t }) => ({ ...t, subjectId: mustGet(subjectIds, subjectCode) })))
      .onDuplicateKeyUpdate({
        set: {
          subjectId: fromInsert(topics.subjectId),
          name: fromInsert(topics.name),
          description: fromInsert(topics.description),
          order: fromInsert(topics.order),
        },
      });
    const topicIds = await idsByCode(tx, topics, plan.topics.map((t) => t.code));

    await tx
      .insert(subtopics)
      .values(plan.subtopics.map(({ topicCode, ...s }) => ({ ...s, topicId: mustGet(topicIds, topicCode) })))
      .onDuplicateKeyUpdate({
        set: {
          topicId: fromInsert(subtopics.topicId),
          name: fromInsert(subtopics.name),
          order: fromInsert(subtopics.order),
        },
      });
  });

  const stale = await db
    .select({ code: subtopics.code })
    .from(subtopics)
    .where(notInArray(subtopics.code, plan.subtopics.map((s) => s.code)));

  console.log(
    `Seed selesai: ${plan.categories.length} jenjang, ${plan.subjects.length} mata uji, ` +
      `${plan.topics.length} domain, ${plan.subtopics.length} subdomain.`,
  );
  if (stale.length > 0) {
    console.warn(`Peringatan: ${stale.length} subdomain di DB tidak ada lagi di kerangka: ${stale.map((s) => s.code).join(", ")}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
