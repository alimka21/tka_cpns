"use server";

// Pratinjau import Excel: parse + validasi per baris, belum menyimpan apa pun.
// Kode subdomain & level kognitif sudah dicocokkan ke kerangka asesmen.
// TODO: tambahkan cek sesi admin (Better Auth) dan action konfirmasi yang
// memetakan kode subdomain → subtopics.id lalu insert sebagai draft.

import {
  IMPORT_MAX_BYTES,
  ImportFileError,
  parseImportFile,
} from "@/server/services/question-import";
import type { Difficulty, OptionLabel } from "@/lib/validation/enums";

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
        subdomainCode: row.subdomainCode,
        jenjang: row.jenjang,
        subjectName: row.subjectName,
        domainName: row.domainName,
        subdomainName: row.subdomainName,
        cognitiveLevel: row.cognitiveLevel,
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
