// "Buat paket otomatis" (admin): pratinjau rencana dari bank → AI menambal
// kekurangan per batch (dijalankan client satu per satu, tiap batch satu
// panggilan Gemini) → paket draf disusun & divalidasi ulang di server.

import { and, eq, inArray, isNull, notInArray } from "drizzle-orm";
import { packageRuleFor } from "@/lib/package-rules";
import type { Difficulty, QuestionType } from "@/lib/validation/enums";
import type { VariationStyle } from "@/server/asesmen/generation-context";
import { findSubdomain } from "@/server/asesmen";
import { db } from "@/server/db";
import { categories, questions, stimuli, subjects, subtopics, testPackageQuestions, testPackages, topics } from "@/server/db/schema";
import { loadSubjectOutlines } from "@/server/queries/packages";
import { getGeminiKey } from "@/server/services/ai-key";
import { generateAiQuestions, type PlanItem } from "@/server/services/ai-generate";
import { batchAiSlots, planAutoPackage, TIER_DIFFICULTY, type PlanQuestion, type Tier } from "@/server/services/auto-package-plan";
import { validatePackageOrder } from "@/server/services/package-composition";

/** Status soal bank yang boleh diambil (keputusan pemilik produk 2026-10-02). */
const USABLE_STATUSES = ["published", "pending_review"] as const;

export type AutoBatchSlot = { subtopicCode: string; subtopicName: string; topicName: string; type: QuestionType; tier: Tier };

export type AutoBatch = {
  /** grup = 1 bacaan baru + beberapa soal; tunggal = soal berdiri sendiri satu subtopik. */
  kind: "grup" | "tunggal";
  slots: AutoBatchSlot[];
  /** Hanya batch tunggal: soal bank yang divariasikan (null = soal baru). */
  sourceQuestionId: number | null;
  sourceSnippet: string | null;
  /** Arahan tema & nama tokoh supaya batch tidak seragam (mis. nama "Aris" di banyak soal). */
  theme: string;
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
  const ref = firstSub ? findSubdomain(firstSub) : null;
  const levelled = (ref?.subject.cognitiveLevels.length ?? 0) > 0;
  // Mata uji literasi membaca (Bahasa Indonesia/Inggris): soal TKA-nya berbasis bacaan.
  const reading = ref?.subject.raw.aspek_keterampilan_membaca !== undefined;
  // SMA: mayoritas soal disarankan berbasis stimulus (docs/ATURAN_PAKET.md).
  const groupShare = reading ? 1 : row.jenjang === "SMA" ? 0.5 : 0;
  return { ...row, rule, outline, levelled, groupShare };
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
  const plan = planAutoPackage({
    available,
    outline: ctx.outline,
    questionCount: ctx.rule.questionCount,
    levelled: ctx.levelled,
    groupShare: ctx.groupShare,
  });
  const names = new Map(ctx.outline.flatMap((t) => t.subtopics.map((s) => [s.code, { sub: s.name, topic: t.name }] as const)));
  const raw = batchAiSlots(plan);
  const sources = await pickSources([...new Set(raw.filter((b) => b.kind === "tunggal").map((b) => b.slots[0].subtopicCode))]);
  const themes = themeAssigner();
  const batches: AutoBatch[] = raw.map((b) => {
    const pool = b.kind === "tunggal" ? (sources.get(b.slots[0].subtopicCode) ?? []) : [];
    const source = pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
    return {
      kind: b.kind,
      slots: b.slots.map((s) => ({
        ...s,
        subtopicName: names.get(s.subtopicCode)?.sub ?? s.subtopicCode,
        topicName: names.get(s.subtopicCode)?.topic ?? "",
      })),
      sourceQuestionId: source?.id ?? null,
      sourceSnippet: source ? source.text.slice(0, 140) : null,
      theme: themes(b.slots.length),
    };
  });
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

export type AutoBatchSlotInput = { subtopicCode: string; type: QuestionType; tier: Tier };
export type AutoBatchResult =
  | {
      ok: true;
      ids: number[];
      rejected: string[];
      /** Slot rencana yang belum terisi — bisa diminta ulang ("Lengkapi soal yang kurang"). */
      missing: AutoBatchSlotInput[];
      /** Grup: stimulus yang dibuat/dipakai, supaya kekurangannya ditambahkan ke bacaan yang sama. */
      stimulusId: number | null;
    }
  | { ok: false; error: string };

const DIFF_RANK: Record<Difficulty, number> = { easy: 1, medium: 2, hard: 3 };
const DIFFICULTY_TIER: Record<Difficulty, Tier> = { easy: 1, medium: 2, hard: 3 };

export async function runAutoPackageBatch(
  userId: number,
  b: { kind: "grup" | "tunggal"; slots: AutoBatchSlotInput[]; sourceQuestionId: number | null; theme: string; stimulusId?: number | null },
): Promise<AutoBatchResult> {
  // Melengkapi grup: hanya ke bacaan buatan AI milik admin ini sendiri.
  if (b.stimulusId != null) {
    if (b.kind !== "grup") return { ok: false, error: "Stimulus hanya untuk batch grup." };
    const [st] = await db.select({ createdBy: stimuli.createdBy, code: stimuli.code }).from(stimuli).where(eq(stimuli.id, b.stimulusId));
    if (!st || st.createdBy !== userId || !st.code.startsWith("AI-")) return { ok: false, error: "Bacaan grup tidak valid untuk dilengkapi." };
  }
  const refs = b.slots.map((s) => findSubdomain(s.subtopicCode));
  if (refs.some((r) => !r)) return { ok: false, error: "Subtopik tidak ada di kerangka asesmen." };
  const subject = refs[0]!.subject;
  if (refs.some((r) => r!.subject.code !== subject.code)) return { ok: false, error: "Semua soal batch harus dari mata uji yang sama." };
  if (b.kind === "tunggal" && b.slots.some((s) => s.subtopicCode !== b.slots[0].subtopicCode)) {
    return { ok: false, error: "Batch soal tunggal harus satu subtopik." };
  }
  // Mata uji ber-level (mis. Matematika) wajib menyebut level kognitif target.
  const levelled = subject.cognitiveLevels.length > 0;
  const plan: PlanItem[] = [];
  for (const s of b.slots) {
    const cognitiveLevel = levelled ? (subject.cognitiveLevels.find((l) => l.code === `L${s.tier}`)?.code ?? null) : null;
    if (levelled && !cognitiveLevel) return { ok: false, error: `Level L${s.tier} tidak ada untuk ${subject.name}.` };
    plan.push({ subdomainCode: s.subtopicCode, form: s.type, difficulty: TIER_DIFFICULTY[s.tier], cognitiveLevel });
  }

  const sourceQuestionId = b.kind === "tunggal" ? b.sourceQuestionId : null;
  let variation: VariationStyle = "bebas";
  if (sourceQuestionId) {
    const [src] = await db
      .select({ difficulty: questions.difficulty, subtopicCode: subtopics.code })
      .from(questions)
      .innerJoin(subtopics, eq(subtopics.id, questions.subtopicId))
      .where(eq(questions.id, sourceQuestionId));
    if (!src || src.subtopicCode !== b.slots[0].subtopicCode) return { ok: false, error: "Soal asal tidak cocok dengan subtopik." };
    // Satu variasi bertingkat sama → arahkan; tingkat campur → bebas (tingkat per soal ada di rencana).
    const only = new Set(plan.map((p) => p.difficulty));
    if (only.size === 1) {
      const gap = DIFF_RANK[plan[0].difficulty] - DIFF_RANK[src.difficulty];
      variation = gap > 0 ? "lebih_sulit" : gap < 0 ? "lebih_mudah" : "bebas";
    }
  }
  const r = await generateAiQuestions(userId, {
    mode: b.kind === "grup" ? "grup" : sourceQuestionId ? "variasi" : "baru",
    subdomainCode: plan[0].subdomainCode,
    form: "campuran",
    count: plan.length,
    difficulty: plan[0].difficulty,
    cognitiveLevel: plan[0].cognitiveLevel,
    sourceQuestionId,
    variation,
    plan,
    contextHint: b.theme,
    stimulusId: b.kind === "grup" ? (b.stimulusId ?? null) : null,
  });
  if (!r.ok) return { ok: false, error: r.error };
  return {
    ok: true,
    ids: r.created.map((c) => c.id),
    rejected: r.rejected,
    missing: r.missing.map((m) => ({ subtopicCode: m.subdomainCode, type: m.form, tier: DIFFICULTY_TIER[m.difficulty] })),
    stimulusId: r.stimulus?.id ?? b.stimulusId ?? null,
  };
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
          .where(and(inArray(questions.id, p.aiIds), eq(questions.generatedBy, "ai"), eq(questions.createdBy, userId)));
        const ownIds = new Set(own.map((o) => o.id));
        return rows.filter((r) => ownIds.has(r.id));
      })
    : [];
  if (aiRows.length !== new Set(p.aiIds).size) return { ok: false, errors: ["Soal AI tidak valid atau sudah dipakai paket lain."] };

  // Urutkan seluruh paket per subtopik; grup stimulus (bank atau AI) tetap utuh & berurutan.
  const subOrder = new Map(ctx.outline.flatMap((t) => t.subtopics).map((s, i) => [s.code, i]));
  const ordered = orderPackage(p.bankIds, bank, aiRows, subOrder);
  if (!ordered.length) return { ok: false, errors: ["Belum ada soal untuk paket."] };
  const finalErrors = validatePackageOrder(ordered, [...bank, ...aiRows]);
  if (finalErrors.length) return { ok: false, errors: finalErrors };

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

/** Blok paket (soal tunggal / satu grup stimulus) diurutkan per subtopik terendahnya. */
function orderPackage(bankIds: number[], bank: PlanQuestion[], ai: PlanQuestion[], subOrder: Map<string, number>) {
  const byId = new Map([...bank, ...ai].map((q) => [q.id, q]));
  const aiSorted = [...ai].sort((a, b) => (a.stimulusId ?? 0) - (b.stimulusId ?? 0) || (a.stimulusOrder ?? 0) - (b.stimulusOrder ?? 0) || a.id - b.id);
  const blocks: number[][] = [];
  const blockOf = new Map<number, number[]>();
  for (const id of [...bankIds, ...aiSorted.map((q) => q.id)]) {
    const st = byId.get(id)!.stimulusId;
    if (st == null) blocks.push([id]);
    else if (blockOf.has(st)) blockOf.get(st)!.push(id);
    else {
      const blk = [id];
      blockOf.set(st, blk);
      blocks.push(blk);
    }
  }
  const rank = (blk: number[]) => Math.min(...blk.map((id) => subOrder.get(byId.get(id)!.subtopicCode) ?? 9999));
  return blocks
    .map((blk, i) => ({ blk, i, r: rank(blk) }))
    .sort((a, b) => a.r - b.r || a.i - b.i)
    .flatMap((x) => x.blk);
}

// Tema & nama tokoh per batch (diacak per rencana) — tiap panggilan Gemini
// berjalan terpisah/paralel sehingga tidak saling tahu isi batch lain.
const THEMES = [
  "kelautan dan nelayan pesisir",
  "kuliner dan pangan lokal",
  "kesehatan remaja",
  "seni pertunjukan dan budaya daerah",
  "sejarah dan tokoh lokal",
  "transportasi dan tata kota",
  "olahraga dan prestasi pelajar",
  "sains sehari-hari dan penelitian siswa",
  "pertanian dan ketahanan pangan",
  "pariwisata dan kearifan lokal",
  "literasi digital dan media sosial",
  "kebencanaan dan mitigasi",
  "kewirausahaan dan UMKM",
  "keluarga dan persahabatan",
  "energi terbarukan",
  "satwa, hutan, dan konservasi",
  "musik dan sastra",
  "kehidupan sekolah dan organisasi siswa",
];
const NAMES = [
  "Nadia", "Bayu", "Kirana", "Fajar", "Wulan", "Rizky", "Dewi", "Yohanes", "Putu", "Made", "Ketut", "Siti", "Ucok", "Butet",
  "Andi", "Daeng", "Intan", "Tigor", "Laras", "Gilang", "Mei Lin", "Hendra", "Asih", "Ratna", "Bima", "Sekar", "Arif", "Lestari",
  "Theresia", "Ilham", "Nur", "Dimas", "Ayu", "Rahmat", "Citra", "Yusuf", "Marlina", "Galih", "Fitri", "Samuel",
];

function themeAssigner() {
  let t = Math.floor(Math.random() * THEMES.length);
  let n = Math.floor(Math.random() * NAMES.length);
  return (count: number) => {
    const theme = THEMES[t++ % THEMES.length];
    const names = Array.from({ length: Math.min(4, count + 1) }, () => NAMES[n++ % NAMES.length]);
    return `Tema/konteks bacaan: ${theme} (boleh disesuaikan agar cocok dengan subtopik). Bila perlu nama tokoh, pakai: ${names.join(", ")} — jangan memakai nama lain yang umum dipakai berulang (mis. Aris, Budi, Rina).`;
  };
}
