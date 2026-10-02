// Tipe bersama Impor PDF (server ↔ halaman admin). Tanpa logika.

import type { QuestionType } from "@/lib/validation/enums";

/** Area gambar di halaman PDF: halaman 1-based, kotak [ymin, xmin, ymax, xmax] skala 0–1000. */
export type PdfCrop = { page: number; box: [number, number, number, number] };

export type PdfDraftOption = { text: string; isCorrect: boolean; category: string | null; html: string };

export type PdfDraftStimulus = { key: string; title: string; content: string; html: string; image: PdfCrop | null };

export type PdfDraftQuestion = {
  /** Nomor urut di dokumen (1-based). */
  number: number;
  stimulusKey: string | null;
  subtopicCode: string;
  subtopicName: string;
  type: QuestionType;
  text: string;
  html: string;
  options: PdfDraftOption[];
  categoryLabels: [string, string] | null;
  explanation: string;
  explanationHtml: string;
  cognitiveLevel: string | null;
  difficulty: "easy" | "medium" | "hard";
  image: PdfCrop | null;
  /** "pdf" = kunci tertera di dokumen; "ai" = ditentukan Gemini (wajib dicek). */
  keySource: "pdf" | "ai";
  /** Kosong = siap disimpan. */
  errors: string[];
};

export type PdfExtractResult =
  | { ok: true; title: string; stimuli: PdfDraftStimulus[]; questions: PdfDraftQuestion[]; warnings: string[] }
  | { ok: false; error: string };
