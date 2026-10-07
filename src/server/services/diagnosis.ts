// Diagnosa kelemahan per subdomain (docs/AI_GENERATION.md §4). Fungsi murni —
// input riwayat ringkasan per attempt, tanpa DB — supaya bisa dites.
//
// - Akurasi dihitung dari ±20 soal TERBARU per subdomain (per attempt utuh,
//   dari yang terbaru mundur) supaya kemajuan cepat terlihat.
// - Status butuh minimal 3 soal; di bawah itu "data belum cukup".
// - Ambang status sama dengan `scoreTone` (docs/UI_UX.md §3).

export type SubtopicRecord = {
  subtopicId: number;
  correct: number;
  total: number;
  /** Waktu attempt selesai. */
  at: Date;
  /** Asal record (opsional, untuk label tren). */
  source?: "test" | "practice";
};

/** Satu titik tren subdomain: hasil satu tes/latihan + akurasi berjalan sesudahnya. */
export type HistoryPoint = {
  at: Date;
  /** Akurasi pada tes/latihan itu saja. */
  percentage: number;
  /** Jumlah soal subdomain ini pada tes/latihan itu. */
  questions: number;
  /** Akurasi jendela ±20 soal terbaru sampai titik ini (dasar status). */
  rolling: number;
  source: "test" | "practice" | null;
};

export type DiagnosisStatus = "insufficient" | "perlu_latihan" | "cukup" | "baik";

export type SubtopicDiagnosis = {
  subtopicId: number;
  /** 0–100 dibulatkan; dihitung dari jendela soal terbaru. */
  accuracy: number;
  /** Jumlah soal di jendela akurasi. */
  windowQuestions: number;
  /** Semua soal subdomain ini yang pernah dikerjakan. */
  totalQuestions: number;
  status: DiagnosisStatus;
  /** Akurasi sebelum percobaan terakhir; null bila belum ada pembanding yang cukup. */
  previousAccuracy: number | null;
  lastTestedAt: Date;
  /** Per tes/latihan, lama → baru, maks. `HISTORY_LIMIT` titik terakhir (bahan grafik tren). */
  history: HistoryPoint[];
};

export const DIAGNOSIS_WINDOW = 20;
export const MIN_QUESTIONS = 3;
export const HISTORY_LIMIT = 20;

export function statusFor(accuracy: number, questions: number): DiagnosisStatus {
  if (questions < MIN_QUESTIONS) return "insufficient";
  if (accuracy >= 75) return "baik";
  if (accuracy >= 50) return "cukup";
  return "perlu_latihan";
}

/** Akurasi dari record terbaru mundur sampai ≥ `window` soal. `records` urut baru → lama. */
function windowAccuracy(records: SubtopicRecord[], window: number) {
  let correct = 0;
  let total = 0;
  for (const r of records) {
    if (total >= window) break;
    correct += r.correct;
    total += r.total;
  }
  return { accuracy: total > 0 ? Math.round((correct / total) * 100) : 0, total };
}

export function diagnose(records: SubtopicRecord[], window = DIAGNOSIS_WINDOW): SubtopicDiagnosis[] {
  const bySubtopic = new Map<number, SubtopicRecord[]>();
  for (const r of records) {
    if (r.total <= 0) continue;
    const list = bySubtopic.get(r.subtopicId) ?? [];
    list.push(r);
    bySubtopic.set(r.subtopicId, list);
  }

  return [...bySubtopic].map(([subtopicId, list]) => {
    const newestFirst = [...list].sort((a, b) => b.at.getTime() - a.at.getTime());
    const current = windowAccuracy(newestFirst, window);
    const before = newestFirst.length > 1 ? windowAccuracy(newestFirst.slice(1), window) : null;
    return {
      subtopicId,
      accuracy: current.accuracy,
      windowQuestions: current.total,
      totalQuestions: list.reduce((sum, r) => sum + r.total, 0),
      status: statusFor(current.accuracy, current.total),
      previousAccuracy: before && before.total >= MIN_QUESTIONS ? before.accuracy : null,
      lastTestedAt: newestFirst[0].at,
      history: [...newestFirst]
        .reverse()
        .map((r, i, chrono) => ({
          at: r.at,
          percentage: Math.round((r.correct / r.total) * 100),
          questions: r.total,
          // Akurasi berjalan = akurasi jendela bila siswa berhenti tepat setelah titik ini.
          rolling: windowAccuracy(chrono.slice(0, i + 1).reverse(), window).accuracy,
          source: r.source ?? null,
        }))
        .slice(-HISTORY_LIMIT),
    };
  });
}

/**
 * Subdomain yang paling perlu dilatih: status Perlu latihan/Cukup, akurasi
 * terendah dulu; seri → yang soalnya lebih banyak diujikan.
 */
export function practicePriorities(diagnoses: SubtopicDiagnosis[], limit = 3): SubtopicDiagnosis[] {
  return diagnoses
    .filter((d) => d.status === "perlu_latihan" || d.status === "cukup")
    .sort((a, b) => a.accuracy - b.accuracy || b.totalQuestions - a.totalQuestions)
    .slice(0, limit);
}
