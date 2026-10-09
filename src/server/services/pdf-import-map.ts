// Impor PDF (docs/AI_GENERATION.md §Impor PDF): prompt untuk Gemini + validasi
// & pemetaan output JSON-nya ke draf soal. Fungsi murni — bisa dites tanpa
// memanggil Gemini. Draf yang rusak tetap dikembalikan dengan `errors` supaya
// admin melihat apa yang gagal; hanya draf tanpa error yang boleh disimpan.

import { z } from "zod";
import { renderMathToHtml, renderRichText } from "@/lib/math-html";
import type { PdfCrop, PdfDraftOption, PdfDraftQuestion, PdfDraftStimulus } from "@/lib/pdf-import-types";
import { CATEGORY_PAIRS, OPTION_LABELS, QUESTION_TYPES } from "@/lib/validation/enums";
import { questionInput } from "@/lib/validation/question";
import type { Subject } from "@/server/asesmen";
import { mathRenders } from "@/server/services/ai-questions";

export const PDF_MAX_PAGES = 40;

export function buildPdfImportPrompt(subject: Subject, jenjang: string, pageCount: number) {
  const outline = subject.domains
    .map((d) => [`- ${d.code} ${d.name}`, ...d.subdomains.map((s) => `  - ${s.code}: ${s.name}`)].join("\n"))
    .join("\n");
  const levels = subject.cognitiveLevels.length
    ? `Level kognitif (wajib diisi per soal): ${subject.cognitiveLevels.map((l) => `${l.code} = ${l.name}`).join("; ")}.`
    : "Mata pelajaran ini tidak memakai level kognitif — isi cognitiveLevel dengan null.";
  const pairs = CATEGORY_PAIRS.map((p) => `"${p[0]}"/"${p[1]}"`).join(", ");

  return `Kamu menyalin dokumen soal ujian ke JSON terstruktur untuk bank soal TKA.
Gambar yang dilampirkan adalah ${pageCount} halaman dokumen, BERURUTAN mulai halaman 1.
Mata pelajaran: ${subject.fullName} (${subject.code}), jenjang ${jenjang}.

## Aturan penyalinan
1. Salin teks bacaan, pertanyaan, dan pilihan jawaban APA ADANYA (kata per kata, bahasa asli dokumen). Jangan meringkas atau memparafrasekan. Hapus hanya baris yang tercetak ganda di pergantian halaman.
2. Abaikan elemen tampilan seperti kotak "Hierarki Indikator", kode butir soal, label "Bentuk Soal", tombol, dan nomor halaman — tetapi GUNAKAN informasinya untuk menentukan bentuk soal dan subtopik.
3. Rumus matematika ditulis dalam KaTeX: $...$ (inline). Pecahan \\dfrac{a}{b}, akar \\sqrt{x}, sistem persamaan \\begin{cases} ... \\end{cases}. Pastikan setiap rumus valid.
4. Tabel ditulis sebagai baris teks: "Kolom1 — Kolom2 — Kolom3" per baris.
5. Bacaan/infografis/teks yang dipakai 2 soal atau lebih → masukkan ke "stimuli" dan soal merujuk lewat "stimulusKey". Konteks yang hanya dipakai satu soal → tulis di questionText soal itu.
6. Gambar penting (grafik, diagram, bangun, ilustrasi, foto, tabel bergambar, infografis) → isi "image" dengan nomor halaman dan box_2d [ymin, xmin, ymax, xmax] skala 0–1000 yang membingkai gambar itu saja (tanpa teks soal, tanpa kotak indikator). Jangan isi image untuk teks biasa.
7. Bila pilihan jawaban berupa gambar, tulis isinya sebagai teks (mis. koordinat titik) karena opsi tidak bisa bergambar.

## Bentuk soal (field "type")
- "pg": pilihan ganda, 4–5 opsi, tepat 1 isCorrect = true.
- "pgk_mcma": pilihan ganda kompleks lebih dari satu jawaban, 4–5 opsi, 1 s.d. (jumlah opsi − 1) isCorrect = true.
- "pgk_kategori": 3–5 pernyataan, tiap pernyataan diberi "category". categoryLabels HANYA boleh salah satu: ${pairs}. Bila dokumen memakai pasangan lain (mis. "Fakta/Opini"), ubah pertanyaannya agar memakai "Ya"/"Tidak" (mis. "Apakah pernyataan berikut termasuk fakta?") dan sesuaikan kategorinya.

## Kunci & pembahasan
- Bila dokumen mencantumkan kunci jawaban, pakai itu dan isi keyFromDocument = true.
- Bila tidak, kerjakan soalnya dengan teliti lalu tentukan kunci sendiri, keyFromDocument = false.
- explanation: pembahasan singkat 1–3 kalimat yang menunjukkan alasan kunci (bahasa Indonesia; untuk mata pelajaran Bahasa Inggris boleh bahasa Inggris).

## Subtopik (field "subtopicCode") — pilih SATU kode yang paling sesuai isi soal
${outline}

${levels}
difficulty: "easy" | "medium" | "hard".

## Format output (JSON saja)
{
  "title": "judul dokumen",
  "stimuli": [{ "key": "S1", "title": "judul bacaan", "content": "isi lengkap", "image": { "page": 1, "box_2d": [ymin, xmin, ymax, xmax] } | null }],
  "questions": [{
    "number": 1,
    "stimulusKey": "S1" | null,
    "subtopicCode": "kode",
    "type": "pg" | "pgk_mcma" | "pgk_kategori",
    "questionText": "teks pertanyaan",
    "image": { "page": 2, "box_2d": [...] } | null,
    "options": [{ "text": "teks opsi", "isCorrect": true|false, "category": "Benar"|null }],
    "categoryLabels": ["Benar", "Salah"] | null,
    "explanation": "pembahasan",
    "cognitiveLevel": "L2" | null,
    "difficulty": "medium",
    "keyFromDocument": false
  }]
}
Sertakan SEMUA soal dalam dokumen, urut sesuai nomor.`;
}

const box = z.array(z.coerce.number()).length(4);
const rawCrop = z.object({ page: z.coerce.number().int(), box_2d: box }).nullish();

const rawStimulus = z.object({
  key: z.coerce.string(),
  title: z.string().nullish(),
  content: z.string(),
  image: z.unknown().optional(),
});

const rawOption = z.object({
  text: z.coerce.string(),
  isCorrect: z.boolean().nullish(),
  category: z.string().nullish(),
});

const rawQuestion = z.object({
  number: z.coerce.number().int().nullish(),
  stimulusKey: z.coerce.string().nullish(),
  subtopicCode: z.string(),
  type: z.string(),
  questionText: z.string(),
  image: z.unknown().optional(),
  options: z.array(rawOption),
  categoryLabels: z.array(z.string()).nullish(),
  explanation: z.string().nullish(),
  cognitiveLevel: z.string().nullish(),
  difficulty: z.string().nullish(),
  keyFromDocument: z.boolean().nullish(),
});

const envelope = z.object({ title: z.string().nullish(), stimuli: z.array(z.unknown()).nullish(), questions: z.array(z.unknown()) });

/** Kotak gambar yang masuk akal; selain itu null. */
export function parseCrop(raw: unknown, pageCount: number): PdfCrop | null {
  const parsed = rawCrop.safeParse(raw);
  if (!parsed.success || !parsed.data) return null;
  const { page, box_2d } = parsed.data;
  const [ymin, xmin, ymax, xmax] = box_2d.map((n) => Math.min(1000, Math.max(0, Math.round(n))));
  if (page < 1 || page > pageCount || ymax - ymin < 20 || xmax - xmin < 20) return null;
  return { page, box: [ymin, xmin, ymax, xmax] };
}

function matchPair(labels: string[] | null | undefined) {
  if (!labels || labels.length !== 2) return null;
  const norm = labels.map((l) => l.trim().toLowerCase());
  return CATEGORY_PAIRS.find((p) => p[0].toLowerCase() === norm[0] && p[1].toLowerCase() === norm[1]) ?? null;
}

function subjectSubtopics(subject: Subject) {
  return new Map(subject.domains.flatMap((d) => d.subdomains.map((s) => [s.code, s.name] as const)));
}

/**
 * Draf → QuestionInput (siap disimpan). Dipakai saat pratinjau (cari error)
 * dan lagi di server saat menyimpan (jangan percaya data dari client).
 */
export function draftToInput(
  draft: Pick<PdfDraftQuestion, "type" | "text" | "options" | "categoryLabels" | "explanation" | "cognitiveLevel" | "difficulty">,
  ctx: { subtopicId: number; stimulusId?: number | null; stimulusOrder?: number | null; imageUrl?: string | null },
) {
  return questionInput.safeParse({
    type: draft.type,
    subtopicId: ctx.subtopicId,
    questionText: draft.text,
    imageUrl: ctx.imageUrl ?? null,
    difficulty: draft.difficulty,
    cognitiveLevel: draft.cognitiveLevel,
    status: "pending_review",
    explanationText: draft.explanation || null,
    stimulusId: ctx.stimulusId ?? null,
    stimulusOrder: ctx.stimulusOrder ?? null,
    categoryLabels: draft.categoryLabels ?? undefined,
    options: draft.options.map((o, i) => ({
      label: OPTION_LABELS[i] ?? "E",
      optionText: o.text,
      isCorrect: draft.type === "pgk_kategori" ? false : o.isCorrect,
      correctCategory: draft.type === "pgk_kategori" ? o.category : null,
    })),
  });
}

/** Error isi draf (di luar aturan form) — subtopik harus milik mapel, rumus harus valid, dll. */
export function draftErrors(draft: PdfDraftQuestion, subject: Subject): string[] {
  const errors: string[] = [];
  if (!subjectSubtopics(subject).has(draft.subtopicCode)) errors.push(`Subtopik ${draft.subtopicCode || "(kosong)"} bukan bagian ${subject.name}.`);
  if (draft.options.length > OPTION_LABELS.length) errors.push("Opsi lebih dari 5.");
  if (draft.type === "pgk_kategori" && !draft.categoryLabels) errors.push("Pasangan kategori tidak didukung.");
  const levels = subject.cognitiveLevels.map((l) => l.code);
  if (levels.length && (!draft.cognitiveLevel || !levels.includes(draft.cognitiveLevel))) errors.push(`Level kognitif harus ${levels.join("/")}.`);
  if (![draft.text, draft.explanation, ...draft.options.map((o) => o.text)].every(mathRenders)) errors.push("Ada rumus KaTeX yang tidak bisa dirender.");
  if (!draft.explanation.trim()) errors.push("Pembahasan kosong.");
  const parsed = draftToInput(draft, { subtopicId: 1, imageUrl: null });
  // Pasangan kategori yang tidak didukung sudah dilaporkan di atas.
  if (!parsed.success) errors.push(...parsed.error.issues.filter((i) => i.path[0] !== "categoryLabels").map((i) => i.message));
  return [...new Set(errors)];
}

export type PdfMapping = { title: string; stimuli: PdfDraftStimulus[]; questions: PdfDraftQuestion[]; warnings: string[] };

export function mapPdfExtraction(raw: unknown, subject: Subject, pageCount: number): PdfMapping | null {
  const env = envelope.safeParse(raw);
  if (!env.success) return null;
  const warnings: string[] = [];
  const names = subjectSubtopics(subject);
  const levels = subject.cognitiveLevels.map((l) => l.code);

  const stimuli: PdfDraftStimulus[] = [];
  for (const [i, item] of (env.data.stimuli ?? []).entries()) {
    const s = rawStimulus.safeParse(item);
    if (!s.success || !s.data.content.trim()) {
      warnings.push(`Bacaan #${i + 1} tidak lengkap — dilewati.`);
      continue;
    }
    const key = s.data.key.trim();
    if (stimuli.some((x) => x.key === key)) {
      warnings.push(`Kunci bacaan ${key} ganda — yang kedua dilewati.`);
      continue;
    }
    const content = s.data.content.trim();
    if (!mathRenders(content)) warnings.push(`Bacaan "${s.data.title ?? key}" berisi rumus yang tidak bisa dirender.`);
    stimuli.push({
      key,
      title: (s.data.title ?? "").trim().slice(0, 255) || `Bacaan ${stimuli.length + 1}`,
      content,
      html: renderRichText(content),
      image: parseCrop(s.data.image, pageCount),
    });
  }

  const questions: PdfDraftQuestion[] = [];
  for (const [i, item] of env.data.questions.entries()) {
    const q = rawQuestion.safeParse(item);
    if (!q.success) {
      warnings.push(`Soal #${i + 1}: struktur tidak lengkap — dilewati.`);
      continue;
    }
    const d = q.data;
    const type = (QUESTION_TYPES as readonly string[]).includes(d.type) ? (d.type as PdfDraftQuestion["type"]) : "pg";
    const pair = type === "pgk_kategori" ? matchPair(d.categoryLabels) : null;
    let stimulusKey = d.stimulusKey?.trim() || null;
    if (stimulusKey && !stimuli.some((s) => s.key === stimulusKey)) {
      warnings.push(`Soal ${d.number ?? i + 1}: bacaan ${stimulusKey} tidak ditemukan — soal dijadikan soal tunggal.`);
      stimulusKey = null;
    }
    const options: PdfDraftOption[] = d.options.map((o) => {
      const category = pair ? (pair.find((p) => p.toLowerCase() === o.category?.trim().toLowerCase()) ?? null) : null;
      const text = o.text.trim();
      return { text, isCorrect: type === "pgk_kategori" ? false : Boolean(o.isCorrect), category, html: renderMathToHtml(text) };
    });
    const code = d.subtopicCode.trim().toUpperCase();
    const level = d.cognitiveLevel?.trim().toUpperCase() || null;
    const text = d.questionText.trim();
    const explanation = (d.explanation ?? "").trim();
    const draft: PdfDraftQuestion = {
      number: d.number ?? i + 1,
      stimulusKey,
      subtopicCode: code,
      subtopicName: names.get(code) ?? "",
      type,
      text,
      html: renderRichText(text),
      options,
      categoryLabels: pair ? [pair[0], pair[1]] : null,
      explanation,
      explanationHtml: renderRichText(explanation),
      cognitiveLevel: levels.length ? level : null,
      difficulty: d.difficulty === "easy" || d.difficulty === "hard" ? d.difficulty : "medium",
      image: parseCrop(d.image, pageCount),
      keySource: d.keyFromDocument ? "pdf" : "ai",
      errors: [],
    };
    draft.errors = draftErrors(draft, subject);
    questions.push(draft);
  }

  // Bacaan yang tidak dirujuk soal mana pun tidak berguna.
  const used = new Set(questions.map((q) => q.stimulusKey).filter(Boolean));
  const unused = stimuli.filter((s) => !used.has(s.key));
  if (unused.length) warnings.push(`${unused.length} bacaan tidak dipakai soal mana pun — dilewati.`);

  return { title: (env.data.title ?? "").trim().slice(0, 200), stimuli: stimuli.filter((s) => used.has(s.key)), questions, warnings };
}

