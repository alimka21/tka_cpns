import { describe, expect, it } from "vitest";
import { scoreAttempt, scoreQuestion, type ScorableQuestion } from "./scoring";

const pg: ScorableQuestion = {
  questionId: 1,
  subtopicId: 10,
  type: "pg",
  options: [
    { id: 101, isCorrect: false },
    { id: 102, isCorrect: true },
    { id: 103, isCorrect: false },
    { id: 104, isCorrect: false },
  ],
};

const mcma: ScorableQuestion = {
  questionId: 2,
  subtopicId: 11,
  type: "pgk_mcma",
  options: [
    { id: 201, isCorrect: true },
    { id: 202, isCorrect: false },
    { id: 203, isCorrect: true },
    { id: 204, isCorrect: false },
  ],
};

const kategori: ScorableQuestion = {
  questionId: 3,
  subtopicId: 12,
  type: "pgk_kategori",
  categoryLabels: ["Benar", "Salah"],
  options: [
    { id: 301, isCorrect: false, correctCategory: "Benar" },
    { id: 302, isCorrect: false, correctCategory: "Salah" },
    { id: 303, isCorrect: false, correctCategory: "Benar" },
  ],
};

const kat = (...pairs: [number, string][]) => ({
  type: "pgk_kategori" as const,
  answers: pairs.map(([optionId, category]) => ({ optionId, category })),
});

describe("scoreQuestion — PG", () => {
  it("benar = 1 poin default", () => {
    expect(scoreQuestion(pg, { type: "pg", optionId: 102 })).toMatchObject({
      score: 1,
      maxScore: 1,
      isCorrect: true,
      answered: true,
      completeness: "complete",
    });
  });

  it("salah = 0", () => {
    expect(scoreQuestion(pg, { type: "pg", optionId: 101 })).toMatchObject({ score: 0, isCorrect: false, answered: true });
  });

  it("pakai points_override kalau ada", () => {
    const q = { ...pg, pointsOverride: 3 };
    expect(scoreQuestion(q, { type: "pg", optionId: 102 }).score).toBe(3);
    expect(scoreQuestion(q, { type: "pg", optionId: 101 })).toMatchObject({ score: 0, maxScore: 3 });
  });

  it("kosong = 0 dan answered false", () => {
    expect(scoreQuestion(pg, null)).toMatchObject({ score: 0, answered: false, completeness: "blank" });
  });

  it("opsi milik soal lain dianggap tidak dijawab", () => {
    expect(scoreQuestion(pg, { type: "pg", optionId: 999 })).toMatchObject({ score: 0, answered: false });
  });

  it("bentuk jawaban tidak cocok dengan bentuk soal = tidak dijawab", () => {
    expect(scoreQuestion(pg, { type: "pgk_mcma", optionIds: [102] })).toMatchObject({ answered: false, score: 0 });
  });
});

describe("scoreQuestion — PGK MCMA", () => {
  it("benar penuh bila himpunan pilihan sama persis dengan kunci (urutan bebas)", () => {
    expect(scoreQuestion(mcma, { type: "pgk_mcma", optionIds: [203, 201] })).toMatchObject({ isCorrect: true, score: 1 });
  });

  it("sebagian kunci saja = 0 (tidak ada skor parsial)", () => {
    expect(scoreQuestion(mcma, { type: "pgk_mcma", optionIds: [201] })).toMatchObject({
      isCorrect: false,
      score: 0,
      answered: true,
    });
  });

  it("semua kunci + satu opsi salah = 0", () => {
    expect(scoreQuestion(mcma, { type: "pgk_mcma", optionIds: [201, 203, 204] }).score).toBe(0);
  });

  it("memilih semua opsi tidak otomatis benar", () => {
    expect(scoreQuestion(mcma, { type: "pgk_mcma", optionIds: [201, 202, 203, 204] }).isCorrect).toBe(false);
  });

  it("opsi asing diabaikan; kalau hanya opsi asing = tidak dijawab", () => {
    expect(scoreQuestion(mcma, { type: "pgk_mcma", optionIds: [201, 203, 999] })).toMatchObject({ isCorrect: true });
    expect(scoreQuestion(mcma, { type: "pgk_mcma", optionIds: [999] })).toMatchObject({ answered: false });
  });
});

describe("scoreQuestion — PGK Kategori", () => {
  it("semua pernyataan sesuai kunci = benar penuh", () => {
    expect(scoreQuestion(kategori, kat([301, "Benar"], [302, "Salah"], [303, "Benar"]))).toMatchObject({
      isCorrect: true,
      score: 1,
      completeness: "complete",
    });
  });

  it("satu pernyataan salah = 0", () => {
    expect(scoreQuestion(kategori, kat([301, "Benar"], [302, "Benar"], [303, "Benar"]))).toMatchObject({
      isCorrect: false,
      score: 0,
      completeness: "complete",
    });
  });

  it("baru sebagian dijawab = partial, dihitung dijawab tapi 0", () => {
    expect(scoreQuestion(kategori, kat([301, "Benar"], [302, "Salah"]))).toMatchObject({
      completeness: "partial",
      answered: true,
      isCorrect: false,
      score: 0,
    });
  });

  it("kategori di luar pasangan & pernyataan asing diabaikan", () => {
    expect(scoreQuestion(kategori, kat([301, "Sesuai"], [999, "Benar"]))).toMatchObject({ completeness: "blank" });
    expect(scoreQuestion(kategori, kat([301, "Benar"], [302, "Salah"], [303, "Mungkin"]))).toMatchObject({
      completeness: "partial",
    });
  });

  it("pernyataan ganda: jawaban pertama yang dipakai", () => {
    expect(
      scoreQuestion(kategori, kat([301, "Benar"], [301, "Salah"], [302, "Salah"], [303, "Benar"])).isCorrect,
    ).toBe(true);
  });
});

describe("scoreAttempt", () => {
  it("menjumlahkan total dan maksimum lintas bentuk soal", () => {
    const pg2 = { ...pg, questionId: 4, pointsOverride: 2 };
    const result = scoreAttempt(
      [pg, pg2, mcma, kategori],
      new Map([
        [1, { type: "pg" as const, optionId: 102 }],
        [4, { type: "pg" as const, optionId: 101 }],
        [2, { type: "pgk_mcma" as const, optionIds: [201, 203] }],
      ]),
    );
    expect(result.totalScore).toBe(2);
    expect(result.maxScore).toBe(5);
    expect(result.questions.map((q) => q.completeness)).toEqual(["complete", "complete", "complete", "blank"]);
  });
});
