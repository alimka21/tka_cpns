import { describe, expect, it } from "vitest";
import { mapAiQuestions, mathRenders, normalizeText, type AiMappingContext } from "./ai-questions";

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
