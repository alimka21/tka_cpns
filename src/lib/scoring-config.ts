// Rumus konversi skor mentah → nilai skala (docs/PENSKORAN-DAN-PELAPORAN-TKA.md §1).
// Regulasi TIDAK mempublikasikan rumus resmi (IRT/equating), jadi ini
// ketetapan platform: kurva linear sepotong-sepotong lewat titik jangkar
// (persen skor mentah → nilai). Default = garis lurus dari batas bawah ke
// batas atas skala. Disimpan di app_settings `scoring.conversion` (admin bisa
// mengubah); setiap attempt menyimpan versi rumus yang dipakai.
// Aman diimpor client (form admin) — tanpa akses DB.

import { z } from "zod";
import { SCALE_RANGE, SCORE_SCALES, type ScoreScale } from "@/lib/score-scale";

/** Desimal maksimal 2 angka di belakang titik, mis. "632.5" / "200.00". */
export const DECIMAL_2 = /^\d{1,3}(\.\d{1,2})?$/;

/** "632.5" → 63250 (perseratus, bilangan bulat — tanpa float). */
export function toHundredths(value: string): number {
  const [int, frac = ""] = value.split(".");
  return Number(int) * 100 + Number(frac.padEnd(2, "0"));
}

/** 63250 → "632.50". */
export function fromHundredths(h: number): string {
  return `${Math.floor(h / 100)}.${String(h % 100).padStart(2, "0")}`;
}

const anchorSchema = z.object({
  /** Persen skor mentah (bilangan bulat 0–100). */
  raw: z.number().int().min(0).max(100),
  /** Nilai skala pada titik ini, maks. 2 desimal. */
  scaled: z.string().regex(DECIMAL_2, "Nilai maksimal 2 angka di belakang koma."),
});
export type ConversionAnchor = z.infer<typeof anchorSchema>;

const scaleConfigSchema = z.object({ anchors: z.array(anchorSchema).min(2).max(11) });
export type ScaleConversion = z.infer<typeof scaleConfigSchema>;

/** Validasi kurva satu skala: mulai 0% = batas bawah, berakhir 100% = batas atas, naik. */
export function conversionIssues(scale: ScoreScale, conv: ScaleConversion): string[] {
  const { min, max } = SCALE_RANGE[scale];
  const a = conv.anchors;
  const issues: string[] = [];
  if (a[0]?.raw !== 0 || toHundredths(a[0].scaled) !== min * 100) issues.push(`Titik pertama harus 0% → ${min}.`);
  const last = a[a.length - 1];
  if (last?.raw !== 100 || toHundredths(last.scaled) !== max * 100) issues.push(`Titik terakhir harus 100% → ${max}.`);
  for (let i = 1; i < a.length; i++) {
    if (a[i].raw <= a[i - 1].raw) issues.push("Persen skor mentah harus berurutan naik tanpa kembar.");
    if (toHundredths(a[i].scaled) < toHundredths(a[i - 1].scaled)) issues.push("Nilai skala tidak boleh turun saat skor mentah naik.");
  }
  if (a.some((p) => toHundredths(p.scaled) < min * 100 || toHundredths(p.scaled) > max * 100)) issues.push(`Nilai harus di rentang ${min}–${max}.`);
  return [...new Set(issues)];
}

const scalesSchema = z
  .object({ "0_100": scaleConfigSchema, "200_800": scaleConfigSchema })
  .superRefine((scales, ctx) => {
    for (const scale of SCORE_SCALES) {
      for (const message of conversionIssues(scale, scales[scale])) ctx.addIssue({ code: "custom", path: [scale], message });
    }
  });
export type ConversionScales = z.infer<typeof scalesSchema>;

export const scoringConversionSchema = z.object({
  /** Naik 1 setiap admin menyimpan rumus baru. */
  version: z.number().int().min(1),
  scales: scalesSchema,
  /** Rumus-rumus sebelumnya, supaya nilai lama tetap bisa ditelusuri asalnya. */
  history: z
    .array(z.object({ version: z.number().int(), scales: scalesSchema, replacedAt: z.string() }))
    .max(50)
    .default([]),
});
export type ScoringConversion = z.infer<typeof scoringConversionSchema>;

const line = (scale: ScoreScale): ScaleConversion => ({
  anchors: [
    { raw: 0, scaled: fromHundredths(SCALE_RANGE[scale].min * 100) },
    { raw: 100, scaled: fromHundredths(SCALE_RANGE[scale].max * 100) },
  ],
});

/** nilai = batas bawah + (mentah / maksimum) × (batas atas − batas bawah). */
export const DEFAULT_SCORING_CONVERSION: ScoringConversion = {
  version: 1,
  scales: { "0_100": line("0_100"), "200_800": line("200_800") },
  history: [],
};

/** FNV-1a 32-bit — sidik jari isi rumus (deterministik, tanpa crypto). */
function fingerprint(text: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

/**
 * Penanda versi yang disimpan di `attempts.scoring_config_version`, mis.
 * "v1-9a3f…": nomor versi + sidik jari kurva skala yang dipakai, supaya
 * nilai lama tetap bisa dicocokkan ke rumusnya (lihat `history`).
 */
export function conversionVersion(config: Pick<ScoringConversion, "version">, scale: ScoreScale, conv: ScaleConversion) {
  return `v${config.version}-${scale}-${fingerprint(JSON.stringify(conv.anchors.map((a) => [a.raw, toHundredths(a.scaled)])))}`;
}
