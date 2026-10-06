import { describe, expect, it } from "vitest";
import { mapAiQuestions, mathRenders, normalizeText, parseAiStimulus, refersToMissingText, fillPlan, type AiMappingContext } from "./ai-questions";

const ctx = (p: Partial<AiMappingContext> = {}): AiMappingContext => ({
  type: "pg",
  subtopicId: 7,
  difficulty: "medium",
  cognitiveLevel: "L2",
  existingTexts: [],
  ...p,
});

const pg = (questionText: string, extra: Record<string, unknown> = {}) => ({
  questionText,
  explanation: "Karena $2+3=5$.",
  options: [
    { text: "4", isCorrect: false },
    { text: "5", isCorrect: true },
    { text: "6", isCorrect: false },
    { text: "7", isCorrect: false },
  ],
  ...extra,
});

describe("mapAiQuestions", () => {
  it("memetakan soal PG sah ke QuestionInput pending_review", () => {
    const r = mapAiQuestions({ questions: [pg("Berapa hasil $2 + 3$ ?")] }, ctx({ imageUrl: "/gambar/3" }));
    expect(r.rejected).toEqual([]);
    expect(r.valid[0]).toMatchObject({
      type: "pg",
      subtopicId: 7,
      status: "pending_review",
      imageUrl: "/gambar/3",
      cognitiveLevel: "L2",
      options: [{ label: "A" }, { label: "B", isCorrect: true }, { label: "C" }, { label: "D" }],
    });
  });

  it("membuang soal rusak tapi mempertahankan yang sah", () => {
    const r = mapAiQuestions(
      {
        questions: [
          pg("Soal sah pertama tentang penjumlahan"),
          pg("Dua kunci padahal PG tunggal", { options: [{ text: "a", isCorrect: true }, { text: "b", isCorrect: true }, { text: "c" }, { text: "d" }] }),
          pg("Opsi kembar tidak boleh ada di sini", { options: [{ text: "5", isCorrect: true }, { text: "5" }, { text: "6" }, { text: "7" }] }),
          pg("Rumus rusak $\\frac{1}{$ di sini"),
          { questionText: "tanpa opsi" },
          pg("Soal sah pertama tentang penjumlahan!"),
        ],
      },
      ctx(),
    );
    expect(r.valid).toHaveLength(1);
    expect(r.rejected).toHaveLength(5);
    expect(r.rejected.join(" ")).toMatch(/kunci/);
    expect(r.rejected.join(" ")).toMatch(/opsi yang sama/);
    expect(r.rejected.join(" ")).toMatch(/KaTeX/);
    expect(r.rejected.join(" ")).toMatch(/sudah ada/);
  });

  it("menolak duplikat soal bank yang sudah ada", () => {
    const r = mapAiQuestions({ questions: [pg("Berapa hasil 2 + 3?")] }, ctx({ existingTexts: ["berapa hasil 2+3"] }));
    expect(r.valid).toHaveLength(0);
  });

  it("PGK Kategori: pasangan & kategori dinormalisasi", () => {
    const r = mapAiQuestions(
      {
        questions: [
          {
            questionText: "Tentukan benar atau salah pernyataan berikut.",
            categoryLabels: ["benar", "salah"],
            explanation: "Cek satu per satu.",
            options: [
              { text: "2 bilangan prima", category: "BENAR" },
              { text: "9 bilangan prima", category: "salah" },
              { text: "11 bilangan prima", category: "Benar" },
            ],
          },
        ],
      },
      ctx({ type: "pgk_kategori" }),
    );
    expect(r.rejected).toEqual([]);
    expect(r.valid[0]).toMatchObject({ categoryLabels: ["Benar", "Salah"], options: [{ correctCategory: "Benar" }, { correctCategory: "Salah" }, { correctCategory: "Benar" }] });
  });

  it("envelope salah → ditolak seluruhnya", () => {
    expect(mapAiQuestions([1, 2], ctx()).valid).toHaveLength(0);
  });
});

describe("helper", () => {
  it("normalizeText & mathRenders", () => {
    expect(normalizeText("  Berapa  hasil 2+3? ")).toBe("berapa hasil 2 3");
    expect(mathRenders("ok $x^2$ dan $$\\frac{1}{2}$$")).toBe(true);
    expect(mathRenders("rusak $\\frac{1}{$")).toBe(false);
  });
});

describe("bentuk campuran & bacaan", () => {
  it("campuran: tiap soal memakai type-nya sendiri; tanpa type ditolak", () => {
    const r = mapAiQuestions(
      {
        questions: [
          { ...pg("Soal PG dalam grup bacaan"), type: "pg" },
          {
            type: "pgk_kategori",
            questionText: "Tentukan kesesuaian pernyataan dengan bacaan.",
            categoryLabels: ["Sesuai", "Tidak Sesuai"],
            explanation: "Lihat paragraf 2.",
            options: [{ text: "a satu", category: "Sesuai" }, { text: "b dua", category: "Tidak Sesuai" }, { text: "c tiga", category: "Sesuai" }],
          },
          pg("Soal tanpa type harus ditolak"),
        ],
      },
      ctx({ type: "campuran" }),
    );
    expect(r.valid.map((v) => v.type)).toEqual(["pg", "pgk_kategori"]);
    expect(r.rejected[0]).toMatch(/bentuk soal/);
  });

  it("parseAiStimulus", () => {
    expect(parseAiStimulus({ stimulus: { title: "Hutan Mangrove", content: "x".repeat(100) } })).toEqual({ title: "Hutan Mangrove", content: "x".repeat(100) });
    expect(parseAiStimulus({ stimulus: { title: "Pendek", content: "terlalu pendek" } })).toBeNull();
    expect(parseAiStimulus({ questions: [] })).toBeNull();
  });
});

describe("grup multi-subtopik", () => {
  it("subtopicCode dipetakan ke id; tanpa kode = subtopik utama; kode asing ditolak", () => {
    const r = mapAiQuestions(
      {
        questions: [
          { ...pg("Soal untuk informasi tersurat"), subtopicCode: "SMP-BIND-D1-S3" },
          { ...pg("Soal untuk inferensi bacaan"), subtopicCode: "smp-bind-d2-s1" },
          pg("Soal tanpa kode subtopik"),
          { ...pg("Soal subtopik nyasar"), subtopicCode: "SMP-MTK-D1-S1" },
        ],
      },
      ctx({ subtopicId: 11, subtopicByCode: { "SMP-BIND-D1-S3": 11, "SMP-BIND-D2-S1": 22 } }),
    );
    expect(r.valid.map((v) => v.subtopicId)).toEqual([11, 22, 11]);
    expect(r.rejected[0]).toMatch(/di luar pilihan/);
  });
});

describe("refersToMissingText", () => {
  const passage = "Lorem ipsum dolor sit amet. ".repeat(10);
  it("menolak rujukan ke teks yang tidak ditulis", () => {
    expect(refersToMissingText("Berdasarkan teks tersebut, manakah gagasan utama paragraf kedua?")).toBe(true);
    expect(refersToMissingText("Istilah 'disparitas' pada paragraf ketiga teks tersebut bermakna …")).toBe(true);
    expect(refersToMissingText("Bacalah teks berikut!\n\nBerdasarkan teks, …")).toBe(true);
  });
  it("menerima soal yang memuat bacaannya sendiri", () => {
    expect(refersToMissingText(`Bacalah teks berikut!\n\n${passage}\n\nBerdasarkan teks tersebut, simpulan yang tepat adalah …`)).toBe(false);
    expect(refersToMissingText(`${passage} Berdasarkan data tersebut, …`)).toBe(false);
    expect(refersToMissingText("Hasil dari $2 + 3$ adalah …")).toBe(false);
  });
  it("mapAiQuestions: soal tunggal yatim ditolak bila standalone", () => {
    const raw = {
      questions: [
        {
          questionText: "Berdasarkan teks tersebut, makna kata 'infrastruktur' adalah …",
          options: [{ text: "a", isCorrect: true }, { text: "b" }, { text: "c" }, { text: "d" }],
          explanation: "x",
        },
      ],
    };
    const base = { type: "pg" as const, subtopicId: 1, difficulty: "medium" as const, cognitiveLevel: null, existingTexts: [] };
    expect(mapAiQuestions(raw, { ...base, standalone: true }).valid).toHaveLength(0);
    expect(mapAiQuestions(raw, base).valid).toHaveLength(1);
  });
});

describe("fillPlan", () => {
  const q = (type: "pg" | "pgk_mcma", subtopicId: number) =>
    ({ type, subtopicId, questionText: `soal ${type} ${subtopicId}`, difficulty: "medium", cognitiveLevel: null, status: "pending_review", options: [] }) as never;
  it("mengisi slot sesuai bentuk & subtopik, tingkat mengikuti slot, sisanya ditolak", () => {
    const plan = [
      { subdomainCode: "A", subtopicId: 1, form: "pg" as const, difficulty: "hard" as const, cognitiveLevel: "L3" },
      { subdomainCode: "B", subtopicId: 2, form: "pgk_mcma" as const, difficulty: "easy" as const, cognitiveLevel: "L1" },
    ];
    const r = fillPlan([q("pg", 1), q("pg", 1), q("pgk_mcma", 1)], plan);
    expect(r.accepted).toHaveLength(1);
    expect(r.accepted[0]).toMatchObject({ difficulty: "hard", cognitiveLevel: "L3" });
    expect(r.rejected).toHaveLength(2);
    expect(r.left.map((p) => p.subdomainCode)).toEqual(["B"]);
  });
});
