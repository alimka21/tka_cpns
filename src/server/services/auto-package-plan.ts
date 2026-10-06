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
  /** Kekurangan yang perlu dibuat AI, satu entri per soal (urut subtopik). */
  aiSlots: AiSlot[];
  /** Indeks `aiSlots` yang dibuat sebagai satu grup bacaan (1 stimulus, 3–5 soal). */
  aiGroups: number[][];
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
  /** Porsi soal AI yang dibuat sebagai grup bacaan: 1 = semua (mapel bahasa), 0.5 = separuh (SMA), 0 = tidak ada. */
  groupShare?: number;
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
  // paling sedikit). Bentuk soal disebar merata sepanjang paket (bukan blok
  // per subtopik) supaya tiap topik punya PG, MCMA, dan Kategori.
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
  const typeTotals: [QuestionType, number][] = [
    ["pg", aiPg],
    ["pgk_mcma", aiMcma],
    ["pgk_kategori", missing - aiPg - aiMcma],
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
  const slotSubs = allSubs.length > 0 ? Array.from({ length: missing }, () => pickSubtopic()) : [];
  slotSubs.sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));
  const types = spread(typeTotals, slotSubs.length);

  // 4) Tingkat soal AI: tutup kekurangan terhadap target sebaran seluruh paket
  // (QUALITY_TARGET), lalu sebar merata (tidak satu subtopik satu tingkat).
  const tiers: Record<Tier, number> = { 1: 0, 2: 0, 3: 0 };
  for (const id of chosen.flatMap((u) => u.ids)) {
    const t = tierOf(byId.get(id)!, input.levelled ?? false);
    if (t) tiers[t]++;
  }
  const target: Record<Tier, number> = { 1: N * QUALITY_TARGET.low, 2: N * QUALITY_TARGET.mid, 3: N * QUALITY_TARGET.high };
  // Bagi slot sebanding kekurangan tiap tingkat (sisa pembulatan → kekurangan terbesar, sulit dulu).
  const n = slotSubs.length;
  const deficits = ([1, 2, 3] as Tier[]).map((t) => Math.max(0, target[t] - tiers[t]));
  const sum = deficits.reduce((a, b) => a + b, 0);
  const weights = sum > 0 ? deficits : [QUALITY_TARGET.low, QUALITY_TARGET.mid, QUALITY_TARGET.high];
  const wsum = weights.reduce((a, b) => a + b, 0);
  const exact = weights.map((w) => (n * w) / wsum);
  const counts = exact.map(Math.floor);
  const byRemainder = [2, 1, 0].sort((a, b) => exact[b] - counts[b] - (exact[a] - counts[a]));
  for (let k = 0; counts.reduce((a, b) => a + b, 0) < n; k++) counts[byRemainder[k % 3]]++;
  const tierTotals: Record<Tier, number> = { 1: counts[0], 2: counts[1], 3: counts[2] };
  // Mulai dari tingkat sedang supaya urutan tidak berpola sama dengan bentuk soal.
  const slotTiers = spread(
    ([2, 3, 1] as Tier[]).map((t) => [t, tierTotals[t]] as [Tier, number]),
    slotSubs.length,
  );
  for (const t of slotTiers) tiers[t]++;
  const aiSlots: AiSlot[] = slotSubs.map((subtopicCode, i) => ({ subtopicCode, type: types[i], tier: slotTiers[i] }));

  // 5) Grup bacaan: slot berurutan dalam satu topik dipecah jadi grup 3–5 soal
  // (1 stimulus, lintas subtopik). Mapel bahasa: semua; SMA lain: sebagian.
  const aiGroups: number[][] = [];
  const share = input.groupShare ?? 0;
  if (share > 0) {
    const byTopic = new Map<string, number[]>();
    aiSlots.forEach((s, i) => {
      const t = topicOf.get(s.subtopicCode) ?? "";
      byTopic.set(t, [...(byTopic.get(t) ?? []), i]);
    });
    // Porsi < 1: ambil dari topik dengan slot terbanyak sampai ±share × jumlah slot AI.
    const want = share >= 1 ? Infinity : Math.round(aiSlots.length * share);
    let grouped = 0;
    const topicsBySize = [...byTopic.values()].sort((a, b) => b.length - a.length);
    for (const idx of topicsBySize) {
      if (grouped >= want) break;
      const take = Math.min(idx.length, Math.max(3, want - grouped));
      const groups = chunkGroups(idx.slice(0, take));
      for (const g of groups) aiGroups.push(g);
      grouped += groups.flat().length;
    }
    aiGroups.sort((a, b) => a[0] - b[0]);
  }

  chosen.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  return {
    bankIds: chosen.flatMap((u) => u.ids),
    aiSlots,
    aiGroups,
    stats: { bank: size, bankPg: pg, ai: aiSlots.length, aiPg: aiSlots.filter((s) => s.type === "pg").length, target: N },
    tiers,
  };
}

/**
 * Sebar `totals` (mis. 15 PG, 8 MCMA, 7 Kategori) ke `n` posisi secara merata:
 * di tiap posisi pilih jenis yang paling tertinggal dari porsi idealnya.
 */
export function spread<T>(totals: [T, number][], n: number): T[] {
  const used = totals.map(() => 0);
  const out: T[] = [];
  for (let i = 0; i < n; i++) {
    let best = -1;
    let bestLag = -Infinity;
    totals.forEach(([, total], k) => {
      if (used[k] >= total) return;
      const lag = ((i + 1) * total) / n - used[k];
      if (lag > bestLag) {
        best = k;
        bestLag = lag;
      }
    });
    if (best < 0) break;
    used[best]++;
    out.push(totals[best][0]);
  }
  return out;
}

/** Pecah indeks berurutan jadi grup berukuran 3–5 (sebisa mungkin 4); < 3 → tidak ada grup. */
export function chunkGroups(idx: number[]): number[][] {
  const m = idx.length;
  if (m < 3) return [];
  let k = Math.max(1, Math.round(m / 4));
  while (m / k > 5) k++;
  while (k > 1 && m / k < 3) k--;
  const out: number[][] = [];
  let at = 0;
  for (let g = 0; g < k; g++) {
    const size = Math.floor(m / k) + (g < m % k ? 1 : 0);
    out.push(idx.slice(at, at + size));
    at += size;
  }
  return out;
}

/** Satu panggilan Gemini: grup bacaan, atau soal tunggal satu subtopik (bentuk & tingkat campur). */
export type AiBatchPlan = { kind: "grup" | "tunggal"; slots: AiSlot[] };

/** Susun panggilan Gemini: tiap grup satu panggilan; soal tunggal digabung per subtopik (maks. 10). */
export function batchAiSlots(plan: Pick<AutoPackagePlan, "aiSlots" | "aiGroups">): AiBatchPlan[] {
  const inGroup = new Set(plan.aiGroups.flat());
  const out: { first: number; batch: AiBatchPlan }[] = plan.aiGroups.map((g) => ({ first: g[0], batch: { kind: "grup", slots: g.map((i) => plan.aiSlots[i]) } }));
  const singles = new Map<string, number[]>();
  plan.aiSlots.forEach((s, i) => {
    if (!inGroup.has(i)) singles.set(s.subtopicCode, [...(singles.get(s.subtopicCode) ?? []), i]);
  });
  for (const idx of singles.values()) {
    for (let at = 0; at < idx.length; at += 10) {
      const part = idx.slice(at, at + 10);
      out.push({ first: part[0], batch: { kind: "tunggal", slots: part.map((i) => plan.aiSlots[i]) } });
    }
  }
  return out.sort((a, b) => a.first - b.first).map((o) => o.batch);
}
