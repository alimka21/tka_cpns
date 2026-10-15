// Nilai skala attempt: skala dari jenjang paket + rumus konversi aktif
// (app_settings `scoring.conversion`). Dipakai finalize attempt & `db:rescore`.

import { scaleForJenjang, type ScoreScale } from "@/lib/score-scale";
import { conversionVersion } from "@/lib/scoring-config";
import { getSetting } from "@/server/services/app-settings";
import { toScaledScore } from "@/server/services/scoring";

export type ScaledResult = { scoreScale: ScoreScale; scaledScore: string; scoringConfigVersion: string };

/** Buat penghitung dengan rumus yang dibaca SEKALI (konsisten untuk banyak attempt). */
export async function scaledScorer() {
  const config = await getSetting("scoring.conversion");
  return (jenjang: string, raw: number, max: number): ScaledResult => {
    const scoreScale = scaleForJenjang(jenjang);
    const conv = config.scales[scoreScale];
    return { scoreScale, scaledScore: toScaledScore(raw, max, conv), scoringConfigVersion: conversionVersion(config, scoreScale, conv) };
  };
}
