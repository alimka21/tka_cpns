"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { REPORT_REASONS } from "@/server/db/schema";
import { getAdminSession, getSession } from "@/server/auth/session";
import { resolveReports, submitReport } from "@/server/services/question-reports";

const id = z.number().int().positive();
const target = z.union([z.object({ questionId: id }).strict(), z.object({ practiceQuestionId: id }).strict()]);

type Result = { ok: true } | { ok: false; error: string };

export async function reportQuestionAction(input: { target: unknown; reason: string; note?: string }): Promise<Result> {
  const session = await getSession();
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
