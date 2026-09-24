// Agregasi skor per subtopik/topik. Hasil `summarizeBySubtopic` disimpan
// ke `attempt_subtopic_scores` saat finalize (lihat ARCHITECTURE §3.2).

import type { QuestionScore } from "./scoring";

export type SubtopicSummary = {
  subtopicId: number;
  correctCount: number;
  totalCount: number;
  score: number;
  maxScore: number;
  /** 0–100, dibulatkan 2 desimal. */
  percentage: number;
};

export type TopicSummary = Omit<SubtopicSummary, "subtopicId"> & {
  topicId: number;
};

export type Trend = "up" | "down" | "flat";

function toPercentage(score: number, maxScore: number) {
  if (maxScore <= 0) return 0;
  return Math.round((score / maxScore) * 10000) / 100;
}

type Totals = Omit<SubtopicSummary, "subtopicId" | "percentage">;

function accumulate<K>(items: Iterable<[K, Totals]>) {
  const map = new Map<K, Totals>();
  for (const [key, t] of items) {
    const acc = map.get(key) ?? { correctCount: 0, totalCount: 0, score: 0, maxScore: 0 };
    acc.correctCount += t.correctCount;
    acc.totalCount += t.totalCount;
    acc.score += t.score;
    acc.maxScore += t.maxScore;
    map.set(key, acc);
  }
  return map;
}

export function summarizeBySubtopic(scores: QuestionScore[]): SubtopicSummary[] {
  const map = accumulate(
    scores.map((q) => [
      q.subtopicId,
      { correctCount: q.isCorrect ? 1 : 0, totalCount: 1, score: q.score, maxScore: q.maxScore },
    ]),
  );
  return [...map].map(([subtopicId, t]) => ({
    subtopicId,
    ...t,
    percentage: toPercentage(t.score, t.maxScore),
  }));
}

export function summarizeByTopic(
  subtopics: SubtopicSummary[],
  topicIdBySubtopic: ReadonlyMap<number, number>,
): TopicSummary[] {
  const map = accumulate(
    subtopics.flatMap((s) => {
      const topicId = topicIdBySubtopic.get(s.subtopicId);
      const totals: Totals = {
        correctCount: s.correctCount,
        totalCount: s.totalCount,
        score: s.score,
        maxScore: s.maxScore,
      };
      return topicId === undefined ? [] : [[topicId, totals] as [number, Totals]];
    }),
  );
  return [...map].map(([topicId, t]) => ({
    topicId,
    ...t,
    percentage: toPercentage(t.score, t.maxScore),
  }));
}

/** Subtopik dengan persentase terendah; seri → yang soalnya lebih banyak. */
export function findWeakestSubtopic(
  summaries: SubtopicSummary[],
  minQuestions = 1,
): SubtopicSummary | undefined {
  return summaries
    .filter((s) => s.totalCount >= minQuestions)
    .reduce<SubtopicSummary | undefined>((weakest, s) => {
      if (!weakest) return s;
      if (s.percentage < weakest.percentage) return s;
      if (s.percentage === weakest.percentage && s.totalCount > weakest.totalCount) return s;
      return weakest;
    }, undefined);
}

/** Bandingkan persentase attempt sebelumnya vs sekarang di subtopik yang sama. */
export function compareTrend(previous: number, current: number, threshold = 5): Trend {
  const delta = current - previous;
  if (delta >= threshold) return "up";
  if (delta <= -threshold) return "down";
  return "flat";
}
