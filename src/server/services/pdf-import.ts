// Impor PDF dengan Gemini (docs/AI_GENERATION.md §Impor PDF).
// 1) extract: halaman PDF (dirender jadi JPEG di browser admin) → Gemini →
//    draf bacaan & soal (belum disimpan) untuk dipratinjau.
// 2) save: draf terpilih divalidasi ULANG di server lalu disimpan sebagai
//    `pending_review`, opsional sekaligus jadi paket draf.

import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import type { PdfDraftQuestion, PdfExtractResult } from "@/lib/pdf-import-types";
import { packageRuleFor } from "@/lib/package-rules";
import { QUESTION_TYPES } from "@/lib/validation/enums";
import { FRAMEWORKS, JENJANG, type Subject } from "@/server/asesmen";
import { db } from "@/server/db";
import { categories, questionImages, stimuli, subjects, testPackageQuestions, testPackages } from "@/server/db/schema";
import { getGeminiKey } from "@/server/services/ai-key";
import { GeminiError, generateJson, type GeminiImage } from "@/server/services/gemini";
import { completeGroups } from "@/server/services/package-composition";
import { PDF_MAX_PAGES, buildPdfImportPrompt, draftErrors, draftToInput, mapPdfExtraction } from "@/server/services/pdf-import-map";
import { imagePath } from "@/server/services/question-images";
import { insertQuestion, subtopicIdsByCode } from "@/server/services/question-store";

export function findSubject(code: string): { subject: Subject; jenjang: (typeof JENJANG)[number] } | null {
  for (const jenjang of JENJANG) {
    const subject = FRAMEWORKS[jenjang].subjects.find((s) => s.code === code);
    if (subject) return { subject, jenjang };
  }
  return null;
}

export async function extractFromPdf(userId: number, subjectCode: string, pages: GeminiImage[]): Promise<PdfExtractResult> {
  const found = findSubject(subjectCode);
  if (!found) return { ok: false, error: "Pilih mata pelajaran." };
  if (pages.length === 0) return { ok: false, error: "PDF tidak berisi halaman." };
  if (pages.length > PDF_MAX_PAGES) return { ok: false, error: `Maksimal ${PDF_MAX_PAGES} halaman per impor — pecah PDF-nya dulu.` };
  const apiKey = await getGeminiKey(userId);
  if (!apiKey) return { ok: false, error: "Simpan API key Gemini milikmu dulu di halaman Profil & API Key." };

  try {
    const raw = await generateJson({
      apiKey,
      prompt: buildPdfImportPrompt(found.subject, found.jenjang, pages.length),
      images: pages,
      maxOutputTokens: 65_536,
      timeoutMs: 300_000,
    });
    const mapped = mapPdfExtraction(raw, found.subject, pages.length);
    if (!mapped || mapped.questions.length === 0) return { ok: false, error: "Gemini tidak menemukan soal di dokumen ini. Pastikan PDF berisi soal dan mata pelajarannya benar." };
    return { ok: true, ...mapped };
  } catch (e) {
    return { ok: false, error: e instanceof GeminiError ? e.message : "Terjadi kesalahan saat memanggil Gemini." };
  }
}

// ── Simpan ────────────────────────────────────────────────────────────────

const optionSchema = z.object({ text: z.string(), isCorrect: z.boolean(), category: z.string().nullable() });

export const pdfSaveInput = z.object({
  subjectCode: z.string(),
  stimuli: z
    .array(z.object({ key: z.string(), title: z.string().trim().min(1).max(255), content: z.string().trim().min(1), imageId: z.number().int().positive().nullable() }))
    .max(60),
  questions: z
    .array(
      z.object({
        number: z.number().int(),
        stimulusKey: z.string().nullable(),
        subtopicCode: z.string(),
        type: z.enum(QUESTION_TYPES),
        text: z.string(),
        options: z.array(optionSchema),
        categoryLabels: z.tuple([z.string(), z.string()]).nullable(),
        explanation: z.string(),
        cognitiveLevel: z.string().nullable(),
        difficulty: z.enum(["easy", "medium", "hard"]),
        imageId: z.number().int().positive().nullable(),
      }),
    )
    .min(1, "Pilih minimal satu soal.")
    .max(100),
  /** Isi = sekaligus buat paket draf dengan semua soal ini. */
  packageTitle: z.string().trim().max(255).nullable(),
});

export type PdfSaveInput = z.infer<typeof pdfSaveInput>;
export type PdfSaveResult = { ok: true; created: number; stimuli: number; packageId: number | null } | { ok: false; errors: string[] };

function stimulusCode(n: number) {
  const d = new Date();
  const ymd = `${d.getFullYear() % 100}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `PDF-${ymd}-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${n}`;
}

export async function savePdfImport(userId: number, raw: unknown): Promise<PdfSaveResult> {
  const parsed = pdfSaveInput.safeParse(raw);
  if (!parsed.success) return { ok: false, errors: [...new Set(parsed.error.issues.map((i) => i.message))] };
  const input = parsed.data;
  const found = findSubject(input.subjectCode);
  if (!found) return { ok: false, errors: ["Mata pelajaran tidak dikenal."] };

  // Validasi ulang setiap soal — data dari client tidak dipercaya.
  const errors: string[] = [];
  for (const q of input.questions) {
    const draft = { ...q, html: "", explanationHtml: "", subtopicName: "", image: null, keySource: "ai", errors: [], options: q.options.map((o) => ({ ...o, html: "" })) } as PdfDraftQuestion;
    const errs = draftErrors(draft, found.subject);
    if (errs.length) errors.push(`Soal ${q.number}: ${errs[0]}`);
    if (q.stimulusKey && !input.stimuli.some((s) => s.key === q.stimulusKey)) errors.push(`Soal ${q.number}: bacaan tidak ikut dikirim.`);
  }
  const imageIds = [...new Set([...input.stimuli, ...input.questions].map((x) => x.imageId).filter((x): x is number => x != null))];
  if (imageIds.length) {
    const rows = await db.select({ id: questionImages.id }).from(questionImages).where(inArray(questionImages.id, imageIds));
    if (rows.length !== imageIds.length) errors.push("Ada gambar yang tidak ditemukan di galeri.");
  }
  const codes = [...new Set(input.questions.map((q) => q.subtopicCode))];
  const subIds = await subtopicIdsByCode(db, codes);
  if (subIds.size !== codes.length) errors.push("Subtopik belum ada di database — jalankan npm run db:seed:asesmen.");
  if (errors.length) return { ok: false, errors: errors.slice(0, 8) };

  let pkgMeta: { categoryId: number; subjectId: number; duration: number } | null = null;
  if (input.packageTitle) {
    const [row] = await db
      .select({ categoryId: categories.id, subjectId: subjects.id, type: subjects.type })
      .from(subjects)
      .innerJoin(categories, eq(categories.id, subjects.categoryId))
      .where(and(eq(subjects.code, found.subject.code), eq(categories.code, found.jenjang)));
    if (!row) return { ok: false, errors: ["Mata pelajaran belum ada di database."] };
    const rule = packageRuleFor(found.jenjang, { code: found.subject.code, type: row.type });
    pkgMeta = { categoryId: row.categoryId, subjectId: row.subjectId, duration: rule?.durationMinutes ?? 60 };
  }

  return db.transaction(async (tx) => {
    const stimulusIds = new Map<string, number>();
    const usedKeys = new Set(input.questions.map((q) => q.stimulusKey).filter(Boolean));
    let n = 1;
    for (const s of input.stimuli) {
      if (!usedKeys.has(s.key)) continue;
      const [{ id }] = await tx
        .insert(stimuli)
        .values({ code: stimulusCode(n++), title: s.title, content: s.content, imageUrl: s.imageId ? imagePath(s.imageId) : null, status: "draft", createdBy: userId })
        .$returningId();
      stimulusIds.set(s.key, id);
    }
    const orderIn = new Map<string, number>();
    const created: { id: number; stimulusId: number | null; stimulusOrder: number | null }[] = [];
    for (const q of input.questions) {
      const stimulusId = q.stimulusKey ? stimulusIds.get(q.stimulusKey)! : null;
      const stimulusOrder = q.stimulusKey ? (orderIn.get(q.stimulusKey) ?? 0) + 1 : null;
      if (q.stimulusKey) orderIn.set(q.stimulusKey, stimulusOrder!);
      const draft = { ...q, options: q.options.map((o) => ({ ...o, html: "" })) };
      const parsedQ = draftToInput(draft, { subtopicId: subIds.get(q.subtopicCode)!, stimulusId, stimulusOrder, imageUrl: q.imageId ? imagePath(q.imageId) : null });
      if (!parsedQ.success) throw new Error("Validasi soal gagal setelah pengecekan awal.");
      const id = await insertQuestion(tx, parsedQ.data, { generatedBy: "import", userId });
      created.push({ id, stimulusId, stimulusOrder });
    }

    let packageId: number | null = null;
    if (pkgMeta && input.packageTitle) {
      // Soal satu bacaan selalu berdampingan & berurutan (aturan susunan paket).
      const ordered = completeGroups(created.map((c) => c.id), created);
      const [{ id }] = await tx
        .insert(testPackages)
        .values({
          title: input.packageTitle,
          description: "Diimpor dari PDF dengan Gemini — kunci & pembahasan perlu ditinjau.",
          categoryId: pkgMeta.categoryId,
          subjectId: pkgMeta.subjectId,
          durationMinutes: pkgMeta.duration,
          isPremium: false,
          status: "draft",
          createdBy: userId,
        })
        .$returningId();
      await tx.insert(testPackageQuestions).values(ordered.map((questionId, i) => ({ testPackageId: id, questionId, order: i + 1 })));
      packageId = id;
    }
    return { ok: true as const, created: created.length, stimuli: stimulusIds.size, packageId };
  });
}

