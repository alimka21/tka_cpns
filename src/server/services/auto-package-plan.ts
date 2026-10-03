// Rencana "Buat paket otomatis" (docs/ATURAN_PAKET.md): pilih soal bank yang
// belum masuk paket mana pun sehingga aturan wajib terpenuhi sebisa mungkin,
// lalu hitung kekurangannya untuk ditambal AI (variasi soal bank di subtopik
// yang sama, atau soal baru bila subtopik belum punya soal). Tiap soal AI
// diberi tingkat (mudah/L1 … sulit/L3) agar sebaran paket tidak mudah semua.
// Fungsi murni.

import { pgRange, QUALITY_TARGET, type SubjectOutline } from "@/lib/package-rules";
import type { Difficulty, QuestionType } from "@/lib/validation/enums";

export type PlanQuestion = {
  id: number;
  type: QuestionType;
  subtopicCode: string;
  stimulusId: number | null;
  stimulusOrder: number | null;
  difficulty?: Difficulty;
  cognitiveLevel?: string | null;
};

/** Tingkat kualitas soal: 1 = mudah/L1, 2 = sedang/L2, 3 = sulit/L3 (penalaran). */
export type Tier = 1 | 2 | 3;
export const TIER_DIFFICULTY: Record<Tier, Difficulty> = { 1: "easy", 2: "medium", 3: "hard" };
const DIFFICULTY_TIER: Record<Difficulty, Tier> = { easy: 1, medium: 2, hard: 3 };

/** Tingkat soal bank: level kognitif bila mata uji memakainya, selain itu tingkat kesulitan. */
function tierOf(q: PlanQuestion, levelled: boolean): Tier | null {
  if (levelled && q.cognitiveLevel && /^L[123]$/.test(q.cognitiveLevel)) return Number(q.cognitiveLevel[1]) as Tier;
  return q.difficulty ? DIFFICULTY_TIER[q.difficulty] : null;
}

/** Satu blok paket: soal tunggal, atau seluruh soal satu stimulus (urut). */
type Unit = { ids: number[]; subtopics: string[]; pg: number; size: number; sortKey: string };

export type AiSlot = { subtopicCode: string; type: QuestionType; tier: Tier };

export type AutoPackagePlan = {
  /** Soal bank terpilih, sudah tersusun (grup utuh & berurutan). */
  bankIds: number[];
  /** Kekurangan yang perlu dibuat AI, satu entri per soal. */
  aiSlots: AiSlot[];
  stats: { bank: number; bankPg: number; ai: number; aiPg: number; target: number };
  /** Sebaran tingkat 1/2/3 seluruh paket (bank + AI); soal bank tanpa data tidak dihitung. */
  tiers: Record<Tier, number>;
};

function unitsOf(questions: PlanQuestion[], order: Map<string, number>): Unit[] {
  const groups = new Map<number, PlanQuestion[]>();
  const units: Unit[] = [];
  const key = (codes: string[]) => String(Math.min(...codes.map((c) => order.get(c) ?? 9999))).padStart(4, "0");
  for (const q of questions) {
    if (q.stimulusId == null) {
      units.push({ ids: [q.id], subtopics: [q.subtopicCode], pg: q.type === "pg" ? 1 : 0, size: 1, sortKey: `${key([q.subtopicCode])}-${q.id}` });
    } else {
      groups.set(q.stimulusId, [...(groups.get(q.stimulusId) ?? []), q]);
    }
  }
  for (const [stimulusId, list] of groups) {
    list.sort((a, b) => (a.stimulusOrder ?? 0) - (b.stimulusOrder ?? 0) || a.id - b.id);
    const subs = list.map((q) => q.subtopicCode);
    units.push({
      ids: list.map((q) => q.id),
      subtopics: [...new Set(subs)],
      pg: list.filter((q) => q.type === "pg").length,
      size: list.length,
      sortKey: `${key(subs)}-g${stimulusId}`,
    });
  }
  return units;
}

/**
 * `available` = soal bank mapel ini yang boleh dipakai (belum masuk paket,
 * status tayang / menunggu tinjauan). Grup stimulus hanya dipakai bila semua
 * anggotanya ada di `available` (pemanggil yang menyaring).
 */
export function planAutoPackage(input: {
  available: PlanQuestion[];
  outline: SubjectOutline;
  questionCount: number;
  /** Mata uji memakai level kognitif L1–L3 (bahasa: tidak). */
  levelled?: boolean;
}): AutoPackagePlan {
  const N = input.questionCount;
  const range = pgRange(N);
  const targetPg = Math.min(range.max, Math.max(range.min, Math.round(N * 0.55)));
  const allSubs = input.outline.flatMap((t) => t.subtopics.map((s) => s.code));
  const order = new Map(allSubs.map((c, i) => [c, i]));
  const topicOf = new Map(input.outline.flatMap((t) => t.subtopics.map((s) => [s.code, t.code] as const)));

  const units = unitsOf(input.available, order);
  const chosen: Unit[] = [];
  const subCount = new Map<string, number>();
  let size = 0;
  let pg = 0;

  // Batas tipe: PG tidak boleh lewat maksimum, non-PG tidak boleh membuat PG
  // mustahil mencapai minimum.
  const fits = (u: Unit) => size + u.size <= N && pg + u.pg <= range.max && size - pg + (u.size - u.pg) <= N - range.min;
  const take = (u: Unit) => {
    chosen.push(u);
    units.splice(units.indexOf(u), 1);
    size += u.size;
    pg += u.pg;
    for (const s of u.subtopics) subCount.set(s, (subCount.get(s) ?? 0) + 1);
  };
  const coveredTopics = () => new Set([...subCount.keys()].map((s) => topicOf.get(s)));

  // 1) Cakupan: blok yang menambah topik/subtopik baru terbanyak per soal.
  for (;;) {
    const topics = coveredTopics();
    let best: Unit | null = null;
    let bestScore = 0;
    for (const u of units) {
      if (!fits(u)) continue;
      const newSubs = u.subtopics.filter((s) => !subCount.has(s) && order.has(s)).length;
      const newTopics = new Set(u.subtopics.filter((s) => !subCount.has(s)).map((s) => topicOf.get(s)).filter((t) => t && !topics.has(t))).size;
      const score = (newTopics * 10 + newSubs) / u.size;
      if (score > bestScore) {
        best = u;
        bestScore = score;
      }
    }
    if (!best) break;
    take(best);
  }

  // 2) Isi sisa kuota: arahkan PG ke target, sebar ke subtopik yang paling sedikit.
  for (;;) {
    const remaining = N - size;
    if (remaining === 0) break;
    const wantPg = pg < targetPg;
    let best: Unit | null = null;
    let bestScore = -Infinity;
    for (const u of units) {
      if (!fits(u)) continue;
      const typeFit = wantPg ? u.pg / u.size : 1 - u.pg / u.size;
      const spread = -Math.min(...u.subtopics.map((s) => subCount.get(s) ?? 0));
      const score = typeFit * 100 + spread * 10 - u.size;
      if (score > bestScore) {
        best = u;
        bestScore = score;
      }
    }
    if (!best) break;
    take(best);
  }

  // 3) Kekurangan untuk AI: subtopik dulu (yang belum terwakili, lalu yang
  // paling sedikit), lalu bentuk soal dibagikan berurutan per subtopik supaya
  // satu subtopik = sedikit bentuk = sedikit panggilan Gemini.
  const missing = N - size;
  const aiPg = Math.min(Math.min(missing, range.max - pg), Math.max(range.min - pg, targetPg - pg, 0));
  const byId = new Map(input.available.map((q) => [q.id, q]));
  const typeCount = (t: QuestionType) => chosen.flatMap((u) => u.ids).filter((id) => byId.get(id)?.type === t).length;
  // Non-PG: imbangkan MCMA & Kategori (keduanya disarankan ada).
  let mcma = typeCount("pgk_mcma");
  let kategori = typeCount("pgk_kategori");
  let aiMcma = 0;
  for (let i = aiPg; i < missing; i++) {
    if (mcma <= kategori) {
      mcma++;
      aiMcma++;
    } else kategori++;
  }
  const types: QuestionType[] = [
    ...Array.from({ length: aiPg }, () => "pg" as const),
    ...Array.from({ length: aiMcma }, () => "pgk_mcma" as const),
    ...Array.from({ length: missing - aiPg - aiMcma }, () => "pgk_kategori" as const),
  ];

  const pickSubtopic = () => {
    const topics = coveredTopics();
    let best = allSubs[0];
    let bestScore = Infinity;
    for (const s of allSubs) {
      const topicGap = topics.has(topicOf.get(s)) ? 0 : -1000;
      const score = topicGap + (subCount.get(s) ?? 0) * 10 + (order.get(s) ?? 0) / 1000;
      if (score < bestScore) {
        best = s;
        bestScore = score;
      }
    }
    subCount.set(best, (subCount.get(best) ?? 0) + 1);
    return best;
  };
  const slotSubs = allSubs.length > 0 ? types.map(() => pickSubtopic()) : [];
  slotSubs.sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));

  // 4) Tingkat soal AI: tutup kekurangan terhadap target sebaran seluruh paket
  // (QUALITY_TARGET). Satu kelompok subtopik+bentuk diusahakan satu tingkat
  // supaya batch Gemini tetap sedikit.
  const tiers: Record<Tier, number> = { 1: 0, 2: 0, 3: 0 };
  for (const id of chosen.flatMap((u) => u.ids)) {
    const t = tierOf(byId.get(id)!, input.levelled ?? false);
    if (t) tiers[t]++;
  }
  const target: Record<Tier, number> = { 1: N * QUALITY_TARGET.low, 2: N * QUALITY_TARGET.mid, 3: N * QUALITY_TARGET.high };
  const deficit = (t: Tier) => target[t] - tiers[t];
  const aiSlots: AiSlot[] = [];
  let prevKey = "";
  let prevTier: Tier = 2;
  slotSubs.forEach((subtopicCode, i) => {
    const key = `${subtopicCode}|${types[i]}`;
    const best = ([3, 2, 1] as Tier[]).reduce((a, b) => (deficit(b) > deficit(a) ? b : a));
    const tier = key === prevKey && deficit(prevTier) > 0 ? prevTier : best;
    tiers[tier]++;
    aiSlots.push({ subtopicCode, type: types[i], tier });
    prevKey = key;
    prevTier = tier;
  });

  chosen.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  return {
    bankIds: chosen.flatMap((u) => u.ids),
    aiSlots,
    stats: { bank: size, bankPg: pg, ai: aiSlots.length, aiPg: aiSlots.filter((s) => s.type === "pg").length, target: N },
    tiers,
  };
}

/** Gabungkan slot AI menjadi permintaan per (subtopik, bentuk soal, tingkat). */
export function batchAiSlots(slots: AiSlot[]): (AiSlot & { count: number })[] {
  const map = new Map<string, AiSlot & { count: number }>();
  for (const s of slots) {
    const k = `${s.subtopicCode}|${s.type}|${s.tier}`;
    const cur = map.get(k);
    if (cur) cur.count++;
    else map.set(k, { ...s, count: 1 });
  }
  return [...map.values()];
}
