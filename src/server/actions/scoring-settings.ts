"use server";

// Pengaturan penskoran (admin): ambang kategori capaian & rumus konversi
// skor mentah → nilai skala (docs/PENSKORAN-DAN-PELAPORAN-TKA.md §1–§2).

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { normalizeDecimal, thresholdCutsInput, thresholdsFromCuts } from "@/lib/achievement-thresholds";
import { SCORE_SCALES } from "@/lib/score-scale";
import { scoringConversionSchema } from "@/lib/scoring-config";
import { getAdminSession } from "@/server/auth/session";
import { db } from "@/server/db";
import { achievementThresholds } from "@/server/db/schema";
import { getSetting, setSetting } from "@/server/services/app-settings";

type Result = { ok: true } | { ok: false; error: string };
const NOT_ADMIN = { ok: false as const, error: "Sesi admin berakhir. Silakan masuk lagi." };

function revalidateScores() {
  revalidatePath("/admin/pengaturan");
  // Kategori dihitung saat ditampilkan → semua halaman nilai ikut berubah.
  revalidatePath("/", "layout");
}

/** Simpan ambang satu skala (ganti ketiga kategori sekaligus). */
export async function setAchievementThresholdsAction(input: unknown): Promise<Result> {
  const session = await getAdminSession();
  if (!session) return NOT_ADMIN;
  const parsed = thresholdCutsInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Data tidak valid." };
  const { scale, memadaiFrom, baikFrom, isOfficial } = parsed.data;
  const built = thresholdsFromCuts(scale, memadaiFrom, baikFrom);
  if ("error" in built) return { ok: false, error: built.error };
  const userId = Number(session.user.id);
  await db.transaction(async (tx) => {
    await tx.delete(achievementThresholds).where(eq(achievementThresholds.scoreScale, scale));
    await tx.insert(achievementThresholds).values(built.rows.map((r) => ({ ...r, scoreScale: scale, isOfficial, updatedBy: userId })));
  });
  revalidateScores();
  return { ok: true };
}

/** Kosongkan ambang satu skala → kategori tidak ditampilkan lagi. */
export async function clearAchievementThresholdsAction(scale: unknown): Promise<Result> {
  if (!(await getAdminSession())) return NOT_ADMIN;
  const parsed = z.enum(SCORE_SCALES).safeParse(scale);
  if (!parsed.success) return { ok: false, error: "Skala tidak valid." };
  await db.delete(achievementThresholds).where(eq(achievementThresholds.scoreScale, parsed.data));
  revalidateScores();
  return { ok: true };
}

const anchorsInput = z.array(z.object({ raw: z.coerce.number().int().min(0).max(100), scaled: z.string() })).min(2).max(11);

/**
 * Simpan rumus konversi baru: versi naik 1 dan rumus lama masuk `history`.
 * Hanya berlaku untuk tes yang selesai SETELAH disimpan — nilai lama beku.
 */
export async function setScoringConversionAction(input: unknown): Promise<Result> {
  const session = await getAdminSession();
  if (!session) return NOT_ADMIN;
  const parsed = z.object({ "0_100": anchorsInput, "200_800": anchorsInput }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Titik konversi tidak valid (2–11 titik, persen 0–100)." };
  const scales = {} as Record<(typeof SCORE_SCALES)[number], { anchors: { raw: number; scaled: string }[] }>;
  for (const scale of SCORE_SCALES) {
    const anchors = [];
    for (const a of parsed.data[scale]) {
      const scaled = normalizeDecimal(a.scaled);
      if (!scaled) return { ok: false, error: "Nilai skala maksimal 2 angka di belakang koma." };
      anchors.push({ raw: a.raw, scaled });
    }
    scales[scale] = { anchors };
  }
  const current = await getSetting("scoring.conversion");
  if (JSON.stringify(current.scales) === JSON.stringify(scales)) return { ok: true };
  const next = scoringConversionSchema.safeParse({
    version: current.version + 1,
    scales,
    history: [{ version: current.version, scales: current.scales, replacedAt: new Date().toISOString() }, ...current.history].slice(0, 50),
  });
  if (!next.success) return { ok: false, error: next.error.issues[0].message };
  await setSetting("scoring.conversion", next.data, Number(session.user.id));
  revalidatePath("/admin/pengaturan");
  return { ok: true };
}
