// "Buat paket otomatis" (admin): pratinjau rencana dari bank → AI menambal
// kekurangan per batch (dijalankan client satu per satu, tiap batch satu
// panggilan Gemini) → paket draf disusun & divalidasi ulang di server.

import { and, eq, inArray, isNull, notInArray } from "drizzle-orm";
import { packageRuleFor } from "@/lib/package-rules";
import type { Difficulty, QuestionType } from "@/lib/validation/enums";
import type { VariationStyle } from "@/server/asesmen/generation-context";
import { findSubdomain } from "@/server/asesmen";
import { db } from "@/server/db";
import { categories, questions, subjects, subtopics, testPackageQuestions, testPackages, topics } from "@/server/db/schema";
import { loadSubjectOutlines } from "@/server/queries/packages";
import { getGeminiKey } from "@/server/services/ai-key";
import { generateAiQuestions } from "@/server/services/ai-generate";
import { batchAiSlots, planAutoPackage, TIER_DIFFICULTY, type PlanQuestion, type Tier } from "@/server/services/auto-package-plan";
import { validatePackageOrder } from "@/server/services/package-composition";

/** Status soal bank yang boleh diambil (keputusan pemilik produk 2026-10-02). */
const USABLE_STATUSES = ["published", "pending_review"] as const;

export type AutoBatch = {
  subtopicCode: string;
  subtopicName: string;
  topicName: string;
  type: QuestionType;
  count: number;
  /** 1 = mudah/L1, 2 = sedang/L2, 3 = sulit/L3. */
  tier: Tier;
  /** null = soal baru (subtopik belum punya soal tunggal untuk dimodifikasi). */
  sourceQuestionId: number | null;
  sourceSnippet: string | null;
};

export type AutoPackagePreview =
  | {
      ok: true;
      subjectName: string;
      jenjang: string;
      questionCount: number;
      durationMinutes: number;
      /** Soal bank belum terpakai yang tersedia untuk mapel ini. */
      availableCount: number;
      bankIds: number[];
      bankPg: number;
      batches: AutoBatch[];
      hasGeminiKey: boolean;
      /** Mata uji memakai level kognitif (L1–L3); bahasa tidak. */
      levelled: boolean;
      /** Sebaran tingkat 1/2/3 seluruh paket setelah AI (bank + AI). */
      tiers: Record<Tier, number>;
    }
  | { ok: false; error: string };

async function loadSubjectContext(categoryId: number, subjectId: number) {
  const [row] = await db
    .select({ jenjang: categories.code, code: subjects.code, name: subjects.name, type: subjects.type })
    .from(subjects)
    .innerJoin(categories, eq(categories.id, subjects.categoryId))
    .where(and(eq(subjects.id, subjectId), eq(categories.id, categoryId)));
  if (!row) return null;
  const rule = packageRuleFor(row.jenjang, { code: row.code, type: row.type });
  const outline = (await loadSubjectOutlines([subjectId])).get(subjectId) ?? [];
  const firstSub = outline[0]?.subtopics[0]?.code;
  const levelled = firstSub ? (findSubdomain(firstSub)?.subject.cognitiveLevels.length ?? 0) > 0 : false;
  return { ...row, rule, outline, levelled };
}

/** Soal mapel ini (status tayang/menunggu tinjauan) yang belum masuk paket mana pun. */
async function loadAvailable(subjectId: number, onlyIds?: number[]) {
  const used = db.select({ id: testPackageQuestions.questionId }).from(testPackageQuestions);
  const rows = await db
    .select({
      id: questions.id,
      type: questions.type,
      stimulusId: questions.stimulusId,
      stimulusOrder: questions.stimulusOrder,
      subtopicCode: subtopics.code,
      difficulty: questions.difficulty,
      cognitiveLevel: questions.cognitiveLevel,
    })
    .from(questions)
    .innerJoin(subtopics, eq(subtopics.id, questions.subtopicId))
    .innerJoin(topics, eq(topics.id, subtopics.topicId))
    .where(
      and(
        eq(topics.subjectId, subjectId),
        inArray(questions.status, [...USABLE_STATUSES]),
        notInArray(questions.id, used),
        onlyIds ? inArray(questions.id, onlyIds.length ? onlyIds : [0]) : undefined,
      ),
    );
  // Grup hanya dipakai bila SEMUA soal stimulusnya tersedia (grup tidak boleh terpotong).
  const stimulusIds = [...new Set(rows.map((r) => r.stimulusId).filter((s): s is number => s != null))];
  const groupSizes = new Map<number, number>();
  if (stimulusIds.length) {
    const all = await db.select({ stimulusId: questions.stimulusId }).from(questions).where(inArray(questions.stimulusId, stimulusIds));
    for (const r of all) groupSizes.set(r.stimulusId!, (groupSizes.get(r.stimulusId!) ?? 0) + 1);
  }
  const availableSizes = new Map<number, number>();
  for (const r of rows) if (r.stimulusId != null) availableSizes.set(r.stimulusId, (availableSizes.get(r.stimulusId) ?? 0) + 1);
  return rows.filter((r) => r.stimulusId == null || availableSizes.get(r.stimulusId) === groupSizes.get(r.stimulusId)) as PlanQuestion[];
}

/**
 * Soal asal untuk variasi: soal tunggal TANPA gambar di subtopik itu (AI tidak
 * melihat gambar/bacaan soal asal), bentuk sama diutamakan, acak supaya beragam.
 */
async function pickSources(subtopicCodes: string[]) {
  if (!subtopicCodes.length) return new Map<string, { id: number; type: QuestionType; text: string }[]>();
  const rows = await db
    .select({ id: questions.id, type: questions.type, text: questions.questionText, subtopicCode: subtopics.code })
    .from(questions)
    .innerJoin(subtopics, eq(subtopics.id, questions.subtopicId))
    .where(
      and(inArray(subtopics.code, subtopicCodes), isNull(questions.stimulusId), isNull(questions.imageUrl), inArray(questions.status, [...USABLE_STATUSES])),
    );
  const map = new Map<string, { id: number; type: QuestionType; text: string }[]>();
  for (const r of rows) map.set(r.subtopicCode, [...(map.get(r.subtopicCode) ?? []), r]);
  return map;
}

export async function buildAutoPackagePreview(userId: number, categoryId: number, subjectId: number): Promise<AutoPackagePreview> {
  const ctx = await loadSubjectContext(categoryId, subjectId);
  if (!ctx) return { ok: false, error: "Mata pelajaran tidak ditemukan untuk jenjang ini." };
  if (!ctx.rule) return { ok: false, error: `${ctx.name} belum punya aturan paket.` };
  if (!ctx.outline.length) return { ok: false, error: "Topik & subtopik mapel ini belum ada — jalankan npm run db:seed:asesmen." };

  const available = await loadAvailable(subjectId);
  const plan = planAutoPackage({ available, outline: ctx.outline, questionCount: ctx.rule.questionCount, levelled: ctx.levelled });
  const names = new Map(ctx.outline.flatMap((t) => t.subtopics.map((s) => [s.code, { sub: s.name, topic: t.name }] as const)));
  const raw = batchAiSlots(plan.aiSlots);
  const sources = await pickSources([...new Set(raw.map((b) => b.subtopicCode))]);
  const batches: AutoBatch[] = [];
  for (const b of raw) {
    const candidates = sources.get(b.subtopicCode) ?? [];
    const same = candidates.filter((c) => c.type === b.type);
    const pool = same.length ? same : candidates;
    const source = pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
    // Maks. 10 soal per panggilan Gemini (batas generate AI).
    for (let left = b.count; left > 0; left -= 10) {
      batches.push({
        subtopicCode: b.subtopicCode,
        subtopicName: names.get(b.subtopicCode)?.sub ?? b.subtopicCode,
        topicName: names.get(b.subtopicCode)?.topic ?? "",
        type: b.type,
        tier: b.tier,
        count: Math.min(left, 10),
        sourceQuestionId: source?.id ?? null,
        sourceSnippet: source ? source.text.slice(0, 140) : null,
      });
    }
  }
  return {
    ok: true,
    subjectName: ctx.name,
    jenjang: ctx.jenjang,
    questionCount: ctx.rule.questionCount,
    durationMinutes: ctx.rule.durationMinutes,
    availableCount: available.length,
    bankIds: plan.bankIds,
    bankPg: plan.stats.bankPg,
    batches,
    hasGeminiKey: Boolean(await getGeminiKey(userId)),
    levelled: ctx.levelled,
    tiers: plan.tiers,
  };
}

export type AutoBatchResult = { ok: true; ids: number[]; rejected: string[] } | { ok: false; error: string };

const DIFF_RANK: Record<Difficulty, number> = { easy: 1, medium: 2, hard: 3 };

export async function runAutoPackageBatch(
  userId: number,
  b: { subtopicCode: string; type: QuestionType; count: number; tier: Tier; sourceQuestionId: number | null },
): Promise<AutoBatchResult> {
  const ref = findSubdomain(b.subtopicCode);
  if (!ref) return { ok: false, error: "Subtopik tidak ada di kerangka asesmen." };
  // Mata uji ber-level (mis. Matematika) wajib menyebut level kognitif target.
  const levelled = ref.subject.cognitiveLevels.length > 0;
  const cognitiveLevel = levelled ? (ref.subject.cognitiveLevels.find((l) => l.code === `L${b.tier}`)?.code ?? null) : null;
  if (levelled && !cognitiveLevel) return { ok: false, error: `Level L${b.tier} tidak ada untuk ${ref.subject.name}.` };
  const difficulty = TIER_DIFFICULTY[b.tier];

  let variation: VariationStyle = "bebas";
  if (b.sourceQuestionId) {
    const [src] = await db
      .select({ difficulty: questions.difficulty, subtopicCode: subtopics.code })
      .from(questions)
      .innerJoin(subtopics, eq(subtopics.id, questions.subtopicId))
      .where(eq(questions.id, b.sourceQuestionId));
    if (!src || src.subtopicCode !== b.subtopicCode) return { ok: false, error: "Soal asal tidak cocok dengan subtopik." };
    // Variasi diarahkan ke tingkat target: soal asal lebih mudah → "lebih sulit", dst.
    const gap = DIFF_RANK[difficulty] - DIFF_RANK[src.difficulty];
    variation = gap > 0 ? "lebih_sulit" : gap < 0 ? "lebih_mudah" : "bebas";
  }
  const r = await generateAiQuestions(userId, {
    mode: b.sourceQuestionId ? "variasi" : "baru",
    subdomainCode: b.subtopicCode,
    form: b.type,
    count: b.count,
    difficulty,
    cognitiveLevel,
    sourceQuestionId: b.sourceQuestionId,
    variation,
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, ids: r.created.map((c) => c.id), rejected: r.rejected };
}

export type AutoCreateResult = { ok: true; id: number; total: number } | { ok: false; errors: string[] };

export async function createAutoPackage(
  userId: number,
  p: { categoryId: number; subjectId: number; title: string; bankIds: number[]; aiIds: number[] },
): Promise<AutoCreateResult> {
  const ctx = await loadSubjectContext(p.categoryId, p.subjectId);
  if (!ctx?.rule) return { ok: false, errors: ["Mata pelajaran tidak ditemukan atau belum punya aturan paket."] };

  // Validasi ulang — susunan dari client tidak dipercaya.
  const bank = await loadAvailable(p.subjectId, p.bankIds);
  if (bank.length !== new Set(p.bankIds).size) {
    return { ok: false, errors: ["Sebagian soal bank sudah dipakai paket lain atau berubah. Buat ulang rencananya."] };
  }
  const orderErrors = validatePackageOrder(p.bankIds, bank);
  if (orderErrors.length) return { ok: false, errors: orderErrors };

  const aiRows = p.aiIds.length
    ? await loadAvailable(p.subjectId, p.aiIds).then(async (rows) => {
        const own = await db
          .select({ id: questions.id })
          .from(questions)
          .where(and(inArray(questions.id, p.aiIds), eq(questions.generatedBy, "ai"), eq(questions.createdBy, userId), isNull(questions.stimulusId)));
        const ownIds = new Set(own.map((o) => o.id));
        return rows.filter((r) => ownIds.has(r.id));
      })
    : [];
  if (aiRows.length !== new Set(p.aiIds).size) return { ok: false, errors: ["Soal AI tidak valid atau sudah dipakai paket lain."] };

  const subOrder = new Map(ctx.outline.flatMap((t) => t.subtopics).map((s, i) => [s.code, i]));
  const aiOrdered = [...aiRows].sort((a, b) => (subOrder.get(a.subtopicCode) ?? 0) - (subOrder.get(b.subtopicCode) ?? 0) || a.id - b.id).map((r) => r.id);
  const ordered = [...p.bankIds, ...aiOrdered];
  if (!ordered.length) return { ok: false, errors: ["Belum ada soal untuk paket."] };

  const id = await db.transaction(async (tx) => {
    const [{ id }] = await tx
      .insert(testPackages)
      .values({
        title: p.title,
        description: "Disusun otomatis dari bank soal + tambahan AI — tinjau soal berstatus menunggu tinjauan sebelum terbit.",
        categoryId: p.categoryId,
        subjectId: p.subjectId,
        durationMinutes: ctx.rule!.durationMinutes,
        isPremium: false,
        status: "draft",
        createdBy: userId,
      })
      .$returningId();
    await tx.insert(testPackageQuestions).values(ordered.map((questionId, i) => ({ testPackageId: id, questionId, order: i + 1 })));
    return id;
  });
  return { ok: true, id, total: ordered.length };
}
