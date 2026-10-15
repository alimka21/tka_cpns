// Tampilan nilai per mata uji: nilai skala, kategori capaian resmi, predikat
// istimewa (docs/PENSKORAN-DAN-PELAPORAN-TKA.md). Aman untuk client — data
// dihitung di server (services/score-view.ts) lalu dikirim sebagai objek polos.

import { ACHIEVEMENT_LABEL, SCALE_RANGE, type AchievementCategory, type ScoreScale } from "@/lib/score-scale";
import { fromHundredths, toHundredths } from "@/lib/scoring-config";

export type ScoreView = {
  scale: ScoreScale;
  /** Nilai skala string 2 desimal, mis. "632.00". */
  value: string;
  /** Posisi nilai di rentang skala, 0–100 (untuk grafik & batang). */
  position: number;
  /** Null = ambang kategori belum ditetapkan admin (jangan menebak). */
  category: AchievementCategory | null;
  istimewa: boolean;
};

/** "632.00" → "632,00" (format Indonesia, selalu 2 desimal). */
export function formatScore(value: string) {
  return value.replace(".", ",");
}

export function scalePosition(value: string, scale: ScoreScale) {
  const { min, max } = SCALE_RANGE[scale];
  return Math.min(100, Math.max(0, ((Number(value) - min) / (max - min)) * 100));
}

export const ACHIEVEMENT_META: Record<AchievementCategory, { label: string; variant: "success" | "warning" | "danger" }> = {
  baik: { label: ACHIEVEMENT_LABEL.baik, variant: "success" },
  memadai: { label: ACHIEVEMENT_LABEL.memadai, variant: "warning" },
  kurang: { label: ACHIEVEMENT_LABEL.kurang, variant: "danger" },
};

export const NO_THRESHOLD_NOTE = "Ambang kategori belum ditetapkan";

/** Keterangan wajib: skor = simulasi latihan, bukan skor resmi TKA. */
export const SIMULATION_NOTE =
  "Nilai ini simulasi latihan, bukan skor resmi TKA. Rumus konversi resmi (penyetaraan statistik) tidak dipublikasikan, jadi platform memakai rumus konversi sendiri.";

/** Selisih dua nilai skala sama ("+12,50" / "−3,00" / "0,00"); null bila skalanya berbeda. */
export function scoreDiff(a: ScoreView, b: ScoreView): string | null {
  if (a.scale !== b.scale) return null;
  const d = toHundredths(a.value) - toHundredths(b.value);
  return `${d > 0 ? "+" : d < 0 ? "−" : ""}${formatScore(fromHundredths(Math.abs(d)))}`;
}

/**
 * Rata-rata nilai skala (2 desimal, aritmetika perseratus). Hanya nilai
 * sekala dengan nilai pertama yang dihitung — dua skala tidak dicampur.
 */
export function averageScore(scores: ScoreView[]): { scale: ScoreScale; value: string; count: number } | null {
  if (scores.length === 0) return null;
  const scale = scores[0].scale;
  const same = scores.filter((s) => s.scale === scale);
  const sum = same.reduce((acc, s) => acc + toHundredths(s.value), 0);
  return { scale, value: fromHundredths(Math.floor((2 * sum + same.length) / (2 * same.length))), count: same.length };
}
