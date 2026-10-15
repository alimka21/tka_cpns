// Bangun ScoreView (lib/score-display) dari baris attempt — satu-satunya
// tempat nilai tampilan dihitung (tidak ada lagi `total/max*100` di query).

import { scalePosition, type ScoreView } from "@/lib/score-display";
import { scaleForJenjang, SCORE_SCALES, type ScoreScale } from "@/lib/score-scale";
import { DEFAULT_SCORING_CONVERSION } from "@/lib/scoring-config";
import type { ThresholdsByScale } from "@/server/queries/achievement-thresholds";
import { achievementCategory, isIstimewa, toScaledScore } from "@/server/services/scoring";

export type ScoredRow = {
  scoreScale: ScoreScale | null;
  scaledScore: string | null;
  totalScore: number | null;
  maxScore: number | null;
  jenjang: string;
};

/**
 * Nilai beku dari attempt; attempt lama yang belum diisi `db:rescore`
 * dihitung sementara dengan rumus default (sama dengan yang akan dibekukan).
 */
export function buildScoreView(row: ScoredRow, thresholds: ThresholdsByScale | null): ScoreView {
  const scale = row.scoreScale && (SCORE_SCALES as readonly string[]).includes(row.scoreScale) ? row.scoreScale : scaleForJenjang(row.jenjang);
  const value = row.scaledScore ?? toScaledScore(row.totalScore ?? 0, row.maxScore ?? 0, DEFAULT_SCORING_CONVERSION.scales[scale]);
  return {
    scale,
    value,
    position: scalePosition(value, scale),
    category: thresholds ? achievementCategory(value, thresholds[scale].rows) : null,
    istimewa: isIstimewa(value, scale),
  };
}
