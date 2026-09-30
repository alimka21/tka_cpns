import { describe, expect, it } from "vitest";
import { planAiShortfall, practiceDifficulty, PRACTICE_AI_MAX } from "./practice-ai-plan";

describe("planAiShortfall", () => {
  it("subdomain dengan soal bank paling sedikit dapat duluan, bergiliran", () => {
    const plan = planAiShortfall([10, 20, 30], new Map([[10, 4], [20, 0], [30, 2]]), 4);
    expect(plan).toEqual([
      { subtopicId: 20, count: 2 },
      { subtopicId: 30, count: 1 },
      { subtopicId: 10, count: 1 },
    ]);
  });

  it("dibatasi PRACTICE_AI_MAX", () => {
    const total = planAiShortfall([1], new Map(), 50).reduce((n, p) => n + p.count, 0);
    expect(total).toBe(PRACTICE_AI_MAX);
    expect(planAiShortfall([1], new Map(), 0)).toEqual([]);
  });
});

describe("practiceDifficulty", () => {
  it("mengikuti akurasi", () => {
    expect(practiceDifficulty(null)).toBe("easy");
    expect(practiceDifficulty(30)).toBe("easy");
    expect(practiceDifficulty(60)).toBe("medium");
    expect(practiceDifficulty(80)).toBe("hard");
  });
});
