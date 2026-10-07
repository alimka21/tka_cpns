// Target laporan soal — modul bersama (bukan "use client") supaya bisa dipanggil
// dari server component (halaman hasil/pembahasan) maupun komponen klien.

export type ReportTarget = { questionId: number } | { practiceQuestionId: number };

/** Target laporan dari ReviewItem (soal bank atau Latihan AI). */
export function reportTargetOf(item: { questionId: number; aiPracticeId: number | null }): ReportTarget {
  return item.aiPracticeId != null ? { practiceQuestionId: item.aiPracticeId } : { questionId: item.questionId };
}
