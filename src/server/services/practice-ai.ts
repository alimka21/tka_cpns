// Latihan AI (Fase 2.5 langkah 6, docs/AI_GENERATION.md §5): bila bank soal
// kurang, buat soal privat untuk siswa itu memakai API key Gemini MILIKNYA.
// Soal tidak direview admin → validasi otomatis ketat (ai-questions.ts),
// label "Latihan AI", tidak masuk bank resmi & skor tes resmi, bisa dilaporkan.

import { and, count, eq, gte } from "drizzle-orm";
import { findSubdomain } from "@/server/asesmen";
import { buildAiPrompt } from "@/server/asesmen/generation-context";
import { db } from "@/server/db";
import { aiGenerationLogs, practiceQuestions, questions, subtopics } from "@/server/db/schema";
import { getGeminiKey } from "@/server/services/ai-key";
import { runAiGeneration } from "@/server/services/ai-generate";
import { geminiModel } from "@/server/services/gemini";
import { practiceDifficulty, type PracticeAiNotice } from "@/server/services/practice-ai-plan";

export { PRACTICE_AI_MAX, planAiShortfall, practiceDifficulty, type PracticeAiNotice } from "@/server/services/practice-ai-plan";

/** Batas panggilan Gemini per siswa per 24 jam — melindungi kuota key siswa dari klik berulang. */
export const PRACTICE_AI_DAILY_CALLS = 10;
export async function generatePracticeAiQuestions(
  userId: number,
  plan: { subtopicId: number; count: number }[],
  accuracyBySubtopic: ReadonlyMap<number, number>,
): Promise<{ ids: number[]; notice: PracticeAiNotice }> {
  if (plan.length === 0) return { ids: [], notice: { kind: "added", count: 0 } };
  const apiKey = await getGeminiKey(userId);
  if (!apiKey) return { ids: [], notice: { kind: "no_key" } };

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [{ n }] = await db
    .select({ n: count() })
    .from(aiGenerationLogs)
    .where(and(eq(aiGenerationLogs.userId, userId), eq(aiGenerationLogs.purpose, "practice"), gte(aiGenerationLogs.createdAt, since)));
  if (Number(n) + plan.length > PRACTICE_AI_DAILY_CALLS) return { ids: [], notice: { kind: "limit" } };

  const subRows = await db.select({ id: subtopics.id, code: subtopics.code }).from(subtopics);
  const codeOf = new Map(subRows.map((s) => [s.id, s.code]));

  const results = await Promise.all(
    plan.map(async ({ subtopicId, count: want }) => {
      const code = codeOf.get(subtopicId);
      const ref = code ? findSubdomain(code) : undefined;
      if (!code || !ref) return { ids: [] as number[], error: "Subdomain tidak dikenal." };
      const accuracy = accuracyBySubtopic.get(subtopicId) ?? null;
      const levels = ref.subject.cognitiveLevels.map((l) => l.code);
      const level = levels.length ? (accuracy != null && accuracy >= 50 ? levels[1] ?? levels[0] : levels[0]) : null;
      const difficulty = practiceDifficulty(accuracy);
      const form = want >= 3 ? "campuran" : "pg";

      const [bank, mine] = await Promise.all([
        db.select({ t: questions.questionText }).from(questions).where(eq(questions.subtopicId, subtopicId)),
        db
          .select({ t: practiceQuestions.questionText })
          .from(practiceQuestions)
          .where(and(eq(practiceQuestions.ownerUserId, userId), eq(practiceQuestions.subtopicId, subtopicId))),
      ]);

      const started = Date.now();
      const run = await runAiGeneration({
        apiKey,
        count: want,
        subtopicId,
        form,
        difficulty,
        cognitiveLevel: level,
        existingTexts: [...bank, ...mine].map((r) => r.t),
        prompt: (need, avoid) =>
          buildAiPrompt({
            mode: "baru",
            form,
            count: need,
            subdomainCode: code,
            difficulty,
            cognitiveLevel: level,
            extraInstruction: [
              "Soal untuk LATIHAN mandiri murid yang masih lemah di subdomain ini: bahasa jelas, pembahasan langkah demi langkah yang mengajarkan konsepnya.",
              avoid.length ? `Jangan mengulang soal berikut:\n${avoid.map((t) => `- ${t.slice(0, 160)}`).join("\n")}` : "",
            ]
              .filter(Boolean)
              .join("\n\n"),
          }),
      });

      const ids: number[] = [];
      for (const q of run.valid) {
        const [{ id }] = await db
          .insert(practiceQuestions)
          .values({
            ownerUserId: userId,
            subtopicId,
            type: q.type,
            questionText: q.questionText,
            categoryLabels: q.type === "pgk_kategori" ? [q.categoryLabels[0], q.categoryLabels[1]] : null,
            options: q.options.map((o) => ({ label: o.label, text: o.optionText, isCorrect: o.isCorrect, correctCategory: o.correctCategory ?? null })),
            explanation: q.explanationText ?? "",
            difficulty,
            cognitiveLevel: level,
            model: geminiModel(),
          })
          .$returningId();
        ids.push(id);
      }
      await db.insert(aiGenerationLogs).values({
        userId,
        purpose: "practice",
        mode: "baru",
        subtopicCode: code,
        requested: want,
        validCount: ids.length,
        model: geminiModel(),
        error: run.error ?? (ids.length === 0 ? run.rejected.slice(0, 5).join(" | ").slice(0, 1000) || "Tidak ada soal valid." : null),
        durationMs: Date.now() - started,
      });
      return { ids, error: run.error };
    }),
  );

  const ids = results.flatMap((r) => r.ids);
  const firstError = results.find((r) => r.error)?.error;
  if (ids.length === 0) return { ids, notice: { kind: "failed", message: firstError ?? "AI tidak menghasilkan soal yang lolos pemeriksaan." } };
  return { ids, notice: { kind: "added", count: ids.length } };
}
