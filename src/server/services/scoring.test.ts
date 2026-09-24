import { describe, expect, it } from "vitest";
import { scoreAttempt, scoreQuestion, type ScorableQuestion } from "./scoring";

const singleChoice: ScorableQuestion = {
  questionId: 1,
  subtopicId: 10,
  options: [
    { id: 101, isCorrect: false, scoreWeight: null },
    { id: 102, isCorrect: true, scoreWeight: null },
    { id: 103, isCorrect: false, scoreWeight: null },
    { id: 104, isCorrect: false, scoreWeight: null },
  ],
};

const tkp: ScorableQuestion = {
  questionId: 2,
  subtopicId: 20,
  options: [
    { id: 201, isCorrect: null, scoreWeight: 3 },
    { id: 202, isCorrect: null, scoreWeight: 5 },
    { id: 203, isCorrect: null, scoreWeight: 1 },
    { id: 204, isCorrect: null, scoreWeight: 2 },
    { id: 205, isCorrect: null, scoreWeight: 4 },
  ],
};

describe("scoreQuestion — standard", () => {
  it("benar = 1 poin default", () => {
    expect(scoreQuestion("standard", singleChoice, 102)).toMatchObject({
      score: 1,
      maxScore: 1,
      isCorrect: true,
      answered: true,
    });
  });

  it("pakai points_override kalau ada", () => {
    const q = { ...singleChoice, pointsOverride: 3 };
    expect(scoreQuestion("standard", q, 102).score).toBe(3);
    expect(scoreQuestion("standard", q, 101)).toMatchObject({ score: 0, maxScore: 3 });
  });

  it("kosong = 0 dan answered false", () => {
    expect(scoreQuestion("standard", singleChoice, null)).toMatchObject({
      score: 0,
      answered: false,
      isCorrect: false,
    });
  });

  it("opsi milik soal lain dianggap tidak dijawab", () => {
    expect(scoreQuestion("standard", singleChoice, 202)).toMatchObject({
      score: 0,
      answered: false,
    });
  });
});

describe("scoreQuestion — twk_tiu", () => {
  it("benar +5, salah 0, override diabaikan", () => {
    const q = { ...singleChoice, pointsOverride: 3 };
    expect(scoreQuestion("twk_tiu", q, 102)).toMatchObject({ score: 5, maxScore: 5 });
    expect(scoreQuestion("twk_tiu", q, 103)).toMatchObject({ score: 0, maxScore: 5 });
    expect(scoreQuestion("twk_tiu", q, undefined).score).toBe(0);
  });
});

describe("scoreQuestion — tkp", () => {
  it("skor = bobot opsi yang dipilih", () => {
    expect(scoreQuestion("tkp", tkp, 201)).toMatchObject({
      score: 3,
      maxScore: 5,
      isCorrect: false,
    });
    expect(scoreQuestion("tkp", tkp, 202)).toMatchObject({ score: 5, isCorrect: true });
  });

  it("kosong = 0", () => {
    expect(scoreQuestion("tkp", tkp, null)).toMatchObject({ score: 0, maxScore: 5 });
  });
});

describe("scoreAttempt", () => {
  it("menjumlahkan total dan maksimum", () => {
    const q2 = { ...singleChoice, questionId: 3 };
    const result = scoreAttempt(
      "twk_tiu",
      [singleChoice, q2],
      new Map([
        [1, 102],
        [3, 101],
      ]),
    );
    expect(result.totalScore).toBe(5);
    expect(result.maxScore).toBe(10);
    expect(result.questions).toHaveLength(2);
  });
});
