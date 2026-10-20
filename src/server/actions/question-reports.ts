"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { findSubdomain } from "@/server/asesmen";
import { db } from "@/server/db";
import { questionReports, REPORT_REASONS, stimuli } from "@/server/db/schema";
import { getActiveSession, getAdminSession } from "@/server/auth/session";
import { getQuestionForEdit } from "@/server/queries/question-bank";
import { updateQuestionAction } from "@/server/actions/questions";
import { getGeminiKey } from "@/server/services/ai-key";
import { generateJson, GeminiError } from "@/server/services/gemini";
import { buildFixPrompt, parseFixSuggestion, type FixSuggestion } from "@/server/services/report-ai-fix";
import { OPTION_LABELS } from "@/lib/validation/enums";
import { resolveReports, submitReport } from "@/server/services/question-reports";

const id = z.number().int().positive();
const target = z.union([z.object({ questionId: id }).strict(), z.object({ practiceQuestionId: id }).strict()]);

type Result = { ok: true } | { ok: false; error: string };

export async function reportQuestionAction(input: { target: unknown; reason: string; note?: string }): Promise<Result> {
  const session = await getActiveSession();
  if (!session) return { ok: false, error: "Sesi berakhir. Silakan masuk lagi." };
  const parsed = z
    .object({ target, reason: z.enum(REPORT_REASONS), note: z.string().trim().max(500).optional() })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "Pilih alasan laporan." };
  const result = await submitReport(Number(session.user.id), parsed.data.target, parsed.data.reason, parsed.data.note || null);
  if (result.ok) revalidatePath("/admin/laporan");
  return result;
}

export async function resolveReportsAction(input: unknown): Promise<Result> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: "Sesi admin berakhir. Silakan masuk lagi." };
  const parsed = target.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Soal tidak valid." };
  await resolveReports(Number(session.user.id), parsed.data);
  revalidatePath("/admin/laporan");
  return { ok: true };
}

export type AiFixCurrent = {
  type: string;
  categoryLabels: [string, string] | null;
  questionText: string;
  options: { text: string; isCorrect: boolean; correctCategory: string | null }[];
  explanationText: string;
};

/** Admin: minta usulan perbaikan soal bank dari Gemini (key milik admin) berdasarkan laporan + catatan admin. */
export async function suggestReportFixAction(input: {
  questionId: number;
  adminNote?: string;
}): Promise<({ ok: true; suggestion: FixSuggestion; current: AiFixCurrent; keysLocked: boolean }) | { ok: false; error: string }> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: "Sesi admin berakhir. Silakan masuk lagi." };
  const parsed = z.object({ questionId: id, adminNote: z.string().trim().max(1000).optional() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Data tidak valid (catatan admin maks. 1.000 karakter)." };

  const apiKey = await getGeminiKey(Number(session.user.id));
  if (!apiKey) return { ok: false, error: "Simpan API key Gemini milikmu dulu di menu Profil & API Key." };
  const q = await getQuestionForEdit(parsed.data.questionId);
  if (!q) return { ok: false, error: "Soal tidak ditemukan (mungkin sudah dihapus)." };
  const ref = findSubdomain(q.subdomainCode);
  const [reports, stim] = await Promise.all([
    db
      .select({ reason: questionReports.reason, note: questionReports.note })
      .from(questionReports)
      .where(and(eq(questionReports.questionId, q.id), eq(questionReports.status, "open"))),
    q.stimulusId ? db.select({ title: stimuli.title, content: stimuli.content }).from(stimuli).where(eq(stimuli.id, q.stimulusId)) : Promise.resolve([]),
  ]);
  const keysLocked = q.usage.answers > 0;
  const ctx = {
    question: q,
    subject: ref?.subject.name ?? "",
    jenjang: ref?.framework.jenjang ?? "",
    subdomain: ref?.subdomain.name ?? q.subdomainCode,
    stimulus: stim[0] ?? null,
    reports,
    adminNote: parsed.data.adminNote ?? "",
    keysLocked,
  };
  let raw: unknown;
  try {
    raw = await generateJson({ apiKey, prompt: buildFixPrompt(ctx), timeoutMs: 120_000 });
  } catch (e) {
    return { ok: false, error: e instanceof GeminiError ? e.message : "Gagal menghubungi Gemini. Coba lagi." };
  }
  const suggestion = parseFixSuggestion(raw, ctx);
  if ("error" in suggestion) return { ok: false, error: suggestion.error };
  return {
    ok: true,
    suggestion,
    keysLocked,
    current: { type: q.type, categoryLabels: q.categoryLabels, questionText: q.questionText, options: q.options, explanationText: q.explanationText },
  };
}

/** Admin: terapkan perbaikan (hasil AI yang sudah ditinjau/disunting) ke soal bank, opsional tutup laporannya. */
export async function applyReportFixAction(input: unknown): Promise<Result> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: "Sesi admin berakhir. Silakan masuk lagi." };
  const parsed = z
    .object({
      questionId: id,
      questionText: z.string().trim().min(1).max(10_000),
      options: z.array(z.object({ text: z.string().trim().min(1).max(2000), isCorrect: z.boolean(), correctCategory: z.string().trim().nullable() })).min(3).max(5),
      explanationText: z.string().trim().min(1).max(10_000),
      resolve: z.boolean(),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "Isian perbaikan belum lengkap." };
  const p = parsed.data;
  const current = await getQuestionForEdit(p.questionId);
  if (!current) return { ok: false, error: "Soal tidak ditemukan (mungkin sudah dihapus)." };

  // Bentuk, subdomain, gambar, stimulus, tingkat & level tetap — hanya teks, opsi/kunci, pembahasan.
  const result = await updateQuestionAction({
    id: current.id,
    subdomainCode: current.subdomainCode,
    question: {
      type: current.type,
      questionText: p.questionText,
      imageUrl: current.imageUrl,
      difficulty: current.difficulty,
      cognitiveLevel: current.cognitiveLevel,
      explanationText: p.explanationText,
      categoryLabels: current.categoryLabels ?? undefined,
      stimulusId: current.stimulusId,
      stimulusOrder: current.stimulusOrder,
      options: p.options.map((o, i) => ({ label: OPTION_LABELS[i], optionText: o.text, isCorrect: o.isCorrect, correctCategory: o.correctCategory })),
    },
  });
  if (!result.ok) return { ok: false, error: result.errors.join(" ") };
  if (p.resolve) await resolveReports(Number(session.user.id), { questionId: current.id });
  revalidatePath("/admin/laporan");
  return { ok: true };
}
