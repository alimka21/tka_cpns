// Validasi & pemetaan output JSON Gemini → QuestionInput (docs/AI_GENERATION.md §3).
// Fungsi murni supaya bisa dites dengan output AI palsu tanpa memanggil Gemini.
// Tiap soal divalidasi sendiri: soal rusak dibuang, sisanya tetap dipakai.

import katex from "katex";
import { z } from "zod";
import { CATEGORY_PAIRS, OPTION_LABELS, type Difficulty, type QuestionType } from "@/lib/validation/enums";
import { questionInput, type QuestionInput } from "@/lib/validation/question";

const aiOption = z.object({
  text: z.string(),
  isCorrect: z.boolean().optional(),
  category: z.string().optional(),
});

const aiQuestion = z.object({
  questionText: z.string(),
  options: z.array(aiOption),
  categoryLabels: z.array(z.string()).optional(),
  explanation: z.string(),
});

export const aiOutputEnvelope = z.object({ questions: z.array(z.unknown()) });

export type AiMappingContext = {
  type: QuestionType;
  subtopicId: number;
  difficulty: Difficulty;
  cognitiveLevel: string | null;
  imageUrl?: string | null;
  /** Teks soal yang sudah ada (bank subtopik ini, soal asal) — untuk cegah duplikat. */
  existingTexts: string[];
};

export type AiMappingResult = { valid: QuestionInput[]; rejected: string[] };

/** Normalisasi untuk deteksi duplikat: huruf kecil, tanpa tanda baca & spasi ganda. */
export function normalizeText(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

const MATH = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;

/** Semua rumus $...$ / $$...$$ harus bisa dirender KaTeX. */
export function mathRenders(text: string) {
  for (const m of text.matchAll(MATH)) {
    try {
      katex.renderToString(m[1] ?? m[2], { displayMode: Boolean(m[1]), throwOnError: true });
    } catch {
      return false;
    }
  }
  return true;
}

function matchPair(labels: string[] | undefined) {
  if (!labels || labels.length !== 2) return CATEGORY_PAIRS[0];
  const norm = labels.map((l) => l.trim().toLowerCase());
  return CATEGORY_PAIRS.find((p) => p[0].toLowerCase() === norm[0] && p[1].toLowerCase() === norm[1]) ?? null;
}

export function mapAiQuestions(raw: unknown, ctx: AiMappingContext): AiMappingResult {
  const envelope = aiOutputEnvelope.safeParse(raw);
  if (!envelope.success) return { valid: [], rejected: ["Format output AI tidak sesuai (harus { questions: [...] })."] };

  const seen = new Set(ctx.existingTexts.map(normalizeText));
  const valid: QuestionInput[] = [];
  const rejected: string[] = [];

  envelope.data.questions.forEach((item, i) => {
    const n = `Soal AI #${i + 1}`;
    const parsed = aiQuestion.safeParse(item);
    if (!parsed.success) return rejected.push(`${n}: struktur tidak lengkap.`);
    const q = parsed.data;

    const pair = ctx.type === "pgk_kategori" ? matchPair(q.categoryLabels) : null;
    if (ctx.type === "pgk_kategori" && !pair) return rejected.push(`${n}: pasangan kategori tidak sah.`);

    const options = q.options.map((o, k) => {
      const category = pair ? pair.find((p) => p.toLowerCase() === o.category?.trim().toLowerCase()) ?? null : null;
      return {
        label: OPTION_LABELS[k] ?? "E",
        optionText: o.text.trim(),
        isCorrect: ctx.type === "pgk_kategori" ? false : Boolean(o.isCorrect),
        correctCategory: category,
      };
    });
    if (q.options.length > OPTION_LABELS.length) return rejected.push(`${n}: opsi terlalu banyak.`);

    const input = questionInput.safeParse({
      type: ctx.type,
      subtopicId: ctx.subtopicId,
      questionText: q.questionText.trim(),
      imageUrl: ctx.imageUrl ?? null,
      difficulty: ctx.difficulty,
      cognitiveLevel: ctx.cognitiveLevel,
      status: "pending_review",
      explanationText: q.explanation.trim(),
      categoryLabels: pair ? [...pair] : undefined,
      options,
    });
    if (!input.success) return rejected.push(`${n}: ${input.error.issues[0].message}.`);

    const texts = options.map((o) => normalizeText(o.optionText));
    if (new Set(texts).size !== texts.length) return rejected.push(`${n}: ada opsi yang sama.`);
    if (options.some((o) => o.optionText.length > 500) || q.questionText.trim().length < 10) {
      return rejected.push(`${n}: panjang teks tidak wajar.`);
    }
    if (!q.explanation.trim()) return rejected.push(`${n}: pembahasan kosong.`);
    if (![q.questionText, q.explanation, ...options.map((o) => o.optionText)].every(mathRenders)) {
      return rejected.push(`${n}: rumus KaTeX tidak bisa dirender.`);
    }
    const key = normalizeText(q.questionText);
    if (seen.has(key)) return rejected.push(`${n}: sama dengan soal yang sudah ada.`);
    seen.add(key);
    valid.push(input.data);
  });

  return { valid, rejected };
}
