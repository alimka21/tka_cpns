"use server";

// Pratinjau import Excel: parse + validasi per baris, belum menyimpan apa pun.
// Kode subdomain & level kognitif sudah dicocokkan ke kerangka asesmen.
// TODO: action konfirmasi yang memetakan kode subdomain → subtopics.id lalu
// insert sebagai draft.

import {
  IMPORT_MAX_BYTES,
  ImportFileError,
  parseImportFile,
} from "@/server/services/question-import";
import { getAdminSession } from "@/server/auth/session";
import type { Difficulty, QuestionType } from "@/lib/validation/enums";

export type ImportPreviewRow = {
  rowNumber: number;
  subdomainCode: string;
  jenjang: string;
  subjectName: string;
  domainName: string;
  subdomainName: string;
  cognitiveLevel: string | null;
  questionText: string;
  difficulty: Difficulty;
  type: QuestionType;
  /** Ringkasan kunci siap tampil: "D", "B, D", atau "B, S, B". */
  answer: string;
  optionCount: number;
  stimulusCode: string | null;
  stimulusOrder: number | null;
};

export type ImportPreviewStimulus = { code: string; title: string; questionCount: number };

export type ImportPreviewError = { rowNumber: number; messages: string[]; sheet?: "Soal" | "Stimulus" };

export type ImportPreviewResult =
  | { ok: true; valid: ImportPreviewRow[]; stimuli: ImportPreviewStimulus[]; errors: ImportPreviewError[] }
  | { ok: false; error: string };

function shortCategory(category: string | null) {
  return { Benar: "B", Salah: "S", Sesuai: "S", "Tidak Sesuai": "TS" }[category ?? ""] ?? "?";
}

export async function previewQuestionImport(formData: FormData): Promise<ImportPreviewResult> {
  // Server action bisa dipanggil langsung — jangan andalkan proteksi layout.
  if (!(await getAdminSession())) return { ok: false, error: "Sesi admin berakhir. Silakan masuk lagi." };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Pilih file .xlsx terlebih dahulu." };
  }
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    return { ok: false, error: "Format file harus .xlsx (Excel)." };
  }
  if (file.size > IMPORT_MAX_BYTES) {
    return { ok: false, error: "Ukuran file maksimal 5 MB." };
  }

  try {
    const result = await parseImportFile(await file.arrayBuffer());
    return {
      ok: true,
      errors: result.errors,
      stimuli: result.stimuli.map((st) => ({ code: st.code, title: st.title, questionCount: st.questionCount })),
      valid: result.valid.map((row) => ({
        rowNumber: row.rowNumber,
        subdomainCode: row.subdomainCode,
        jenjang: row.jenjang,
        subjectName: row.subjectName,
        domainName: row.domainName,
        subdomainName: row.subdomainName,
        cognitiveLevel: row.cognitiveLevel,
        questionText: row.questionText,
        difficulty: row.difficulty,
        type: row.type,
        answer:
          row.type === "pgk_kategori"
            ? row.options.map((o) => shortCategory(o.correctCategory)).join(", ")
            : row.options.filter((o) => o.isCorrect).map((o) => o.label).join(", "),
        optionCount: row.options.length,
        stimulusCode: row.stimulusCode,
        stimulusOrder: row.stimulusOrder,
      })),
    };
  } catch (error) {
    if (error instanceof ImportFileError) return { ok: false, error: error.message };
    throw error;
  }
}
