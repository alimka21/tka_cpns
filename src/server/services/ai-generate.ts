// Generate soal dengan Gemini (docs/AI_GENERATION.md).
// - Jalur A (admin, bank): mode "baru", "variasi" (modifikasi soal bank),
//   "gambar" (beberapa soal dari satu gambar), "grup" (1 bacaan + N soal).
//   Hasil SELALU `pending_review` — tidak pernah langsung tayang.
// - `runAiGeneration` (inti: prompt → Gemini → validasi → ulang sekali untuk
//   kekurangan) juga dipakai Latihan AI siswa (services/practice-ai.ts).

import { eq, inArray, max } from "drizzle-orm";
import { renderMathToHtml } from "@/lib/math-html";
import type { Difficulty } from "@/lib/validation/enums";
import type { QuestionInput } from "@/lib/validation/question";
import { buildAiPrompt, type AiPromptRequest, type VariationStyle } from "@/server/asesmen/generation-context";
import { db } from "@/server/db";
import { aiGenerationLogs, questions, stimuli, subtopics, type AiGenerationMode } from "@/server/db/schema";
import { loadQuestionsWithKeys, type QuestionWithKeys } from "@/server/queries/practice";
import { getGeminiKey } from "@/server/services/ai-key";
import { mapAiQuestions, parseAiStimulus, type AiForm } from "@/server/services/ai-questions";
import { GeminiError, generateJson, geminiModel, type GeminiImage } from "@/server/services/gemini";
import { getQuestionImage, imagePath } from "@/server/services/question-images";
import { insertQuestion, subtopicIdsByCode } from "@/server/services/question-store";

type Stimulus = { title: string; content: string };

export type RunAiInput = {
  apiKey: string;
  count: number;
  subtopicId: number;
  form: AiForm;
  difficulty: Difficulty;
  cognitiveLevel: string | null;
  imageUrl?: string | null;
  images?: GeminiImage[];
  existingTexts: string[];
  /** Grup multi-subtopik: kode → id subtopik yang diizinkan. */
  subtopicByCode?: Record<string, number>;
  /** Mode grup tanpa stimulus: AI menulis bacaan di percobaan pertama. */
  wantsNewStimulus?: boolean;
  /** Prompt untuk `need` soal; `stimulus` terisi setelah AI menulis bacaan. */
  prompt: (need: number, avoid: string[], stimulus: Stimulus | null) => ReturnType<typeof buildAiPrompt>;
};

export type RunAiOutput = { valid: QuestionInput[]; rejected: string[]; error: string | null; stimulus: Stimulus | null };

/** Percobaan pertama + satu kali ulang hanya untuk kekurangannya. */
export async function runAiGeneration(input: RunAiInput): Promise<RunAiOutput> {
  const valid: QuestionInput[] = [];
  const rejected: string[] = [];
  let stimulus: Stimulus | null = null;
  try {
    for (let attempt = 0; attempt < 2 && valid.length < input.count; attempt++) {
      const need = input.count - valid.length;
      const prompt = input.prompt(need, valid.map((v) => v.questionText), stimulus);
      if (!prompt.ok) return { valid, rejected, error: prompt.error, stimulus };
      const raw = await generateJson({ apiKey: input.apiKey, prompt: prompt.prompt, images: input.images });
      if (input.wantsNewStimulus && !stimulus) {
        stimulus = parseAiStimulus(raw);
        if (!stimulus) {
          rejected.push("Bacaan (stimulus) dari AI tidak lengkap atau terlalu pendek.");
          continue;
        }
      }
      const mapped = mapAiQuestions(raw, {
        type: input.form,
        subtopicId: input.subtopicId,
        subtopicByCode: input.subtopicByCode,
        difficulty: input.difficulty,
        cognitiveLevel: input.cognitiveLevel,
        imageUrl: input.imageUrl,
        existingTexts: [...input.existingTexts, ...valid.map((v) => v.questionText)],
      });
      valid.push(...mapped.valid.slice(0, need));
      rejected.push(...mapped.rejected);
    }
    return { valid, rejected, error: null, stimulus };
  } catch (e) {
    return { valid, rejected, error: e instanceof GeminiError ? e.message : "Terjadi kesalahan saat memanggil Gemini.", stimulus };
  }
}

export type AiGenerateRequest = {
  mode: AiGenerationMode;
  subdomainCode: string;
  form: AiForm;
  count: number;
  difficulty: Difficulty;
  cognitiveLevel: string | null;
  sourceQuestionId?: number | null;
  variation?: VariationStyle;
  imageId?: number | null;
  /** Mode grup: stimulus yang sudah ada; kosong = AI menulis bacaan baru. */
  stimulusId?: number | null;
  /** Mode grup: subtopik tambahan di mata uji yang sama (satu bacaan, beberapa subtopik). */
  extraSubdomainCodes?: string[] | null;
  extraInstruction?: string | null;
};

export type AiGenerateResult =
  | {
      ok: true;
      created: { id: number; text: string; html: string }[];
      rejected: string[];
      stimulus: { id: number; code: string; title: string } | null;
    }
  | { ok: false; error: string; rejected?: string[] };

function stimulusCode() {
  const d = new Date();
  const ymd = `${d.getFullYear() % 100}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `AI-${ymd}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

export async function generateAiQuestions(userId: number, req: AiGenerateRequest): Promise<AiGenerateResult> {
  const apiKey = await getGeminiKey(userId);
  if (!apiKey) return { ok: false, error: "Simpan API key Gemini milikmu dulu di halaman Pengaturan." };
  if (req.form === "campuran" && req.mode !== "grup") return { ok: false, error: "Bentuk campuran hanya untuk mode soal grup." };

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

  let existingStimulus: { id: number; code: string; title: string; content: string } | null = null;
  if (req.mode === "grup" && req.stimulusId) {
    const [st] = await db
      .select({ id: stimuli.id, code: stimuli.code, title: stimuli.title, content: stimuli.content })
      .from(stimuli)
      .where(eq(stimuli.id, req.stimulusId));
    if (!st) return { ok: false, error: "Stimulus tidak ditemukan." };
    existingStimulus = st;
  }

  const subtopicId = (await subtopicIdsByCode(db, [subdomainCode])).get(subdomainCode);
  if (!subtopicId) return { ok: false, error: "Subdomain belum ada di database — jalankan npm run db:seed:asesmen." };

  const extraCodes = req.mode === "grup" ? [...new Set((req.extraSubdomainCodes ?? []).filter((c) => c !== subdomainCode))] : [];
  let subtopicByCode: Record<string, number> | undefined;
  if (extraCodes.length > 0) {
    const ids = await subtopicIdsByCode(db, extraCodes);
    const missing = extraCodes.filter((c) => !ids.has(c));
    if (missing.length) return { ok: false, error: `Subtopik belum ada di database: ${missing.join(", ")}.` };
    subtopicByCode = Object.fromEntries([[subdomainCode, subtopicId], ...ids]);
  }
  const allSubtopicIds = subtopicByCode ? Object.values(subtopicByCode) : [subtopicId];
  const existing = await db.select({ text: questions.questionText }).from(questions).where(inArray(questions.subtopicId, allSubtopicIds));
  const started = Date.now();
  const run = await runAiGeneration({
    apiKey,
    count: req.count,
    subtopicId,
    form: req.form,
    difficulty: req.difficulty,
    cognitiveLevel: req.cognitiveLevel,
    imageUrl,
    images,
    existingTexts: [...existing.map((e) => e.text), ...(source ? [source.questionText] : [])],
    subtopicByCode,
    wantsNewStimulus: req.mode === "grup" && !existingStimulus,
    prompt: (need, avoid, aiStimulus) =>
      buildAiPrompt({
        mode: req.mode,
        form: req.form,
        count: need,
        subdomainCode,
        difficulty: req.difficulty,
        cognitiveLevel: req.cognitiveLevel,
        variation: req.variation,
        imageNote,
        // Setelah AI menulis bacaan, percobaan ulang memakai bacaan yang sama.
        stimulus: existingStimulus ?? aiStimulus,
        extraSubdomainCodes: extraCodes,
        extraInstruction:
          [req.extraInstruction, avoid.length ? `Jangan mengulang soal berikut:\n${avoid.map((t) => `- ${t.slice(0, 160)}`).join("\n")}` : null]
            .filter(Boolean)
            .join("\n\n") || undefined,
        source: source
          ? { type: source.type, questionText: source.questionText, categoryLabels: source.categoryLabels, explanation: source.explanation, options: source.options }
          : undefined,
      } satisfies AiPromptRequest),
  });

  const saved =
    run.valid.length > 0
      ? await db.transaction(async (tx) => {
          let groupStimulus: { id: number; code: string; title: string } | null = null;
          let nextOrder = 1;
          if (req.mode === "grup") {
            if (existingStimulus) {
              groupStimulus = existingStimulus;
              const [{ last }] = await tx
                .select({ last: max(questions.stimulusOrder) })
                .from(questions)
                .where(eq(questions.stimulusId, existingStimulus.id));
              nextOrder = (last ?? 0) + 1;
            } else if (run.stimulus) {
              const code = stimulusCode();
              const [{ id }] = await tx
                .insert(stimuli)
                .values({ code, title: run.stimulus.title, content: run.stimulus.content, status: "draft", createdBy: userId })
                .$returningId();
              groupStimulus = { id, code, title: run.stimulus.title };
            }
          }
          const out: { id: number; text: string; html: string }[] = [];
          for (const q of run.valid) {
            const withGroup = groupStimulus ? { ...q, stimulusId: groupStimulus.id, stimulusOrder: nextOrder++ } : q;
            const id = await insertQuestion(tx, withGroup, { generatedBy: "ai", userId });
            if (source) await tx.update(questions).set({ sourceQuestionId: source.id }).where(eq(questions.id, id));
            out.push({ id, text: q.questionText, html: renderMathToHtml(q.questionText) });
          }
          return { created: out, stimulus: groupStimulus };
        })
      : { created: [], stimulus: null };

  await db.insert(aiGenerationLogs).values({
    userId,
    purpose: "bank_admin",
    mode: req.mode,
    subtopicCode: subdomainCode,
    sourceQuestionId: source?.id ?? null,
    imageId: req.imageId ?? null,
    requested: req.count,
    validCount: saved.created.length,
    model: geminiModel(),
    error: run.error ?? (saved.created.length === 0 ? run.rejected.slice(0, 5).join(" | ").slice(0, 1000) || "Tidak ada soal valid." : null),
    durationMs: Date.now() - started,
  });

  if (saved.created.length === 0) {
    return { ok: false, error: run.error ?? "AI tidak menghasilkan soal yang lolos validasi. Coba lagi.", rejected: run.rejected };
  }
  return {
    ok: true,
    created: saved.created,
    stimulus: saved.stimulus && { id: saved.stimulus.id, code: saved.stimulus.code, title: saved.stimulus.title },
    rejected: run.error ? [...run.rejected, `Sebagian gagal: ${run.error}`] : run.rejected,
  };
}
