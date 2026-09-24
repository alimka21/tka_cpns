"use server";

// Pratinjau import Excel: parse + validasi per baris, belum menyimpan apa pun.
// TODO: tambahkan cek sesi admin (Better Auth) dan action konfirmasi yang
// mencocokkan topik/subtopik ke DB lalu insert sebagai draft.

import {
  IMPORT_MAX_BYTES,
  ImportFileError,
  parseImportFile,
} from "@/server/services/question-import";
import type { Difficulty, OptionLabel } from "@/lib/validation/enums";

export type ImportPreviewRow = {
  rowNumber: number;
  topicName: string;
  subtopicName: string;
  questionText: string;
  difficulty: Difficulty;
  answer: OptionLabel;
  optionCount: number;
};

export type ImportPreviewResult =
  | { ok: true; valid: ImportPreviewRow[]; errors: { rowNumber: number; messages: string[] }[] }
  | { ok: false; error: string };

export async function previewQuestionImport(formData: FormData): Promise<ImportPreviewResult> {
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
      valid: result.valid.map((row) => ({
        rowNumber: row.rowNumber,
        topicName: row.topicName,
        subtopicName: row.subtopicName,
        questionText: row.questionText,
        difficulty: row.difficulty,
        answer: row.options.find((o) => o.isCorrect)!.label,
        optionCount: row.options.length,
      })),
    };
  } catch (error) {
    if (error instanceof ImportFileError) return { ok: false, error: error.message };
    throw error;
  }
}
