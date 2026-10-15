// Skala nilai per jenjang (docs/PENSKORAN-DAN-PELAPORAN-TKA.md §1).
// Dipakai skema DB, service skor, dan tampilan — satu sumber kebenaran.

export const SCORE_SCALES = ["0_100", "200_800"] as const;
export type ScoreScale = (typeof SCORE_SCALES)[number];

/** Rentang nilai tiap skala (dalam satuan nilai, bukan perseratus). */
export const SCALE_RANGE: Record<ScoreScale, { min: number; max: number }> = {
  "0_100": { min: 0, max: 100 },
  "200_800": { min: 200, max: 800 },
};

export const SCALE_LABEL: Record<ScoreScale, string> = { "0_100": "0–100", "200_800": "200–800" };

/** SD & SMP → 0–100; SMA (dan SMK, belum didukung) → 200–800. */
export function scaleForJenjang(jenjang: string): ScoreScale {
  return jenjang === "SMA" || jenjang === "SMK" ? "200_800" : "0_100";
}

export const ACHIEVEMENT_CATEGORIES = ["baik", "memadai", "kurang"] as const;
export type AchievementCategory = (typeof ACHIEVEMENT_CATEGORIES)[number];
export const ACHIEVEMENT_LABEL: Record<AchievementCategory, string> = { baik: "Baik", memadai: "Memadai", kurang: "Kurang" };
