// Generate soal bank dengan Gemini milik admin (Jalur A, docs/AI_GENERATION.md).
// Tiga mode: "baru" (dari subdomain), "variasi" (modifikasi soal bank),
// "gambar" (beberapa soal dari satu gambar galeri). Hasil SELALU masuk
// sebagai `pending_review` — tidak pernah langsung tayang.

import { eq } from "drizzle-orm";
import type { Difficulty, QuestionType } from "@/lib/validation/enums";
import type { QuestionInput } from "@/lib/validation/question";
import { buildAiPrompt, type VariationStyle } from "@/server/asesmen/generation-context";
import { db } from "@/server/db";
import { aiGenerationLogs, questions, subtopics, type AiGenerationMode } from "@/server/db/schema";
import { loadQuestionsWithKeys, type QuestionWithKeys } from "@/server/queries/practice";
import { getGeminiKey } from "@/server/services/ai-key";
import { mapAiQuestions } from "@/server/services/ai-questions";
import { GeminiError, generateJson, geminiModel, type GeminiImage } from "@/server/services/gemini";
import { getQuestionImage, imagePath } from "@/server/services/question-images";
import { renderMathToHtml } from "@/lib/math-html";
import { insertQuestion, subtopicIdsByCode } from "@/server/services/question-store";

export type AiGenerateRequest = {
  mode: AiGenerationMode;
  subdomainCode: string;
  form: QuestionType;
  count: number;
  difficulty: Difficulty;
  cognitiveLevel: string | null;
  sourceQuestionId?: number | null;
  variation?: VariationStyle;
  imageId?: number | null;
  extraInstruction?: string | null;
};

export type AiGenerateResult =
  | { ok: true; created: { id: number; text: string; html: string }[]; rejected: string[] }
  | { ok: false; error: string; rejected?: string[] };

export async function generateAiQuestions(userId: number, req: AiGenerateRequest): Promise<AiGenerateResult> {
  const apiKey = await getGeminiKey(userId);
  if (!apiKey) return { ok: false, error: "Simpan API key Gemini milikmu dulu di halaman Pengaturan." };

  let subdomainCode = req.subdomainCode;
  let source: QuestionWithKeys | undefined;
  if (req.mode === "variasi") {
    if (!req.sourceQuestionId) return { ok: false, error: "Pilih soal asal yang akan dimodifikasi." };
    source = (await loadQuestionsWithKeys([req.sourceQuestionId])).get(req.sourceQuestionId);
    if (!source) return { ok: false, error: "Soal asal tidak ditemukan." };
    // Variasi selalu di subdomain yang sama dengan soal asal.
    const [row] = await db.select({ code: subtopics.code }).from(subtopics).where(eq(subtopics.id, source.subtopicId));
    subdomainCode = row.code;
  }

  let images: GeminiImage[] | undefined;
  let imageNote: string | undefined;
  let imageUrl: string | null = null;
  if (req.mode === "gambar") {
    if (!req.imageId) return { ok: false, error: "Pilih gambar dari galeri." };
    const image = await getQuestionImage(req.imageId);
    if (!image) return { ok: false, error: "Gambar tidak ditemukan." };
    images = [{ mime: image.mime, data: image.data }];
    imageNote = image.title;
    imageUrl = imagePath(image.id);
  }

  const subtopicId = (await subtopicIdsByCode(db, [subdomainCode])).get(subdomainCode);
  if (!subtopicId) return { ok: false, error: "Subdomain belum ada di database — jalankan npm run db:seed:asesmen." };

  const existing = await db.select({ text: questions.questionText }).from(questions).where(eq(questions.subtopicId, subtopicId));
  const existingTexts = [...existing.map((e) => e.text), ...(source ? [source.questionText] : [])];

  const promptFor = (count: number, avoid: string[]) =>
    buildAiPrompt({
      mode: req.mode,
      form: req.form,
      count,
      subdomainCode,
      difficulty: req.difficulty,
      cognitiveLevel: req.cognitiveLevel,
      variation: req.variation,
      imageNote,
      extraInstruction:
        [req.extraInstruction, avoid.length ? `Jangan mengulang soal berikut:\n${avoid.map((t) => `- ${t.slice(0, 160)}`).join("\n")}` : null]
          .filter(Boolean)
          .join("\n\n") || undefined,
      source: source
        ? {
            type: source.type,
            questionText: source.questionText,
            categoryLabels: source.categoryLabels,
            explanation: source.explanation,
            options: source.options,
          }
        : undefined,
    });

  const started = Date.now();
  const valid: QuestionInput[] = [];
  const rejected: string[] = [];
  let error: string | null = null;

  try {
    // Percobaan pertama + satu kali ulang hanya untuk kekurangannya.
    for (let attempt = 0; attempt < 2 && valid.length < req.count; attempt++) {
      const need = req.count - valid.length;
      const prompt = promptFor(need, valid.map((v) => v.questionText));
      if (!prompt.ok) return { ok: false, error: prompt.error };
      const raw = await generateJson({ apiKey, prompt: prompt.prompt, images });
      const mapped = mapAiQuestions(raw, {
        type: req.form,
        subtopicId,
        difficulty: req.difficulty,
        cognitiveLevel: req.cognitiveLevel,
        imageUrl,
        existingTexts: [...existingTexts, ...valid.map((v) => v.questionText)],
      });
      valid.push(...mapped.valid.slice(0, need));
      rejected.push(...mapped.rejected);
    }
  } catch (e) {
    error = e instanceof GeminiError ? e.message : "Terjadi kesalahan saat memanggil Gemini.";
  }

  const created =
    valid.length > 0
      ? await db.transaction(async (tx) => {
          const out: { id: number; text: string; html: string }[] = [];
          for (const q of valid) {
            const id = await insertQuestion(tx, q, { generatedBy: "ai", userId });
            if (source) await tx.update(questions).set({ sourceQuestionId: source.id }).where(eq(questions.id, id));
            out.push({ id, text: q.questionText, html: renderMathToHtml(q.questionText) });
          }
          return out;
        })
      : [];

  await db.insert(aiGenerationLogs).values({
    userId,
    purpose: "bank_admin",
    mode: req.mode,
    subtopicCode: subdomainCode,
    sourceQuestionId: source?.id ?? null,
    imageId: req.imageId ?? null,
    requested: req.count,
    validCount: created.length,
    model: geminiModel(),
    error: error ?? (created.length === 0 ? rejected.slice(0, 5).join(" | ").slice(0, 1000) || "Tidak ada soal valid." : null),
    durationMs: Date.now() - started,
  });

  if (created.length === 0) return { ok: false, error: error ?? "AI tidak menghasilkan soal yang lolos validasi. Coba lagi.", rejected };
  return { ok: true, created, rejected: error ? [...rejected, `Sebagian gagal: ${error}`] : rejected };
}
