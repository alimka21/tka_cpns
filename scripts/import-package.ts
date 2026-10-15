// Impor satu paket tes (soal + stimulus + paket draf) dari file data TS.
//
// Validasi sama dengan impor Excel admin (format baris, kerangka asesmen,
// tautan stimulus) + aturan paket (docs/ATURAN_PAKET.md). Tanpa --commit
// hanya laporan (dry run). Paket disimpan `draft`, soal `pending_review`,
// stimulus `draft` — admin meninjau lalu menerbitkan dari panel.
//
//   npx tsx --env-file=.env scripts/import-package.ts <data.ts>            # cek, DB lokal
//   npx tsx --env-file=.env.prod scripts/import-package.ts <data.ts> --commit
//
// File data: `export default { title, description, jenjang, subjectCode,
// durationMinutes, isPremium, createdBy, stimuli: [{ code, title, content }],
// rows: RawImportRow[] }` — kolom `rows` = kolom template impor Excel; soal
// grup ditulis berurutan (urutan baris = urutan di grup & di paket).

import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { and, eq, inArray } from "drizzle-orm";
import { checkPackageRules, ruleErrors } from "@/lib/package-rules";
import { validateImportRows, type RawImportRow } from "@/lib/validation/import";
import { questionInput } from "@/lib/validation/question";
import { db } from "@/server/db";
import { categories, stimuli, subjects, testPackageQuestions, testPackages } from "@/server/db/schema";
import { loadSubjectOutlines } from "@/server/queries/packages";
import { checkAgainstFramework, linkStimuli } from "@/server/services/question-import";
import { insertQuestion, subtopicIdsByCode } from "@/server/services/question-store";

type PackageData = {
  title: string;
  description: string;
  jenjang: "SD" | "SMP" | "SMA";
  subjectCode: string;
  durationMinutes: number;
  isPremium: boolean;
  /** Id admin pembuat (questions.created_by, test_packages.created_by). */
  createdBy: number;
  stimuli: { code: string; title: string; content: string; imageUrl?: string }[];
  rows: RawImportRow[];
};

function fail(title: string, lines: string[]): never {
  console.error(`\n✗ ${title}`);
  for (const l of lines) console.error(`  - ${l}`);
  process.exit(1);
}

async function main() {
  const [file, ...flags] = process.argv.slice(2);
  if (!file) fail("Pemakaian", ["npx tsx --env-file=.env scripts/import-package.ts <data.ts> [--commit]"]);
  const commit = flags.includes("--commit");
  const data = (await import(pathToFileURL(resolve(file)).href)).default as PackageData;

  // 1. Format baris + kerangka asesmen + tautan stimulus (sama dengan impor Excel).
  const checked = validateImportRows(data.rows.map((d, i) => ({ rowNumber: i + 1, data: d })));
  if (checked.errors.length) fail("Baris tidak valid", checked.errors.map((e) => `soal ${e.rowNumber}: ${e.messages.join("; ")}`));
  const framework = checkAgainstFramework(checked.valid);
  if (framework.errors.length) fail("Tidak cocok kerangka", framework.errors.map((e) => `soal ${e.rowNumber}: ${e.messages.join("; ")}`));
  const linked = linkStimuli(
    framework.valid,
    data.stimuli.map((s, i) => ({ rowNumber: i + 1, code: s.code.toUpperCase(), title: s.title, content: s.content, imageUrl: s.imageUrl ?? null })),
  );
  if (linked.errors.length) fail("Stimulus", linked.errors.map((e) => `${e.sheet ?? "soal"} ${e.rowNumber}: ${e.messages.join("; ")}`));
  const wrongSubject = linked.valid.filter((r) => !r.subdomainCode.startsWith(`${data.subjectCode}-`));
  if (wrongSubject.length) fail("Mapel berbeda", wrongSubject.map((r) => `soal ${r.rowNumber}: ${r.subdomainCode}`));

  // 2. Aturan paket terhadap kerangka di DB.
  const [cat] = await db.select({ id: categories.id }).from(categories).where(eq(categories.code, data.jenjang));
  const [subject] = await db
    .select({ id: subjects.id, code: subjects.code, type: subjects.type })
    .from(subjects)
    .where(and(eq(subjects.code, data.subjectCode), eq(subjects.categoryId, cat?.id ?? -1)));
  if (!cat || !subject) fail("Jenjang/mapel", [`${data.jenjang} / ${data.subjectCode} tidak ada di database`]);
  const outline = (await loadSubjectOutlines([subject.id])).get(subject.id) ?? [];
  const report = checkPackageRules({
    jenjang: data.jenjang,
    subject: { code: subject.code, type: subject.type },
    durationMinutes: data.durationMinutes,
    outline,
    questions: linked.valid.map((r) => ({
      type: r.type,
      subjectCode: data.subjectCode,
      subtopicCode: r.subdomainCode,
      stimulusKey: r.stimulusCode,
      hasImage: false,
      difficulty: r.difficulty,
      cognitiveLevel: r.cognitiveLevel,
    })),
  });
  const s = report.stats;
  const count = (k: string) => linked.valid.filter((r) => r.difficulty === k).length;
  const level = (k: string) => linked.valid.filter((r) => r.cognitiveLevel === k).length;
  console.log(`\n${data.title}`);
  console.log(`  ${s.total} soal · PG ${s.pg} · MCMA ${s.mcma} · Kategori ${s.kategori} · berbasis stimulus ${s.stimulusBased} · ${linked.stimuli.length} stimulus`);
  console.log(`  mudah ${count("easy")} · sedang ${count("medium")} · sulit ${count("hard")}` + (level("L1") + level("L2") + level("L3") ? ` · L1 ${level("L1")} · L2 ${level("L2")} · L3 ${level("L3")}` : ""));
  for (const c of [...report.required, ...report.recommended]) console.log(`  ${c.ok ? "✓" : report.required.includes(c) ? "✗" : "!"} ${c.label} — ${c.detail}`);
  if (report.missingSubtopics.length) console.log(`  subtopik kosong: ${report.missingSubtopics.join(", ")}`);
  const blocking = ruleErrors(report);
  if (blocking.length) fail("Aturan wajib belum terpenuhi", blocking);

  // 3. Tidak menimpa data yang sudah ada.
  const codes = linked.stimuli.map((st) => st.code);
  const takenCodes = codes.length ? await db.select({ code: stimuli.code }).from(stimuli).where(inArray(stimuli.code, codes)) : [];
  if (takenCodes.length) fail("Kode stimulus sudah dipakai", takenCodes.map((t) => t.code));
  const [sameTitle] = await db.select({ id: testPackages.id }).from(testPackages).where(eq(testPackages.title, data.title));
  if (sameTitle) fail("Judul paket sudah ada", [`#${sameTitle.id} ${data.title}`]);

  if (!commit) {
    console.log("\nDry run OK — jalankan ulang dengan --commit untuk menyimpan.");
    process.exit(0);
  }

  // 4. Simpan semuanya dalam satu transaksi.
  const result = await db.transaction(async (tx) => {
    const subtopicIds = await subtopicIdsByCode(tx, [...new Set(linked.valid.map((r) => r.subdomainCode))]);
    const stimulusIds = new Map<string, number>();
    for (const st of linked.stimuli) {
      const [{ id }] = await tx
        .insert(stimuli)
        .values({ code: st.code, title: st.title, content: st.content, imageUrl: st.imageUrl, createdBy: data.createdBy })
        .$returningId();
      stimulusIds.set(st.code, id);
    }
    const questionIds: number[] = [];
    for (const row of linked.valid) {
      const subtopicId = subtopicIds.get(row.subdomainCode);
      if (!subtopicId) throw new Error(`Subdomain ${row.subdomainCode} belum ada di database`);
      const question = questionInput.parse({
        type: row.type,
        subtopicId,
        questionText: row.questionText,
        difficulty: row.difficulty,
        cognitiveLevel: row.cognitiveLevel,
        explanationText: row.explanationText,
        categoryLabels: row.categoryLabels ?? undefined,
        stimulusId: row.stimulusCode ? stimulusIds.get(row.stimulusCode) : null,
        stimulusOrder: row.stimulusOrder,
        status: "pending_review",
        options: row.options,
      });
      questionIds.push(await insertQuestion(tx, question, { generatedBy: "manual", userId: data.createdBy }));
    }
    const [{ id: packageId }] = await tx
      .insert(testPackages)
      .values({
        title: data.title,
        description: data.description,
        categoryId: cat.id,
        subjectId: subject.id,
        durationMinutes: data.durationMinutes,
        isPremium: data.isPremium,
        status: "draft",
        createdBy: data.createdBy,
      })
      .$returningId();
    await tx.insert(testPackageQuestions).values(questionIds.map((questionId, i) => ({ testPackageId: packageId, questionId, order: i + 1 })));
    return { packageId, questionIds, stimulusIds: [...stimulusIds.values()] };
  });
  const q = result.questionIds;
  console.log(`\n✓ Paket #${result.packageId} (draf) · soal #${q[0]}–#${q[q.length - 1]} · stimulus #${result.stimulusIds.join(", #")}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
