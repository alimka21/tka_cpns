// Aturan perubahan soal yang sudah dipakai (DECISIONS 2026-09-29). Fungsi
// murni supaya bisa dites tanpa DB; dipanggil updateQuestionAction.

import type { QuestionEditData } from "@/lib/question-bank-types";
import type { QuestionInput } from "@/lib/validation/question";

/**
 * - Sudah dijawab siswa → bentuk, jumlah opsi, kunci, pasangan kategori,
 *   subdomain & stimulus tidak boleh berubah (hasil lama tetap konsisten).
 * - Sudah masuk paket → stimulus & urutan grup tidak boleh berubah.
 * @returns pesan error, atau `null` bila perubahan boleh.
 */
export function editLockViolation(
  current: Pick<QuestionEditData, "type" | "subdomainCode" | "categoryLabels" | "stimulusId" | "stimulusOrder" | "options" | "usage">,
  next: QuestionInput,
  nextSubdomainCode: string,
): string | null {
  const answered = current.usage.answers > 0;
  if (answered) {
    const sameKeys =
      next.options.length === current.options.length &&
      next.options.every((o, i) =>
        next.type === "pgk_kategori"
          ? (o.correctCategory ?? null) === current.options[i].correctCategory
          : o.isCorrect === current.options[i].isCorrect,
      );
    const sameLabels = next.type !== "pgk_kategori" || next.categoryLabels.join("/") === current.categoryLabels?.join("/");
    if (next.type !== current.type || !sameKeys || !sameLabels || nextSubdomainCode !== current.subdomainCode) {
      return "Soal ini sudah dijawab siswa — bentuk, jumlah opsi, kunci, dan subdomain tidak bisa diubah. Buat soal baru bila perlu.";
    }
  }
  const stimulusChanged = (next.stimulusId ?? null) !== current.stimulusId || (next.stimulusOrder ?? null) !== current.stimulusOrder;
  if ((answered || current.usage.packages > 0) && stimulusChanged) {
    return "Soal ini sudah dipakai di paket tes — stimulus & urutan grup tidak bisa diubah.";
  }
  return null;
}
