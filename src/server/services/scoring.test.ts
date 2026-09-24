import { describe, expect, it } from "vitest";
import { scoreAttempt, scoreQuestion, type ScorableQuestion } from "./scoring";

const question: ScorableQuestion = {
  questionId: 1,
  subtopicId: 10,
  options: [
    { id: 101, isCorrect: false },
    { id: 102, isCorrect: true },
    { id: 103, isCorrect: false },
    { id: 104, isCorrect: false },
  ],
};

describe("scoreQuestion", () => {
  it("benar = 1 poin default", () => {
    expect(scoreQuestion(question, 102)).toMatchObject({
      score: 1,
      maxScore: 1,
      isCorrect: true,
      answered: true,
    });
  });

  it("salah = 0", () => {
    expect(scoreQuestion(question, 101)).toMatchObject({ score: 0, isCorrect: false, answered: true });
  });

  it("pakai points_override kalau ada", () => {
    const q = { ...question, pointsOverride: 3 };
    expect(scoreQuestion(q, 102).score).toBe(3);
    expect(scoreQuestion(q, 101)).toMatchObject({ score: 0, maxScore: 3 });
  });

  it("kosong = 0 dan answered false", () => {
    expect(scoreQuestion(question, null)).toMatchObject({
      score: 0,
      answered: false,
      isCorrect: false,
    });
  });

  it("opsi milik soal lain dianggap tidak dijawab", () => {
    expect(scoreQuestion(question, 999)).toMatchObject({ score: 0, answered: false });
  });
});

describe("scoreAttempt", () => {
  it("menjumlahkan total dan maksimum", () => {
    const q2 = { ...question, questionId: 3, pointsOverride: 2 };
    const result = scoreAttempt(
      [question, q2],
      new Map([
        [1, 102],
        [3, 101],
      ]),
    );
    expect(result.totalScore).toBe(1);
    expect(result.maxScore).toBe(3);
    expect(result.questions).toHaveLength(2);
  });
});
