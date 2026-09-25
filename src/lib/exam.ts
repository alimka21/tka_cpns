// Tipe & helper yang aman dikirim ke client selama ujian.
// SENGAJA tidak ada isCorrect / correctCategory — kunci tetap di server.

import type { AnswerResponse } from "@/lib/validation/attempt";
import type { QuestionType } from "@/lib/validation/enums";

export type { AnswerResponse };

/** `html` = hasil `renderMathToHtml` di server (teks sudah di-escape). */
export type ExamOption = { id: number; label: string; html: string };

/** Stimulus soal grup — dikirim sekali, dirujuk soal lewat `stimulusId`. */
export type ExamStimulus = { id: number; title: string; html: string; imageUrl: string | null };

export type ExamQuestion = {
  id: number;
  type: QuestionType;
  html: string;
  imageUrl: string | null;
  /** PG/MCMA: opsi jawaban. PGK Kategori: pernyataan. */
  options: ExamOption[];
  /** Hanya PGK Kategori, mis. ["Benar", "Salah"]. */
  categoryLabels: [string, string] | null;
  stimulusId: number | null;
};

export type ExamAnswerState = {
  response: AnswerResponse | null;
  isFlagged: boolean;
};

export type AnswerStatus = "blank" | "partial" | "complete";

/**
 * Status kelengkapan jawaban untuk navigator — cermin `scoring.ts` tanpa
 * kunci jawaban. PGK Kategori baru sebagian = "partial" (belum lengkap).
 */
export function answerStatus(question: ExamQuestion, response: AnswerResponse | null | undefined): AnswerStatus {
  if (!response || response.type !== question.type) return "blank";
  switch (response.type) {
    case "pg":
      return "complete";
    case "pgk_mcma":
      return response.optionIds.length > 0 ? "complete" : "blank";
    case "pgk_kategori":
      if (response.answers.length === 0) return "blank";
      return response.answers.length >= question.options.length ? "complete" : "partial";
  }
}

export type SaveAnswerFn = (input: {
  questionId: number;
  response: AnswerResponse | null;
  isFlagged: boolean;
}) => Promise<{ ok: boolean; error?: string }>;

export type SubmitAttemptFn = () => Promise<{ ok: boolean; error?: string; redirectTo?: string }>;

export function remainingMs(endsAtMs: number, nowMs: number) {
  return Math.max(0, endsAtMs - nowMs);
}

/** 3725000 → "01:02:05", 125000 → "02:05" */
export function formatDuration(ms: number) {
  const totalSeconds = Math.ceil(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
