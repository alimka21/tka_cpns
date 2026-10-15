// Ambang kategori capaian dari dua titik potong per skala (diatur admin).
// Regulasi TIDAK menetapkan angkanya (docs/PENSKORAN-DAN-PELAPORAN-TKA.md §2);
// rentang diturunkan dari titik potong supaya selalu menutup seluruh skala
// tanpa celah/tumpang tindih (resolusi 0,01).

import { z } from "zod";
import { SCALE_RANGE, SCORE_SCALES, type AchievementCategory, type ScoreScale } from "@/lib/score-scale";
import { DECIMAL_2, fromHundredths, toHundredths } from "@/lib/scoring-config";

/** "449,5" / "449.5" → "449.50"; null bila bukan desimal ≤ 2 angka di belakang koma. */
export function normalizeDecimal(input: string): string | null {
  const v = input.trim().replace(",", ".");
  return DECIMAL_2.test(v) ? fromHundredths(toHundredths(v)) : null;
}

export const thresholdCutsInput = z.object({
  scale: z.enum(SCORE_SCALES),
  /** Nilai terendah kategori Memadai. */
  memadaiFrom: z.string(),
  /** Nilai terendah kategori Baik. */
  baikFrom: z.string(),
  isOfficial: z.boolean(),
});

export type ThresholdRange = { category: AchievementCategory; minScore: string; maxScore: string };

export function thresholdsFromCuts(scale: ScoreScale, memadaiFrom: string, baikFrom: string): { rows: ThresholdRange[] } | { error: string } {
  const m = normalizeDecimal(memadaiFrom);
  const b = normalizeDecimal(baikFrom);
  if (!m || !b) return { error: "Isi nilai dengan maksimal 2 angka di belakang koma, mis. 450 atau 449,50." };
  const { min, max } = SCALE_RANGE[scale];
  const lo = min * 100;
  const hi = max * 100;
  const mh = toHundredths(m);
  const bh = toHundredths(b);
  if (!(lo < mh && mh < bh && bh <= hi)) {
    return { error: `Harus berlaku ${min} < batas Memadai < batas Baik ≤ ${max}.` };
  }
  return {
    rows: [
      { category: "kurang", minScore: fromHundredths(lo), maxScore: fromHundredths(mh - 1) },
      { category: "memadai", minScore: m, maxScore: fromHundredths(bh - 1) },
      { category: "baik", minScore: b, maxScore: fromHundredths(hi) },
    ],
  };
}
