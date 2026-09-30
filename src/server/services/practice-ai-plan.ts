// Bagian murni Latihan AI (tanpa DB) supaya bisa dites.

import type { Difficulty } from "@/lib/validation/enums";

/** Maksimal soal AI per sesi latihan. */
export const PRACTICE_AI_MAX = 10;

export type PracticeAiNotice =
  | { kind: "added"; count: number }
  | { kind: "no_key" }
  | { kind: "limit" }
  | { kind: "failed"; message: string };

/**
 * Bagi kekurangan soal ke subdomain target: yang soal bank-nya paling sedikit
 * dapat lebih dulu (bergiliran). Fungsi murni.
 */
export function planAiShortfall(targets: number[], bankPicked: ReadonlyMap<number, number>, shortfall: number) {
  const order = [...targets].sort((a, b) => (bankPicked.get(a) ?? 0) - (bankPicked.get(b) ?? 0));
  const plan = new Map<number, number>();
  for (let i = 0; i < Math.min(shortfall, PRACTICE_AI_MAX); i++) {
    const t = order[i % order.length];
    plan.set(t, (plan.get(t) ?? 0) + 1);
  }
  return [...plan].map(([subtopicId, n]) => ({ subtopicId, count: n }));
}

/** Tingkat kesulitan & level mengikuti akurasi siswa di subdomain itu. */
export function practiceDifficulty(accuracy: number | null): Difficulty {
  if (accuracy == null || accuracy < 50) return "easy";
  return accuracy < 75 ? "medium" : "hard";
}

