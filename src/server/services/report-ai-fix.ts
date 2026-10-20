// "Perbaiki dengan AI" di halaman Laporan Soal: Gemini (API key milik admin) menelaah soal
// bank berdasarkan laporan siswa + catatan admin, lalu mengusulkan perbaikan. Usulan TIDAK
// disimpan otomatis — admin meninjau & menerapkannya lewat updateQuestionAction.

import { z } from "zod";
import { REPORT_REASON_LABEL } from "@/lib/report-reasons";
import type { QuestionEditData } from "@/lib/question-bank-types";
import { OPTION_LABELS } from "@/lib/validation/enums";
import { questionInput } from "@/lib/validation/question";
import type { ReportReason } from "@/server/db/schema";

const TYPE_LABEL: Record<string, string> = {
  pg: "PG sederhana (tepat satu jawaban benar)",
  pgk_mcma: "PG kompleks MCMA (lebih dari satu jawaban benar, minimal 1 dan tidak semua opsi)",
  pgk_kategori: "PG kompleks Kategori (setiap pernyataan diberi kategori)",
};

export type FixContext = {
  question: Pick<QuestionEditData, "type" | "questionText" | "imageUrl" | "categoryLabels" | "explanationText" | "options" | "difficulty" | "cognitiveLevel">;
  subject: string;
  jenjang: string;
  subdomain: string;
  stimulus: { title: string; content: string } | null;
  reports: { reason: ReportReason; note: string | null }[];
  adminNote: string;
  /** Soal sudah dijawab siswa → kunci tidak boleh berubah. */
  keysLocked: boolean;
};

/** Prompt telaah + perbaikan soal (bahasa Indonesia, output JSON). */
export function buildFixPrompt(c: FixContext) {
  const q = c.question;
  const opts = q.options
    .map((o, i) => {
      const key = q.type === "pgk_kategori" ? `kunci: ${o.correctCategory ?? "-"}` : o.isCorrect ? "KUNCI" : "bukan kunci";
      return `${OPTION_LABELS[i]}. ${o.text}   [${key}]`;
    })
    .join("\n");
  const reports = c.reports.map((r, i) => `${i + 1}. ${REPORT_REASON_LABEL[r.reason]}${r.note ? ` — "${r.note}"` : ""}`).join("\n");
  return [
    `Kamu penelaah soal Tes Kemampuan Akademik (TKA) ${c.jenjang} mata pelajaran ${c.subject}, subtopik "${c.subdomain}".`,
    `Siswa melaporkan soal di bawah. Tugasmu: (1) nilai apakah laporan itu valid dengan memeriksa soal secara teliti (hitung ulang bila soal hitungan); (2) bila ada masalah, perbaiki soal SEMINIMAL mungkin agar benar, jelas, tidak ambigu, dan sesuai kunci; (3) bila tidak ada masalah, kembalikan soal apa adanya dan jelaskan alasannya.`,
    "",
    "ATURAN:",
    `- Bentuk soal tetap: ${TYPE_LABEL[q.type]}. Jumlah opsi/pernyataan tetap ${q.options.length}, urutan tetap.`,
    q.type === "pgk_kategori" ? `- Kategori yang boleh dipakai hanya: "${q.categoryLabels?.[0]}" atau "${q.categoryLabels?.[1]}".` : "",
    c.keysLocked
      ? "- KUNCI JAWABAN TIDAK BOLEH DIUBAH (soal sudah dijawab siswa). Bila kunci memang salah, perbaiki teks soal/opsi agar kunci yang ada menjadi benar; bila tidak mungkin, jelaskan di analisis dan sarankan admin membuat soal baru."
      : "- Kunci jawaban boleh diubah bila memang salah.",
    "- Pertahankan format: rumus KaTeX dalam $...$, **tebal**, tabel markdown, baris baru. Jangan menambahkan sapaan atau catatan di dalam teks soal.",
    "- Pembahasan berbahasa Indonesia, runtut, menjelaskan mengapa kunci benar dan pengecoh salah.",
    q.imageUrl ? "- Soal memiliki gambar yang tidak dapat kamu lihat; jangan mengubah informasi yang bergantung pada gambar kecuali laporan menunjukkannya dengan jelas." : "",
    "",
    c.stimulus ? `STIMULUS (bacaan bersama, hanya konteks — jangan diubah):\nJudul: ${c.stimulus.title}\n${c.stimulus.content}\n` : "",
    `SOAL:\n${q.questionText}`,
    "",
    `OPSI:\n${opts}`,
    "",
    `PEMBAHASAN SAAT INI:\n${q.explanationText || "(kosong)"}`,
    "",
    `LAPORAN SISWA:\n${reports || "(tidak ada keterangan)"}`,
    "",
    `CATATAN ADMIN:\n${c.adminNote.trim() || "(tidak ada)"}`,
    "",
    "Balas HANYA JSON dengan bentuk:",
    `{"reportValid": boolean, "analysis": "analisis singkat (maks 6 kalimat)", "changesSummary": "daftar singkat perubahan, atau 'Tidak ada perubahan'", "questionText": "...", "options": [{"text": "...", ${q.type === "pgk_kategori" ? '"correctCategory": "..."' : '"isCorrect": true/false'}}], "explanationText": "..."}`,
  ]
    .filter((l) => l !== "")
    .join("\n");
}

const aiOutput = z.object({
  reportValid: z.boolean(),
  analysis: z.string().trim().min(1).max(3000),
  changesSummary: z.string().trim().max(2000).default(""),
  questionText: z.string().trim().min(1).max(10_000),
  options: z.array(z.object({ text: z.string().trim().min(1).max(2000), isCorrect: z.boolean().optional(), correctCategory: z.string().trim().nullish() })),
  explanationText: z.string().trim().min(1).max(10_000),
});

export type FixSuggestion = {
  reportValid: boolean;
  analysis: string;
  changesSummary: string;
  questionText: string;
  options: { text: string; isCorrect: boolean; correctCategory: string | null }[];
  explanationText: string;
  /** AI mencoba mengubah kunci padahal terkunci → kunci dikembalikan ke semula. */
  keyChangeIgnored: boolean;
};

/**
 * Validasi output Gemini: bentuk JSON, jumlah opsi sama, kunci terkunci dihormati, dan aturan
 * bentuk soal (questionInput) terpenuhi. Mengembalikan pesan error bila tidak bisa dipakai.
 */
export function parseFixSuggestion(raw: unknown, c: Pick<FixContext, "question" | "keysLocked">): FixSuggestion | { error: string } {
  const parsed = aiOutput.safeParse(raw);
  if (!parsed.success) return { error: "Format jawaban AI tidak sesuai. Coba minta saran lagi." };
  const out = parsed.data;
  const q = c.question;
  if (out.options.length !== q.options.length) return { error: `AI mengubah jumlah opsi (${out.options.length}, seharusnya ${q.options.length}). Coba minta saran lagi.` };

  const kategori = q.type === "pgk_kategori";
  let options = out.options.map((o) => ({
    text: o.text,
    isCorrect: kategori ? false : Boolean(o.isCorrect),
    correctCategory: kategori ? (o.correctCategory ?? null) : null,
  }));
  const sameKeys = options.every((o, i) => (kategori ? o.correctCategory === q.options[i].correctCategory : o.isCorrect === q.options[i].isCorrect));
  let keyChangeIgnored = false;
  if (c.keysLocked && !sameKeys) {
    keyChangeIgnored = true;
    options = options.map((o, i) => ({ ...o, isCorrect: q.options[i].isCorrect, correctCategory: q.options[i].correctCategory }));
  }

  const check = questionInput.safeParse({
    type: q.type,
    subtopicId: 1,
    questionText: out.questionText,
    difficulty: q.difficulty,
    cognitiveLevel: q.cognitiveLevel,
    explanationText: out.explanationText,
    categoryLabels: q.categoryLabels ?? undefined,
    options: options.map((o, i) => ({ label: OPTION_LABELS[i], optionText: o.text, isCorrect: o.isCorrect, correctCategory: o.correctCategory })),
  });
  if (!check.success) return { error: `Saran AI melanggar aturan soal: ${check.error.issues[0].message}. Coba minta saran lagi.` };

  return { ...out, options, keyChangeIgnored };
}
