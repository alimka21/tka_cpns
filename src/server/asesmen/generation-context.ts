// Rakit konteks prompt generate soal (Fase 2, Gemini) dari kerangka
// asesmen. Tujuannya: soal AI tidak keluar dari cakupan/batasan subdomain
// dan sesuai level kognitif resmi. Output AI tetap wajib divalidasi Zod &
// direview manual (docs/SRS.md §AI Generation).

import type { Difficulty, QuestionType } from "@/lib/validation/enums";
import { findSubdomain, type CognitiveLevel, type SubdomainRef } from "./index";

const DIFFICULTY_LABEL: Record<Difficulty, string> = { easy: "mudah", medium: "sedang", hard: "sulit" };

/** Ciri konkret tiap tingkat kesulitan — supaya "sulit" benar-benar sulit, bukan sekadar label. */
const DIFFICULTY_GUIDE: Record<Difficulty, string[]> = {
  easy: [
    "Cukup 1–2 langkah penyelesaian; informasi yang dibutuhkan tersedia langsung di soal/teks.",
    "Konteks sederhana dan akrab; pengecoh tetap masuk akal (bukan jawaban asal).",
  ],
  medium: [
    "Butuh 2–3 langkah: memahami konteks, memilih konsep/prosedur yang tepat, lalu menghitung atau menyimpulkan.",
    "Konteks kehidupan nyata yang familiar; minimal satu pengecoh berasal dari kesalahan langkah yang umum.",
  ],
  hard: [
    "Butuh minimal 3 langkah atau penalaran: menggabungkan beberapa informasi/konsep, menganalisis, mengevaluasi, atau menyimpulkan.",
    "Konteks tidak rutin atau data yang harus diolah dulu (tabel, perbandingan, kondisi bersyarat); jawaban TIDAK bisa diperoleh dengan satu rumus langsung.",
    "Semua pengecoh berasal dari miskonsepsi atau kesalahan langkah yang masuk akal — siswa yang hanya setengah paham harus bisa terjebak.",
  ],
};

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

/** Karakteristik soal per jenjang (docs/ATURAN_PAKET.md). */
const JENJANG_CHARACTER: Record<string, string> = {
  SMA: bullets([
    "Mayoritas soal berbasis stimulus: diawali teks bacaan, grafik, infografis, tabel, atau studi kasus nyata — bukan hafalan rumus langsung.",
    "Menguji penalaran: literasi, numerasi, analisis data, dan pemecahan masalah.",
    "Tidak ada soal esai; hanya PG, PGK MCMA, dan PGK Kategori.",
  ]),
  SMP: bullets([
    "Struktur sama dengan SD; kompleksitas materi dan panjang stimulus bacaan disesuaikan perkembangan kognitif siswa SMP.",
    "Tidak ada soal esai; hanya PG, PGK MCMA, dan PGK Kategori.",
  ]),
  SD: bullets([
    "Bahasa sederhana dan konteks dekat dengan kehidupan anak; stimulus bacaan pendek sesuai perkembangan kognitif siswa SD.",
    "Tidak ada soal esai; hanya PG, PGK MCMA, dan PGK Kategori.",
  ]),
};

export type GenerationRequest = {
  subdomainCode: string;
  difficulty: Difficulty;
  count: number;
  /** Wajib untuk mata uji yang punya level kognitif; dilarang untuk mata uji bahasa. */
  cognitiveLevel?: string | null;
  /** Bentuk soal; default PG sederhana. "campuran" = AI memilih per soal. */
  form?: QuestionType | "campuran";
};

const FORM_SENTENCE: Record<QuestionType | "campuran", string> = {
  campuran:
    "soal dengan bentuk campuran — boleh pilihan ganda sederhana, PG kompleks multi jawaban, dan PG kompleks kategori (Benar/Salah, Sesuai/Tidak Sesuai, atau Ya/Tidak); usahakan ada lebih dari satu bentuk",
  pg: "soal pilihan ganda sederhana (tepat 1 jawaban benar, 4–5 opsi A–E)",
  pgk_mcma: "soal pilihan ganda kompleks multi jawaban (4–5 opsi, jawaban benar lebih dari satu tetapi tidak semua opsi)",
  pgk_kategori:
    "soal pilihan ganda kompleks kategori (3–5 pernyataan; tiap pernyataan diberi kategori Benar/Salah, Sesuai/Tidak Sesuai, atau Ya/Tidak)",
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
    `Buat ${req.count} ${FORM_SENTENCE[req.form ?? "pg"]} dengan tingkat kesulitan ${DIFFICULTY_LABEL[req.difficulty]}.`,
    `## Ciri tingkat kesulitan "${DIFFICULTY_LABEL[req.difficulty]}" (WAJIB dipenuhi setiap soal)\n${bullets(DIFFICULTY_GUIDE[req.difficulty])}`,
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
    JENJANG_CHARACTER[framework.jenjang] && `## Karakteristik soal TKA ${framework.jenjang}\n${JENJANG_CHARACTER[framework.jenjang]}`,
    [
      "## Aturan penulisan",
      bullets([
        "Bahasa Indonesia baku (kecuali mata uji bahasa asing: gunakan bahasa sasaran untuk stimulus & soal).",
        "Rumus matematika memakai KaTeX: $...$ inline, $$...$$ blok.",
        "Setiap soal disertai pembahasan singkat yang menjelaskan kenapa kunci benar.",
        "Pengecoh harus masuk akal dan mencerminkan miskonsepsi umum murid, bukan jawaban asal.",
        "Soal harus benar-benar mengukur kompetensi & cakupan subdomain di atas pada level kognitif target — bukan sekadar hafalan definisi atau rumus.",
        "Jangan menyalin soal resmi yang sudah dipublikasikan.",
      ]),
    ].join("\n"),
  ];

  return { ok: true, ref, level, prompt: sections.filter(Boolean).join("\n\n") };
}

// ── Prompt Gemini lengkap per mode (docs/AI_GENERATION.md §3) ─────────────

const OUTPUT_EXAMPLE: Record<QuestionType | "campuran", string> = {
  campuran: `{"questions":[{"type":"pg","questionText":"...","options":[{"text":"...","isCorrect":true},{"text":"...","isCorrect":false},{"text":"...","isCorrect":false},{"text":"...","isCorrect":false}],"explanation":"..."},{"type":"pgk_mcma","questionText":"... (Jawaban bisa lebih dari satu.)","options":[{"text":"...","isCorrect":true},{"text":"...","isCorrect":true},{"text":"...","isCorrect":false},{"text":"...","isCorrect":false}],"explanation":"..."},{"type":"pgk_kategori","questionText":"...","categoryLabels":["Sesuai","Tidak Sesuai"],"options":[{"text":"...","category":"Sesuai"},{"text":"...","category":"Tidak Sesuai"},{"text":"...","category":"Sesuai"}],"explanation":"..."}]}`,
  pg: `{"questions":[{"questionText":"...","options":[{"text":"...","isCorrect":false},{"text":"...","isCorrect":true},{"text":"...","isCorrect":false},{"text":"...","isCorrect":false}],"explanation":"..."}]}`,
  pgk_mcma: `{"questions":[{"questionText":"... (Jawaban bisa lebih dari satu.)","options":[{"text":"...","isCorrect":true},{"text":"...","isCorrect":false},{"text":"...","isCorrect":true},{"text":"...","isCorrect":false}],"explanation":"..."}]}`,
  pgk_kategori: `{"questions":[{"questionText":"Tentukan benar atau salah setiap pernyataan berikut.","categoryLabels":["Benar","Salah"],"options":[{"text":"pernyataan 1","category":"Benar"},{"text":"pernyataan 2","category":"Salah"},{"text":"pernyataan 3","category":"Benar"}],"explanation":"..."}]}`,
};

export type SourceQuestionForPrompt = {
  type: QuestionType;
  questionText: string;
  categoryLabels: [string, string] | null;
  explanation: string | null;
  options: { label: string; optionText: string; isCorrect: boolean; correctCategory: string | null }[];
};

export const VARIATION_STYLES = {
  angka: "Ganti bilangan/data/nama, pertahankan konteks, konsep, dan langkah penyelesaian yang sama.",
  konteks: "Ganti konteks/cerita/situasi dengan yang berbeda dan akrab bagi murid, konsep yang diuji tetap sama.",
  lebih_sulit: "Naikkan tingkat kesulitan satu tingkat: tambah satu langkah penalaran atau informasi pengecoh, konsep tetap sama.",
  lebih_mudah: "Turunkan tingkat kesulitan satu tingkat: sederhanakan angka/langkah, konsep tetap sama.",
  bebas: "Buat variasi yang beragam (angka, konteks, atau sudut pandang berbeda), konsep yang diuji tetap sama.",
} as const;
export type VariationStyle = keyof typeof VARIATION_STYLES;

export type AiPromptRequest = GenerationRequest & {
  form: QuestionType | "campuran";
  mode: "baru" | "variasi" | "gambar" | "grup";
  /** Mode grup: bacaan yang sudah ada (null = AI menulis bacaan baru). */
  stimulus?: { title: string; content: string } | null;
  /**
   * Mode grup: subtopik tambahan (mapel yang sama) — satu bacaan dipakai untuk
   * beberapa subtopik; tiap soal menyebut `subtopicCode`-nya.
   */
  extraSubdomainCodes?: string[];
  source?: SourceQuestionForPrompt;
  variation?: VariationStyle;
  /** Catatan admin tentang gambar (opsional). */
  imageNote?: string;
  /** Instruksi tambahan dari admin (opsional, dibatasi panjangnya). */
  extraInstruction?: string;
};

function describeSource(src: SourceQuestionForPrompt) {
  const opts = src.options
    .map((o) =>
      src.type === "pgk_kategori"
        ? `${o.label}. ${o.optionText} → ${o.correctCategory}`
        : `${o.label}. ${o.optionText}${o.isCorrect ? " (KUNCI)" : ""}`,
    )
    .join("\n");
  return [
    src.questionText,
    src.categoryLabels ? `Kategori: ${src.categoryLabels.join(" / ")}` : null,
    opts,
    src.explanation ? `Pembahasan: ${src.explanation}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildAiPrompt(req: AiPromptRequest): GenerationContext {
  const base = buildGenerationContext(req);
  if (!base.ok) return base;

  const modeSection =
    req.mode === "variasi" && req.source
      ? [
          "## Mode: modifikasi soal yang sudah ada",
          `Buat ${req.count} soal BARU yang merupakan variasi dari soal asal di bawah. ${VARIATION_STYLES[req.variation ?? "bebas"]}`,
          "Setiap variasi harus berbeda satu sama lain dan TIDAK boleh sama persis dengan soal asal. Hitung ulang kunci jawaban dengan teliti.",
          "### Soal asal",
          describeSource(req.source),
        ].join("\n")
      : req.mode === "grup"
        ? req.stimulus
          ? [
              "## Mode: soal grup berbasis bacaan/stimulus yang sudah ada",
              `Buat ${req.count} soal yang SEMUANYA hanya bisa dijawab dengan membaca stimulus di bawah (informasi tersurat, tersirat, atau penalaran dari isinya). Soal harus beragam dan tidak saling membocorkan jawaban.`,
              `### Stimulus: ${req.stimulus.title}`,
              req.stimulus.content,
            ].join("\n")
          : [
              "## Mode: soal grup — tulis bacaan/stimulus baru",
              "Tulis SATU stimulus orisinal (judul + isi) yang sesuai karakteristik mata uji di atas: teks bacaan 150–400 kata, atau data/tabel (tulis tabel sebagai teks rapi) bila mata ujinya numerik. Bahasa sesuai jenjang.",
              `Lalu buat ${req.count} soal yang SEMUANYA mengacu ke stimulus itu dan hanya bisa dijawab dengan membacanya. Soal harus beragam dan tidak saling membocorkan jawaban.`,
              'Tambahkan field "stimulus": {"title":"...","content":"..."} di tingkat teratas JSON, sejajar dengan "questions". Paragraf dipisah baris kosong (\\n\\n).',
            ].join("\n")
        : req.mode === "gambar"
        ? [
            "## Mode: soal berbasis gambar",
            `Gambar terlampir. Buat ${req.count} soal yang BERBEDA satu sama lain dan semuanya HANYA bisa dijawab dengan membaca/mengamati gambar tersebut (data, bentuk, label, atau situasi di gambar).`,
            "Jangan mengarang detail yang tidak ada di gambar. Rujuk gambar di teks soal, mis. \"Perhatikan gambar berikut.\"",
            "Bila gambar tidak relevan dengan subdomain di atas, tetap buat soal yang sejauh mungkin sesuai cakupan subdomain.",
            req.imageNote ? `Catatan dari admin tentang gambar: ${req.imageNote}` : null,
          ]
            .filter(Boolean)
            .join("\n")
        : null;

  // Grup multi-subtopik: daftar subtopik yang boleh dipakai + cakupan/batasannya.
  let multiSection: string | null = null;
  const extraCodes = [...new Set((req.extraSubdomainCodes ?? []).filter((c) => c !== req.subdomainCode))];
  if (req.mode === "grup" && extraCodes.length > 0) {
    const refs = [base.ref, ...extraCodes.map((c) => findSubdomain(c))];
    const bad = extraCodes.filter((_, i) => !refs[i + 1] || refs[i + 1]!.subject.code !== base.ref.subject.code);
    if (bad.length > 0) return { ok: false, error: `Subtopik tambahan harus dari mata uji yang sama: ${bad.join(", ")}.` };
    multiSection = [
      "## Subtopik yang dicakup grup ini",
      'Setiap soal WAJIB mengukur tepat satu subtopik berikut dan menuliskan kodenya di field "subtopicCode". Sebarkan soal ke subtopik yang BERBEDA — usahakan setiap subtopik minimal 1 soal.',
      ...refs.map((r) =>
        [
          `- ${r!.subdomain.code} — ${r!.subdomain.name} (topik: ${r!.domain.name})`,
          r!.subdomain.scope.length ? `  Cakupan: ${r!.subdomain.scope.join("; ")}` : null,
          r!.subdomain.limits ? `  Batasan: ${r!.subdomain.limits}` : null,
        ]
          .filter(Boolean)
          .join("\n"),
      ),
    ].join("\n");
  }

  const output = [
    "## Format output (WAJIB)",
    "Balas HANYA dengan JSON valid (tanpa teks lain, tanpa markdown) persis dengan struktur berikut:",
    OUTPUT_EXAMPLE[req.form],
    `Jumlah elemen "questions" tepat ${req.count}. Opsi TANPA huruf label (label A–E diberikan sistem).`,
    req.form === "pgk_kategori" || req.form === "campuran" ? 'PGK Kategori memakai "categoryLabels" ["Benar","Salah"], ["Sesuai","Tidak Sesuai"], atau ["Ya","Tidak"].' : null,
    req.form === "campuran" ? 'Setiap soal WAJIB punya field "type": "pg" | "pgk_mcma" | "pgk_kategori".' : null,
    req.mode === "grup" && !req.stimulus ? 'Contoh tingkat teratas: {"stimulus":{"title":"...","content":"..."},"questions":[...]}' : null,
    multiSection ? 'Setiap soal WAJIB punya field "subtopicCode" berisi salah satu kode subtopik di atas.' : null,
  ]
    .filter(Boolean)
    .join("\n");

  const extra = req.extraInstruction?.trim() ? `## Instruksi tambahan dari admin\n${req.extraInstruction.trim().slice(0, 500)}` : null;



  return { ...base, prompt: [base.prompt, modeSection, multiSection, extra, output].filter(Boolean).join("\n\n") };
}
