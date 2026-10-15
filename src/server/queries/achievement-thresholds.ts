// Ambang kategori capaian per skala (tabel achievement_thresholds, diatur admin).

import { db } from "@/server/db";
import { achievementThresholds } from "@/server/db/schema";
import { SCORE_SCALES, type ScoreScale } from "@/lib/score-scale";
import type { ThresholdRow } from "@/server/services/scoring";

export type ScaleThresholds = { rows: ThresholdRow[]; official: boolean };
export type ThresholdsByScale = Record<ScoreScale, ScaleThresholds>;

export async function getThresholdsByScale(): Promise<ThresholdsByScale> {
  const rows = await db.select().from(achievementThresholds);
  const result = Object.fromEntries(SCORE_SCALES.map((s) => [s, { rows: [], official: false }])) as unknown as ThresholdsByScale;
  for (const r of rows) {
    result[r.scoreScale].rows.push({ category: r.category, minScore: r.minScore, maxScore: r.maxScore });
    if (r.isOfficial) result[r.scoreScale].official = true;
  }
  return result;
}
