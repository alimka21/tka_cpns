import { describe, expect, it } from "vitest";
import { selectPracticeQuestions, type PracticeCandidate } from "./practice-selection";

const q = (id: number, subtopicId: number, stimulusId: number | null = null, stimulusOrder: number | null = null): PracticeCandidate => ({
  id,
  subtopicId,
  stimulusId,
  stimulusOrder,
});
const fixed = () => 0.5;
const day = (n: number) => new Date(Date.UTC(2026, 8, n));

describe("selectPracticeQuestions", () => {
  it("hanya subdomain target, dibagi bergiliran", () => {
    const cands = [q(1, 10), q(2, 10), q(3, 10), q(4, 20), q(5, 20), q(6, 30)];
    const ids = selectPracticeQuestions([10, 20], cands, new Map(), 4, fixed);
    expect(ids).toHaveLength(4);
    expect(ids.filter((id) => id <= 3)).toHaveLength(2);
    expect(ids.filter((id) => id === 4 || id === 5)).toHaveLength(2);
    expect(ids).not.toContain(6);
  });

  it("belum pernah dikerjakan dulu, lalu yang paling lama", () => {
    const cands = [q(1, 10), q(2, 10), q(3, 10)];
    const seen = new Map([
      [1, day(20)],
      [2, day(5)],
    ]);
    expect(selectPracticeQuestions([10], cands, seen, 3, fixed)).toEqual([3, 2, 1]);
  });

  it("grup stimulus diambil utuh & berurutan, termasuk soal subdomain lain", () => {
    const cands = [q(1, 10, 7, 2), q(2, 99, 7, 1), q(3, 10)];
    const ids = selectPracticeQuestions([10], cands, new Map([[3, day(1)]]), 3, fixed);
    expect(ids).toEqual([2, 1, 3]);
  });

  it("grup yang tidak muat dilewati, bukan dipotong", () => {
    const cands = [q(1, 10, 7, 1), q(2, 10, 7, 2), q(3, 10, 7, 3), q(4, 10)];
    expect(selectPracticeQuestions([10], cands, new Map(), 2, fixed)).toEqual([4]);
  });

  it("bank kurang → kembalikan yang ada saja", () => {
    expect(selectPracticeQuestions([10, 20], [q(1, 10)], new Map(), 10, fixed)).toEqual([1]);
    expect(selectPracticeQuestions([10], [], new Map(), 10, fixed)).toEqual([]);
  });
});
