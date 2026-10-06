"use server";

// Buat paket otomatis (admin): pratinjau → batch AI (satu per panggilan) →
// simpan paket draf. API key Gemini milik admin yang sedang login.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { frameworkCode } from "@/lib/validation/content";
import { QUESTION_TYPES } from "@/lib/validation/enums";
import { getAdminSession } from "@/server/auth/session";
import {
  buildAutoPackagePreview,
  createAutoPackage,
  runAutoPackageBatch,
  type AutoBatchResult,
  type AutoCreateResult,
  type AutoPackagePreview,
} from "@/server/services/auto-package";

const id = z.number().int().positive();
const NOT_ADMIN = "Sesi admin berakhir. Silakan masuk lagi.";

export async function previewAutoPackageAction(raw: unknown): Promise<AutoPackagePreview> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: NOT_ADMIN };
  const parsed = z.object({ categoryId: id, subjectId: id }).safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Pilih jenjang dan mata pelajaran." };
  return buildAutoPackagePreview(Number(session.user.id), parsed.data.categoryId, parsed.data.subjectId);
}

const batchInput = z.object({
  kind: z.enum(["grup", "tunggal"]),
  slots: z
    .array(z.object({ subtopicCode: frameworkCode, type: z.enum(QUESTION_TYPES), tier: z.union([z.literal(1), z.literal(2), z.literal(3)]) }))
    .min(1)
    .max(10),
  sourceQuestionId: id.nullable(),
  theme: z.string().trim().max(600),
});

export async function runAutoPackageBatchAction(raw: unknown): Promise<AutoBatchResult> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: NOT_ADMIN };
  const parsed = batchInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Permintaan batch tidak valid." };
  return runAutoPackageBatch(Number(session.user.id), parsed.data);
}

const createInput = z.object({
  categoryId: id,
  subjectId: id,
  title: z.string().trim().min(3, "Judul paket minimal 3 karakter.").max(255),
  bankIds: z.array(id).max(60),
  aiIds: z.array(id).max(60),
});

export async function createAutoPackageAction(raw: unknown): Promise<AutoCreateResult> {
  const session = await getAdminSession();
  if (!session) return { ok: false, errors: [NOT_ADMIN] };
  const parsed = createInput.safeParse(raw);
  if (!parsed.success) return { ok: false, errors: [...new Set(parsed.error.issues.map((i) => i.message))] };
  const result = await createAutoPackage(Number(session.user.id), parsed.data);
  if (result.ok) {
    revalidatePath("/admin/paket-tes");
    revalidatePath("/admin/soal");
  }
  return result;
}
