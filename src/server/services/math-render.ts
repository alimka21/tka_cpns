// Render teks soal + rumus KaTeX jadi HTML di SERVER, supaya library KaTeX
// (±270 KB) tidak perlu dikirim ke browser peserta.

import katex from "katex";
import type { ExamQuestion, ExamStimulus } from "@/lib/exam";
import type { QuestionType } from "@/lib/validation/enums";

// $$...$$ (blok) atau $...$ (inline).
const MATH_PATTERN = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
}

/** Teks biasa di-escape; hanya bagian rumus yang jadi HTML KaTeX. */
export function renderMathToHtml(text: string) {
  return text
    .split(MATH_PATTERN)
    .map((part, i) => {
      if (i % 2 === 0) return escapeHtml(part);
      const displayMode = part.startsWith("$$");
      const tex = part.slice(displayMode ? 2 : 1, displayMode ? -2 : -1);
      return katex.renderToString(tex, { displayMode, throwOnError: false, trust: false });
    })
    .join("");
}

export type RawExamQuestion = {
  id: number;
  type: QuestionType;
  text: string;
  imageUrl: string | null;
  options: { id: number; label: string; text: string }[];
  categoryLabels?: [string, string] | null;
  stimulusId?: number | null;
};

export type RawExamStimulus = { id: number; title: string; content: string; imageUrl: string | null };

/** Ubah soal mentah (tanpa kunci) jadi bentuk siap-kirim ke client. */
export function toExamQuestion(q: RawExamQuestion): ExamQuestion {
  return {
    id: q.id,
    type: q.type,
    html: renderMathToHtml(q.text),
    imageUrl: q.imageUrl,
    options: q.options.map((o) => ({ id: o.id, label: o.label, html: renderMathToHtml(o.text) })),
    categoryLabels: q.type === "pgk_kategori" ? (q.categoryLabels ?? null) : null,
    stimulusId: q.stimulusId ?? null,
  };
}

export function toExamStimulus(s: RawExamStimulus): ExamStimulus {
  return { id: s.id, title: s.title, html: renderMathToHtml(s.content), imageUrl: s.imageUrl };
}
