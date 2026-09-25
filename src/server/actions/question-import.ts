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
import { revalidatePath } from "next/cache";
import { inArray } from "drizzle-orm";
import { getAdminSession } from "@/server/auth/session";
import { db } from "@/server/db";
import { stimuli } from "@/server/db/schema";
import { insertQuestion, subtopicIdsByCode } from "@/server/services/question-store";
import { questionInput } from "@/lib/validation/question";
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

export type ImportConfirmResult =
  | { ok: true; questionCount: number; stimulusCount: number; skipped: { rowNumber: number; message: string }[] }
  | { ok: false; error: string };

/**
 * Simpan baris valid sebagai draft. File di-parse ulang di server — hasil
 * pratinjau dari client tidak dipercaya. Kode stimulus di file harus baru;
 * soal yang stimulusnya sudah ada di DB dilewati (dilaporkan).
 */
export async function confirmQuestionImport(formData: FormData): Promise<ImportConfirmResult> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: "Sesi admin berakhir. Silakan masuk lagi." };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0 || file.size > IMPORT_MAX_BYTES || !file.name.toLowerCase().endsWith(".xlsx")) {
    return { ok: false, error: "File tidak valid. Upload ulang file .xlsx (maks. 5 MB)." };
  }

  let parsed;
  try {
    parsed = await parseImportFile(await file.arrayBuffer());
  } catch (error) {
    if (error instanceof ImportFileError) return { ok: false, error: error.message };
    throw error;
  }
  if (parsed.valid.length === 0) return { ok: false, error: "Tidak ada baris valid untuk disimpan." };

  const userId = Number(session.user.id);
  const skipped: { rowNumber: number; message: string }[] = [];

  const saved = await db.transaction(async (tx) => {
    const subtopicIds = await subtopicIdsByCode(tx, [...new Set(parsed.valid.map((r) => r.subdomainCode))]);
    const existing = parsed.stimuli.length
      ? await tx.select({ code: stimuli.code }).from(stimuli).where(inArray(stimuli.code, parsed.stimuli.map((s) => s.code)))
      : [];
    const taken = new Set(existing.map((s) => s.code));

    const stimulusIds = new Map<string, number>();
    for (const st of parsed.stimuli) {
      if (taken.has(st.code)) continue;
      const [{ id }] = await tx
        .insert(stimuli)
        .values({ code: st.code, title: st.title, content: st.content, imageUrl: st.imageUrl, createdBy: userId })
        .$returningId();
      stimulusIds.set(st.code, id);
    }

    let count = 0;
    for (const row of parsed.valid) {
      const subtopicId = subtopicIds.get(row.subdomainCode);
      if (!subtopicId) {
        skipped.push({ rowNumber: row.rowNumber, message: `Subdomain ${row.subdomainCode} belum ada di database (jalankan seed).` });
        continue;
      }
      if (row.stimulusCode && !stimulusIds.has(row.stimulusCode)) {
        skipped.push({ rowNumber: row.rowNumber, message: `Kode stimulus ${row.stimulusCode} sudah dipakai di bank soal — pakai kode baru.` });
        continue;
      }
      const question = questionInput.parse({
        type: row.type,
        subtopicId,
        questionText: row.questionText,
        difficulty: row.difficulty,
        cognitiveLevel: row.cognitiveLevel,
        explanationText: row.explanationText,
        categoryLabels: row.categoryLabels ?? undefined,
        stimulusId: row.stimulusCode ? stimulusIds.get(row.stimulusCode) : null,
        stimulusOrder: row.stimulusOrder,
        status: "draft",
        options: row.options,
      });
      await insertQuestion(tx, question, { generatedBy: "import", userId });
      count += 1;
    }
    return { count, stimulusCount: stimulusIds.size };
  });

  revalidatePath("/admin/soal");
  revalidatePath("/admin/soal/stimulus");
  return { ok: true, questionCount: saved.count, stimulusCount: saved.stimulusCount, skipped };
}
