// Aturan resmi penyusunan paket tes TKA per jenjang & mata pelajaran
// (docs/ATURAN_PAKET.md). Fungsi murni — dipakai form admin (cek langsung)
// dan server (wajib lolos sebelum paket diterbitkan).

import type { Difficulty, QuestionType } from "@/lib/validation/enums";

export type PackageRule = { questionCount: number; durationMinutes: number; label: string };

export type SubjectInfo = { code: string; type: "wajib" | "pilihan" };

/** Struktur mapel dari kerangka asesmen: topik (domain) → subtopik (subdomain). */
export type SubjectOutline = { code: string; name: string; subtopics: { code: string; name: string }[] }[];

/**
 * Jumlah soal & durasi per mata pelajaran:
 * - SD & SMP: Matematika 30 soal/75 menit, Bahasa Indonesia 30 soal/75 menit.
 * - SMA/SMK: Bahasa Indonesia 30/75, Bahasa Inggris 30/75,
 *   Matematika (& Numerasi) 25/75, mapel pilihan masing-masing 25/60.
 */
export function packageRuleFor(jenjang: string, subject: SubjectInfo): PackageRule | null {
  const code = subject.code;
  if (jenjang === "SD" || jenjang === "SMP") {
    if (code.endsWith("-MTK")) return { questionCount: 30, durationMinutes: 75, label: "Matematika" };
    if (code.endsWith("-BIND")) return { questionCount: 30, durationMinutes: 75, label: "Bahasa Indonesia" };
    return null;
  }
  if (jenjang === "SMA") {
    if (subject.type === "pilihan") return { questionCount: 25, durationMinutes: 60, label: "Mata pelajaran pilihan" };
    if (code === "SMA-BIND") return { questionCount: 30, durationMinutes: 75, label: "Bahasa Indonesia" };
    if (code === "SMA-BING") return { questionCount: 30, durationMinutes: 75, label: "Bahasa Inggris" };
    if (code === "SMA-MTK") return { questionCount: 25, durationMinutes: 75, label: "Matematika & Numerasi" };
    return null;
  }
  return null;
}

/** Subtopik wajib minimal 80% (dibulatkan ke bawah, tidak melebihi jumlah soal). */
export function requiredSubtopicCount(totalSubtopics: number, questionCount: number) {
  return Math.min(Math.floor(totalSubtopics * 0.8), questionCount);
}

/** PG sederhana 50–60% dari total soal (dibulatkan ke rentang bilangan bulat yang masih di dalamnya). */
export function pgRange(total: number) {
  return { min: Math.ceil(total * 0.5), max: Math.floor(total * 0.6) };
}

/**
 * Sebaran kualitas soal (disarankan, docs/ATURAN_PAKET.md): target paket
 * ±20% mudah/L1, ±50% sedang/L2, ±30% sulit/L3. Dipakai Buat Paket Otomatis
 * untuk menentukan target soal AI dan cek saran di bawah.
 */
export const QUALITY_TARGET = { low: 0.2, mid: 0.5, high: 0.3 } as const;
/** Batas saran: mudah/L1 paling banyak 40%, sulit/L3 minimal 15%/20%. */
export const QUALITY_LIMIT = { maxEasy: 0.4, minHard: 0.15, maxL1: 0.4, minL3: 0.2 } as const;

export type RuleQuestion = {
  type: QuestionType;
  subjectCode: string;
  /** Kode subtopik soal, mis. SD-MTK-D1-S1. */
  subtopicCode: string;
  /** Id atau kode stimulus (soal grup); null = soal tunggal. */
  stimulusKey: number | string | null;
  hasImage: boolean;
  /** Opsional — tanpa data ini cek sebaran kualitas dilewati. */
  difficulty?: Difficulty;
  /** L1/L2/L3; null untuk mata uji tanpa level kognitif (mis. bahasa). */
  cognitiveLevel?: string | null;
};

export type RuleCheck = { ok: boolean; label: string; detail: string };

export type PackageRuleReport = {
  rule: PackageRule | null;
  /** Wajib — paket tidak bisa diterbitkan bila ada yang gagal. */
  required: RuleCheck[];
  /** Disarankan — tidak memblokir. */
  recommended: RuleCheck[];
  stats: { total: number; pg: number; mcma: number; kategori: number; stimulusBased: number };
  /** Topik & subtopik mapel yang belum punya soal di paket. */
  missingTopics: string[];
  missingSubtopics: string[];
  publishable: boolean;
};

export function checkPackageRules(input: {
  jenjang: string;
  subject: SubjectInfo | null;
  durationMinutes: number;
  questions: RuleQuestion[];
  /** Topik mapel (beserta subtopiknya); tanpa outline, cakupan topik tidak dicek. */
  outline?: SubjectOutline;
}): PackageRuleReport {
  const qs = input.questions;
  const stats = {
    total: qs.length,
    pg: qs.filter((q) => q.type === "pg").length,
    mcma: qs.filter((q) => q.type === "pgk_mcma").length,
    kategori: qs.filter((q) => q.type === "pgk_kategori").length,
    stimulusBased: qs.filter((q) => q.stimulusKey != null || q.hasImage).length,
  };
  const rule = input.subject ? packageRuleFor(input.jenjang, input.subject) : null;
  const required: RuleCheck[] = [];
  const recommended: RuleCheck[] = [];

  required.push({
    ok: rule != null,
    label: "Mata pelajaran dipilih",
    detail: input.subject ? (rule ? rule.label : `${input.subject.code} belum punya aturan paket`) : "Pilih mata pelajaran paket",
  });
  if (rule) {
    required.push({
      ok: stats.total === rule.questionCount,
      label: `Jumlah soal tepat ${rule.questionCount}`,
      detail: `${stats.total} dari ${rule.questionCount} soal`,
    });
    required.push({
      ok: input.durationMinutes === rule.durationMinutes,
      label: `Durasi ${rule.durationMinutes} menit`,
      detail: `${input.durationMinutes} menit`,
    });
    const range = pgRange(rule.questionCount);
    required.push({
      ok: stats.pg >= range.min && stats.pg <= range.max,
      label: `PG sederhana 50–60% (${range.min}–${range.max} soal)`,
      detail: `${stats.pg} soal PG`,
    });
    const foreign = qs.filter((q) => q.subjectCode !== input.subject!.code).length;
    required.push({
      ok: foreign === 0,
      label: "Semua soal dari mata pelajaran ini",
      detail: foreign === 0 ? "Sesuai" : `${foreign} soal dari mata pelajaran lain`,
    });
  }

  // Cakupan materi (opsi B, DECISIONS 2026-10-01): semua topik wajib; subtopik
  // wajib ≥80%, 100% disarankan. Diagnosa menggabungkan riwayat semua paket.
  const used = new Set(qs.map((q) => q.subtopicCode));
  const outline = input.outline ?? [];
  const missingTopics = outline.filter((t) => !t.subtopics.some((s) => used.has(s.code)));
  const allSubtopics = outline.flatMap((t) => t.subtopics);
  const missingSubtopics = allSubtopics.filter((s) => !used.has(s.code));
  const coveredSubtopics = allSubtopics.length - missingSubtopics.length;
  if (rule && outline.length > 0) {
    required.push({
      ok: missingTopics.length === 0,
      label: `Semua topik mapel masuk (${outline.length} topik)`,
      detail:
        missingTopics.length === 0
          ? `${outline.length} dari ${outline.length} topik`
          : `Belum ada soal: ${missingTopics.map((t) => t.name).join("; ")}`,
    });
    const need = requiredSubtopicCount(allSubtopics.length, rule.questionCount);
    required.push({
      ok: coveredSubtopics >= need,
      label: `Subtopik minimal 80% (${need} dari ${allSubtopics.length})`,
      detail: `${coveredSubtopics} subtopik terwakili`,
    });
  }

  recommended.push({
    ok: stats.mcma > 0 && stats.kategori > 0,
    label: "Ada PGK MCMA & PGK Kategori",
    detail: `${stats.mcma} MCMA · ${stats.kategori} Kategori`,
  });
  if (rule && outline.length > 0) {
    recommended.push({
      ok: missingSubtopics.length === 0,
      label: `Semua subtopik terwakili (${allSubtopics.length})`,
      detail:
        missingSubtopics.length === 0
          ? "Lengkap"
          : `Belum ada soal (${missingSubtopics.length}): ${missingSubtopics.map((s) => s.name).join("; ")}`,
    });
    // Kuota sempit (< 2 soal per subtopik): grup satu-subtopik menghabiskan slot.
    if (rule.questionCount / Math.max(allSubtopics.length, 1) < 2) {
      const groups = new Map<number | string, Set<string>>();
      const sizes = new Map<number | string, number>();
      for (const q of qs) {
        if (q.stimulusKey == null) continue;
        groups.set(q.stimulusKey, (groups.get(q.stimulusKey) ?? new Set()).add(q.subtopicCode));
        sizes.set(q.stimulusKey, (sizes.get(q.stimulusKey) ?? 0) + 1);
      }
      const singleSub = [...groups].filter(([k, subs]) => subs.size === 1 && (sizes.get(k) ?? 0) > 1).length;
      recommended.push({
        ok: singleSub === 0,
        label: "Soal dalam satu stimulus dari subtopik berbeda",
        detail:
          groups.size === 0
            ? "Belum ada soal grup"
            : singleSub === 0
              ? "Sesuai"
              : `${singleSub} grup berisi satu subtopik saja — kuota mapel ini sempit (${(rule.questionCount / allSubtopics.length).toFixed(1)} soal/subtopik)`,
      });
    }
  }
  recommended.push(...qualityChecks(qs));
  if (input.jenjang === "SMA") {
    recommended.push({
      ok: stats.total > 0 && stats.stimulusBased * 2 > stats.total,
      label: "Mayoritas soal berbasis stimulus (bacaan, grafik, tabel, gambar)",
      detail: `${stats.stimulusBased} dari ${stats.total} soal`,
    });
    const groupSizes = new Map<number | string, number>();
    for (const q of qs) if (q.stimulusKey != null) groupSizes.set(q.stimulusKey, (groupSizes.get(q.stimulusKey) ?? 0) + 1);
    const off = [...groupSizes.values()].filter((n) => n < 3 || n > 5).length;
    recommended.push({
      ok: groupSizes.size > 0 && off === 0,
      label: "Soal grup: 1 stimulus untuk 3–5 soal",
      detail:
        groupSizes.size === 0
          ? "Belum ada soal grup"
          : off === 0
            ? `${groupSizes.size} grup sesuai`
            : `${off} grup di luar 3–5 soal`,
    });
  }

  return {
    rule,
    required,
    recommended,
    stats,
    missingTopics: missingTopics.map((t) => t.name),
    missingSubtopics: missingSubtopics.map((s) => s.name),
    publishable: required.every((c) => c.ok),
  };
}

const pct = (n: number, total: number) => `${Math.round((n / total) * 100)}%`;

/** Saran sebaran tingkat kesulitan & level kognitif — paket tidak boleh mudah/L1 semua. */
function qualityChecks(qs: RuleQuestion[]): RuleCheck[] {
  const checks: RuleCheck[] = [];
  const withDiff = qs.filter((q) => q.difficulty);
  if (withDiff.length > 0 && withDiff.length === qs.length) {
    const n = qs.length;
    const easy = qs.filter((q) => q.difficulty === "easy").length;
    const medium = qs.filter((q) => q.difficulty === "medium").length;
    const hard = qs.filter((q) => q.difficulty === "hard").length;
    checks.push({
      ok: easy <= n * QUALITY_LIMIT.maxEasy && hard >= Math.ceil(n * QUALITY_LIMIT.minHard),
      label: `Tingkat kesulitan beragam (mudah ≤ ${QUALITY_LIMIT.maxEasy * 100}%, sulit ≥ ${QUALITY_LIMIT.minHard * 100}%)`,
      detail: `${easy} mudah (${pct(easy, n)}) · ${medium} sedang · ${hard} sulit (${pct(hard, n)})`,
    });
  }
  // Level kognitif hanya untuk mata uji yang memakainya (soal bahasa tidak punya level).
  const levelled = qs.filter((q) => q.cognitiveLevel);
  if (levelled.length > 0 && levelled.length * 2 >= qs.length) {
    const n = levelled.length;
    const l1 = levelled.filter((q) => q.cognitiveLevel === "L1").length;
    const l2 = levelled.filter((q) => q.cognitiveLevel === "L2").length;
    const l3 = levelled.filter((q) => q.cognitiveLevel === "L3").length;
    checks.push({
      ok: l1 <= n * QUALITY_LIMIT.maxL1 && l3 >= Math.ceil(n * QUALITY_LIMIT.minL3),
      label: `Level kognitif beragam (L1 ≤ ${QUALITY_LIMIT.maxL1 * 100}%, L3 penalaran ≥ ${QUALITY_LIMIT.minL3 * 100}%)`,
      detail: `${l1} L1 (${pct(l1, n)}) · ${l2} L2 · ${l3} L3 (${pct(l3, n)})${n < qs.length ? ` — ${qs.length - n} soal tanpa level` : ""}`,
    });
  }
  return checks;
}

/** Pesan error (untuk server) dari aturan wajib yang gagal. */
export function ruleErrors(report: PackageRuleReport) {
  return report.required.filter((c) => !c.ok).map((c) => `Aturan paket belum terpenuhi — ${c.label}: ${c.detail}.`);
}
