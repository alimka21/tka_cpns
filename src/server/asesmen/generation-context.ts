// Rakit konteks prompt generate soal (Fase 2, Gemini) dari kerangka
// asesmen. Tujuannya: soal AI tidak keluar dari cakupan/batasan subdomain
// dan sesuai level kognitif resmi. Output AI tetap wajib divalidasi Zod &
// direview manual (docs/SRS.md §AI Generation).

import type { Difficulty } from "@/lib/validation/enums";
import { findSubdomain, type CognitiveLevel, type SubdomainRef } from "./index";

const DIFFICULTY_LABEL: Record<Difficulty, string> = { easy: "mudah", medium: "sedang", hard: "sulit" };

// Field deskriptif mata uji yang relevan untuk penulis soal.
const SUBJECT_CONTEXT_KEYS = [
  "fokus_keterampilan",
  "muatan",
  "aspek_keterampilan_membaca",
  "kemampuan_matematis_yang_diukur",
  "kompetensi_umum",
  "kompetensi_yang_diukur",
  "keterampilan_proses_sains",
  "standar_kemampuan",
  "catatan_stimulus",
] as const;

export type GenerationRequest = {
  subdomainCode: string;
  difficulty: Difficulty;
  count: number;
  /** Wajib untuk mata uji yang punya level kognitif; dilarang untuk mata uji bahasa. */
  cognitiveLevel?: string | null;
};

export type GenerationContext =
  | { ok: true; ref: SubdomainRef; level: CognitiveLevel | null; prompt: string }
  | { ok: false; error: string };

function bullets(items: string[]) {
  return items.map((i) => `- ${i}`).join("\n");
}

export function buildGenerationContext(req: GenerationRequest): GenerationContext {
  const ref = findSubdomain(req.subdomainCode);
  if (!ref) return { ok: false, error: `Kode subdomain ${req.subdomainCode} tidak ada di kerangka asesmen.` };
  const { framework, subject, domain, subdomain } = ref;

  let level: CognitiveLevel | null = null;
  if (subject.cognitiveLevels.length > 0) {
    level = subject.cognitiveLevels.find((l) => l.code === req.cognitiveLevel) ?? null;
    if (!level) {
      return {
        ok: false,
        error: `Pilih level kognitif untuk ${subject.name}: ${subject.cognitiveLevels.map((l) => `${l.code} (${l.name})`).join(", ")}.`,
      };
    }
  } else if (req.cognitiveLevel) {
    return { ok: false, error: `${subject.name} memakai struktur kompetensi, bukan level kognitif.` };
  }

  const subjectContext = Object.fromEntries(
    SUBJECT_CONTEXT_KEYS.filter((k) => subject.raw[k] !== undefined).map((k) => [k, subject.raw[k]]),
  );

  const sections = [
    `Kamu adalah penyusun soal Tes Kemampuan Akademik (TKA) untuk jenjang ${framework.jenjangName}, mengikuti Kerangka Asesmen BSKAP No. ${framework.regulation.number}.`,
    `Buat ${req.count} soal pilihan ganda sederhana (tepat 1 jawaban benar, 4–5 opsi A–E) dengan tingkat kesulitan ${DIFFICULTY_LABEL[req.difficulty]}.`,
    [
      "## Posisi dalam kerangka",
      `Mata uji: ${subject.fullName} (${subject.code})`,
      `${subject.structure === "kompetensi_subkompetensi" ? "Kompetensi" : "Elemen/Materi"}: ${domain.name} (${domain.code})${domain.description ? ` — ${domain.description}` : ""}`,
      `${subject.structure === "kompetensi_subkompetensi" ? "Subkompetensi" : "Sub-elemen/Submateri"}: ${subdomain.name} (${subdomain.code})`,
      subdomain.description && `Deskripsi: ${subdomain.description}`,
    ]
      .filter(Boolean)
      .join("\n"),
    subdomain.competencies.length > 0 && `## Kompetensi yang diukur\n${bullets(subdomain.competencies)}`,
    subdomain.scope.length > 0 && `## Cakupan (soal HARUS berada di dalam cakupan ini)\n${bullets(subdomain.scope)}`,
    subdomain.limits && `## Batasan (soal TIDAK BOLEH keluar dari batasan ini)\n${subdomain.limits}`,
    level &&
      [
        `## Level kognitif target: ${level.code} — ${level.name}${level.nameEn ? ` (${level.nameEn})` : ""}`,
        level.description,
        level.processes.length > 0 && `Proses berpikir yang boleh diukur:\n${bullets(level.processes.map((p) => `${p.name}: ${p.description}`))}`,
      ]
        .filter(Boolean)
        .join("\n"),
    Object.keys(subjectContext).length > 0 &&
      `## Karakteristik mata uji (ikuti untuk stimulus, teks, dan konteks)\n${JSON.stringify(subjectContext, null, 1)}`,
    [
      "## Aturan penulisan",
      bullets([
        "Bahasa Indonesia baku (kecuali mata uji bahasa asing: gunakan bahasa sasaran untuk stimulus & soal).",
        "Rumus matematika memakai KaTeX: $...$ inline, $$...$$ blok.",
        "Setiap soal disertai pembahasan singkat yang menjelaskan kenapa kunci benar.",
        "Pengecoh harus masuk akal dan mencerminkan miskonsepsi umum murid, bukan jawaban asal.",
        "Jangan menyalin soal resmi yang sudah dipublikasikan.",
      ]),
    ].join("\n"),
  ];

  return { ok: true, ref, level, prompt: sections.filter(Boolean).join("\n\n") };
}
