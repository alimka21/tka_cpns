// Validasi & pemetaan output JSON Gemini → QuestionInput (docs/AI_GENERATION.md §3).
// Fungsi murni supaya bisa dites dengan output AI palsu tanpa memanggil Gemini.
// Tiap soal divalidasi sendiri: soal rusak dibuang, sisanya tetap dipakai.

import katex from "katex";
import { z } from "zod";
import { CATEGORY_PAIRS, OPTION_LABELS, QUESTION_TYPES, type Difficulty, type QuestionType } from "@/lib/validation/enums";
import { questionInput, type QuestionInput } from "@/lib/validation/question";

const aiOption = z.object({
  text: z.string(),
  isCorrect: z.boolean().optional(),
  category: z.string().optional(),
});

const aiQuestion = z.object({
  /** Wajib bila bentuk "campuran". */
  type: z.enum(QUESTION_TYPES).optional(),
  /** Grup multi-subtopik: kode subtopik soal ini. */
  subtopicCode: z.string().optional(),
  questionText: z.string(),
  options: z.array(aiOption),
  categoryLabels: z.array(z.string()).optional(),
  explanation: z.string(),
});

export const aiOutputEnvelope = z.object({ questions: z.array(z.unknown()) });

/** Bentuk yang diminta ke AI; "campuran" = tiap soal menyebut `type`-nya sendiri. */
export type AiForm = QuestionType | "campuran";

export type AiMappingContext = {
  type: AiForm;
  subtopicId: number;
  /** Grup multi-subtopik: kode → id subtopik yang diizinkan (tanpa kode = subtopik utama). */
  subtopicByCode?: Record<string, number>;
  difficulty: Difficulty;
  cognitiveLevel: string | null;
  imageUrl?: string | null;
  /** Teks soal yang sudah ada (bank subtopik ini, soal asal) — untuk cegah duplikat. */
  existingTexts: string[];
  /** Soal tunggal (bukan grup/gambar): tolak soal yang merujuk bacaan yang tidak ditulis. */
  standalone?: boolean;
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

const TEXT_REF =
  /\b(teks|bacaan|kutipan|cerpen|cerita|paragraf|wacana|tabel|grafik|diagram|data|infografis|puisi|dialog|artikel|novel)\s+(tersebut|di atas|berikut|tadi)\b|\bparagraf\s+(pertama|kedua|ketiga|keempat|kelima|terakhir|ke-?\d)\b/gi;

/**
 * Soal tunggal yang merujuk bacaan/data tanpa memuatnya, mis. "Berdasarkan
 * teks tersebut, ..." padahal teksnya ada di soal lain (atau tidak ada sama
 * sekali). "… berikut" harus diikuti isinya; "… tersebut / paragraf kedua"
 * harus didahului isinya.
 */
export function refersToMissingText(questionText: string) {
  const text = questionText.replace(/\s+/g, " ").trim();
  for (const m of text.matchAll(TEXT_REF)) {
    const start = m.index ?? 0;
    const forward = m[2]?.toLowerCase() === "berikut";
    const room = forward ? text.length - (start + m[0].length) : start;
    if (room < (forward ? 100 : 150)) return true;
  }
  return false;
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
    const type: QuestionType | undefined = ctx.type === "campuran" ? q.type : ctx.type;
    if (!type) return rejected.push(`${n}: bentuk soal tidak disebutkan.`);

    let subtopicId = ctx.subtopicId;
    if (ctx.subtopicByCode && q.subtopicCode) {
      const found = ctx.subtopicByCode[q.subtopicCode.trim().toUpperCase()];
      if (!found) return rejected.push(`${n}: subtopik ${q.subtopicCode} di luar pilihan.`);
      subtopicId = found;
    }

    const pair = type === "pgk_kategori" ? matchPair(q.categoryLabels) : null;
    if (type === "pgk_kategori" && !pair) return rejected.push(`${n}: pasangan kategori tidak sah.`);

    const options = q.options.map((o, k) => {
      const category = pair ? pair.find((p) => p.toLowerCase() === o.category?.trim().toLowerCase()) ?? null : null;
      return {
        label: OPTION_LABELS[k] ?? "E",
        optionText: o.text.trim(),
        isCorrect: type === "pgk_kategori" ? false : Boolean(o.isCorrect),
        correctCategory: category,
      };
    });
    if (q.options.length > OPTION_LABELS.length) return rejected.push(`${n}: opsi terlalu banyak.`);

    const input = questionInput.safeParse({
      type,
      subtopicId,
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
    if (ctx.standalone && !ctx.imageUrl && refersToMissingText(q.questionText)) {
      return rejected.push(`${n}: merujuk bacaan/data yang tidak ditulis di soal itu.`);
    }
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

/** Satu soal dalam rencana (Buat Paket Otomatis): bentuk, subtopik & tingkat ditentukan sistem. */
export type PlanItem = { subdomainCode: string; form: QuestionType; difficulty: Difficulty; cognitiveLevel: string | null };
export type ResolvedPlanItem = PlanItem & { subtopicId: number };

/**
 * Pasangkan soal valid ke slot rencana yang belum terisi (bentuk & subtopik
 * harus sama); tingkat soal mengikuti slot. Soal di luar rencana dibuang.
 */
export function fillPlan(valid: QuestionInput[], remaining: ResolvedPlanItem[]) {
  const left = [...remaining];
  const accepted: QuestionInput[] = [];
  const rejected: string[] = [];
  for (const q of valid) {
    const i = left.findIndex((p) => p.form === q.type && p.subtopicId === q.subtopicId);
    if (i < 0) {
      rejected.push(`Soal "${q.questionText.slice(0, 40)}…" tidak sesuai rencana bentuk/subtopik.`);
      continue;
    }
    const [slot] = left.splice(i, 1);
    accepted.push({ ...q, difficulty: slot.difficulty, cognitiveLevel: slot.cognitiveLevel });
  }
  return { accepted, rejected, left };
}

const aiStimulus = z.object({ title: z.string().trim().min(3).max(255), content: z.string().trim().min(80).max(8000) });

/** Bacaan buatan AI (mode grup): `{ stimulus: { title, content } }`. `null` bila tidak sah. */
export function parseAiStimulus(raw: unknown): { title: string; content: string } | null {
  const parsed = z.object({ stimulus: aiStimulus }).safeParse(raw);
  if (!parsed.success || !mathRenders(parsed.data.stimulus.content)) return null;
  return parsed.data.stimulus;
}
