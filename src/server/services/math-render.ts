// Render teks soal + rumus KaTeX jadi HTML di SERVER, supaya library KaTeX
// (±270 KB) tidak perlu dikirim ke browser peserta.

import type { ExamQuestion, ExamStimulus } from "@/lib/exam";
import { renderMathToHtml, renderRichText } from "@/lib/math-html";
import type { QuestionType } from "@/lib/validation/enums";

export { renderMathToHtml, renderRichText };

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
    html: renderRichText(q.text),
    imageUrl: q.imageUrl,
    options: q.options.map((o) => ({ id: o.id, label: o.label, html: renderMathToHtml(o.text) })),
    categoryLabels: q.type === "pgk_kategori" ? (q.categoryLabels ?? null) : null,
    stimulusId: q.stimulusId ?? null,
  };
}

export function toExamStimulus(s: RawExamStimulus): ExamStimulus {
  return { id: s.id, title: s.title, html: renderRichText(s.content), imageUrl: s.imageUrl };
}
