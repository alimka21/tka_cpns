import { describe, expect, it } from "vitest";
import {
  compareTrend,
  findWeakestSubtopic,
  summarizeBySubtopic,
  summarizeByTopic,
} from "./analytics";
import { scoreAttempt, type QuestionScore, type ScorableQuestion } from "./scoring";

const q = (subtopicId: number, isCorrect: boolean, score = isCorrect ? 5 : 0): QuestionScore => ({
  questionId: Math.random(),
  subtopicId,
  answered: true,
  completeness: "complete",
  isCorrect,
  score,
  maxScore: 5,
});

describe("summarizeBySubtopic", () => {
  it("mengelompokkan dan menghitung persentase", () => {
    const result = summarizeBySubtopic([q(1, true), q(1, false), q(2, true)]);
    expect(result).toEqual([
      { subtopicId: 1, correctCount: 1, totalCount: 2, score: 5, maxScore: 10, percentage: 50 },
      { subtopicId: 2, correctCount: 1, totalCount: 1, score: 5, maxScore: 5, percentage: 100 },
    ]);
  });

  it("persentase dibulatkan 2 desimal", () => {
    const [s] = summarizeBySubtopic([q(1, true), q(1, false), q(1, false)]);
    expect(s.percentage).toBe(33.33);
  });
});

describe("summarizeByTopic", () => {
  it("menggabungkan subtopik ke topiknya", () => {
    const subs = summarizeBySubtopic([q(1, true), q(2, false), q(3, true)]);
    const topics = summarizeByTopic(
      subs,
      new Map([
        [1, 100],
        [2, 100],
        [3, 200],
      ]),
    );
    expect(topics).toEqual([
      { topicId: 100, correctCount: 1, totalCount: 2, score: 5, maxScore: 10, percentage: 50 },
      { topicId: 200, correctCount: 1, totalCount: 1, score: 5, maxScore: 5, percentage: 100 },
    ]);
  });
});

describe("findWeakestSubtopic", () => {
  it("memilih persentase terendah, seri → soal lebih banyak", () => {
    const subs = summarizeBySubtopic([q(1, false), q(2, false), q(2, false), q(3, true)]);
    expect(findWeakestSubtopic(subs)?.subtopicId).toBe(2);
  });

  it("abaikan subtopik dengan soal terlalu sedikit", () => {
    const subs = summarizeBySubtopic([q(1, false), q(2, true), q(2, false)]);
    expect(findWeakestSubtopic(subs, 2)?.subtopicId).toBe(2);
    expect(findWeakestSubtopic([], 1)).toBeUndefined();
  });
});

describe("compareTrend", () => {
  it("naik / turun / stabil", () => {
    expect(compareTrend(40, 60)).toBe("up");
    expect(compareTrend(60, 40)).toBe("down");
    expect(compareTrend(50, 52)).toBe("flat");
  });
});

describe("soal grup stimulus", () => {
  it("tiap soal di satu stimulus dianalisis per subdomainnya sendiri", () => {
    // Satu stimulus, tiga soal dengan subdomain & bentuk berbeda.
    const group: ScorableQuestion[] = [
      { questionId: 1, subtopicId: 7, type: "pg", options: [{ id: 11, isCorrect: true }, { id: 12, isCorrect: false }] },
      { questionId: 2, subtopicId: 8, type: "pgk_mcma", options: [{ id: 21, isCorrect: true }, { id: 22, isCorrect: true }, { id: 23, isCorrect: false }] },
      {
        questionId: 3,
        subtopicId: 7,
        type: "pgk_kategori",
        categoryLabels: ["Sesuai", "Tidak Sesuai"],
        options: [
          { id: 31, isCorrect: false, correctCategory: "Sesuai" },
          { id: 32, isCorrect: false, correctCategory: "Tidak Sesuai" },
        ],
      },
    ];
    const scored = scoreAttempt(
      group,
      new Map([
        [1, { type: "pg" as const, optionId: 11 }],
        [2, { type: "pgk_mcma" as const, optionIds: [21] }],
        [3, { type: "pgk_kategori" as const, answers: [{ optionId: 31, category: "Sesuai" }, { optionId: 32, category: "Tidak Sesuai" }] }],
      ]),
    );
    expect(summarizeBySubtopic(scored.questions)).toEqual([
      { subtopicId: 7, correctCount: 2, totalCount: 2, score: 2, maxScore: 2, percentage: 100 },
      { subtopicId: 8, correctCount: 0, totalCount: 1, score: 0, maxScore: 1, percentage: 0 },
    ]);
  });
});
