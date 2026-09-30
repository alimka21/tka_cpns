"use server";

// Mutasi soal & stimulus dari panel admin. Setiap action cek sesi admin
// sendiri dan memvalidasi ulang input dengan Zod (jangan percaya client).

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { findSubdomain } from "@/server/asesmen";
import { getAdminSession } from "@/server/auth/session";
import { db } from "@/server/db";
import { questions, stimuli } from "@/server/db/schema";
import { getQuestionForEdit } from "@/server/queries/question-bank";
import { editLockViolation } from "@/server/services/question-edit-rules";
import {
  deleteQuestion,
  insertQuestion,
  questionUsage,
  stimulusExists,
  stimulusOrderTaken,
  subtopicIdsByCode,
  updateQuestion,
} from "@/server/services/question-store";
import { frameworkCode } from "@/lib/validation/content";
import { QUESTION_STATUSES, type QuestionStatus } from "@/lib/validation/enums";
import { questionInput, stimulusInput, type QuestionInput } from "@/lib/validation/question";

export type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; errors: string[] };

const NOT_ADMIN: ActionResult<never> = { ok: false, errors: ["Sesi admin berakhir. Silakan masuk lagi."] };

function isDuplicate(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "ER_DUP_ENTRY";
}

type ValidatedQuestion = { ok: true; q: QuestionInput } | { ok: false; errors: string[] };

/** Validasi payload form soal + kecocokan subdomain & level kognitif dengan kerangka asesmen. */
async function validateQuestionPayload(subdomainCode: string, question: unknown, status: QuestionStatus): Promise<ValidatedQuestion> {
  const code = frameworkCode.safeParse(subdomainCode);
  const ref = code.success ? findSubdomain(code.data) : undefined;
  if (!code.success || !ref) return { ok: false, errors: ["Pilih subdomain dari kerangka asesmen."] };

  const subtopicId = (await subtopicIdsByCode(db, [ref.subdomain.code])).get(ref.subdomain.code);
  if (!subtopicId) {
    return { ok: false, errors: ["Subdomain belum ada di database — jalankan npm run db:seed:asesmen."] };
  }

  const parsed = questionInput.safeParse({ ...(question as object), subtopicId, status });
  if (!parsed.success) return { ok: false, errors: [...new Set(parsed.error.issues.map((i) => i.message))] };
  const q = parsed.data;

  const levels = ref.subject.cognitiveLevels.map((l) => l.code);
  if (levels.length > 0 && !q.cognitiveLevel) return { ok: false, errors: [`Pilih level kognitif ${levels.join("/")}.`] };
  if (q.cognitiveLevel && !levels.includes(q.cognitiveLevel)) {
    return { ok: false, errors: [levels.length ? `Level kognitif ${ref.subject.name} hanya ${levels.join("/")}.` : `${ref.subject.name} tidak memakai level kognitif.`] };
  }
  return { ok: true, q };
}

/** Simpan soal baru dari form admin (status draft). */
export async function createQuestionAction(input: {
  subdomainCode: string;
  question: unknown;
}): Promise<ActionResult<{ id: number }>> {
  const session = await getAdminSession();
  if (!session) return NOT_ADMIN;

  const validated = await validateQuestionPayload(input.subdomainCode, input.question, "draft");
  if (!validated.ok) return validated;
  const q = validated.q;

  const id = await db.transaction(async (tx) => {
    if (q.stimulusId != null) {
      if (!(await stimulusExists(tx, q.stimulusId))) return { error: "Stimulus tidak ditemukan." };
      if (await stimulusOrderTaken(tx, q.stimulusId, q.stimulusOrder!)) {
        return { error: `Urutan ${q.stimulusOrder} di stimulus ini sudah dipakai soal lain.` };
      }
    }
    return { id: await insertQuestion(tx, q, { generatedBy: "manual", userId: Number(session.user.id) }) };
  });
  if ("error" in id) return { ok: false, errors: [id.error!] };

  revalidatePath("/admin/soal");
  revalidatePath("/admin/soal/stimulus");
  return { ok: true, id: id.id };
}

const questionId = z.number().int().positive();

/**
 * Ubah soal; bagian yang dikunci untuk soal terpakai ada di `editLockViolation`.
 * Status soal tidak diubah di sini (pakai tombol Terbitkan/Jadikan draft).
 */
export async function updateQuestionAction(input: {
  id: number;
  subdomainCode: string;
  question: unknown;
}): Promise<ActionResult> {
  const session = await getAdminSession();
  if (!session) return NOT_ADMIN;
  const id = questionId.safeParse(input.id);
  if (!id.success) return { ok: false, errors: ["Soal tidak valid."] };

  const current = await getQuestionForEdit(id.data);
  if (!current) return { ok: false, errors: ["Soal tidak ditemukan (mungkin sudah dihapus)."] };

  const validated = await validateQuestionPayload(input.subdomainCode, input.question, current.status);
  if (!validated.ok) return validated;
  const q = validated.q;

  const locked = editLockViolation(current, q, input.subdomainCode);
  if (locked) return { ok: false, errors: [locked] };
  const answered = current.usage.answers > 0;

  const result = await db.transaction(async (tx) => {
    if (q.stimulusId != null) {
      if (!(await stimulusExists(tx, q.stimulusId))) return { error: "Stimulus tidak ditemukan." };
      if (await stimulusOrderTaken(tx, q.stimulusId, q.stimulusOrder!, id.data)) {
        return { error: `Urutan ${q.stimulusOrder} di stimulus ini sudah dipakai soal lain.` };
      }
    }
    await updateQuestion(tx, id.data, q, answered);
    return {};
  });
  if ("error" in result) return { ok: false, errors: [result.error!] };

  revalidatePath("/admin/soal");
  revalidatePath(`/admin/soal/${id.data}`);
  revalidatePath("/admin/soal/stimulus");
  return { ok: true };
}

/** Hapus soal — hanya bila belum masuk paket & belum pernah dijawab. */
export async function deleteQuestionAction(input: number): Promise<ActionResult> {
  const session = await getAdminSession();
  if (!session) return NOT_ADMIN;
  const id = questionId.safeParse(input);
  if (!id.success) return { ok: false, errors: ["Soal tidak valid."] };

  const result = await db.transaction(async (tx) => {
    const usage = await questionUsage(tx, id.data);
    if (usage.answers > 0) return { error: "Soal sudah pernah dijawab siswa — tidak bisa dihapus. Jadikan draft saja." };
    if (usage.packages > 0) return { error: `Soal masih dipakai di ${usage.packages} paket tes — keluarkan dari paket dulu.` };
    if (usage.practiceItems > 0) return { error: "Soal pernah dipakai di latihan siswa — tidak bisa dihapus. Jadikan draft saja." };
    await deleteQuestion(tx, id.data);
    return {};
  });
  if ("error" in result) return { ok: false, errors: [result.error!] };

  revalidatePath("/admin/soal");
  revalidatePath("/admin/soal/stimulus");
  return { ok: true };
}

const statusInput = z.object({ id: z.number().int().positive(), status: z.enum(QUESTION_STATUSES) });

/** Ubah status soal (draft ⇄ tayang, review). */
export async function updateQuestionStatusAction(input: { id: number; status: string }): Promise<ActionResult> {
  const session = await getAdminSession();
  if (!session) return NOT_ADMIN;
  const parsed = statusInput.safeParse(input);
  if (!parsed.success) return { ok: false, errors: ["Status tidak valid."] };
  const now = new Date();
  await db
    .update(questions)
    .set({
      status: parsed.data.status,
      // Menandai siapa yang me-review saat soal diterbitkan.
      reviewedBy: parsed.data.status === "published" ? Number(session.user.id) : null,
      reviewedAt: parsed.data.status === "published" ? now : null,
    })
    .where(eq(questions.id, parsed.data.id));
  revalidatePath("/admin/soal");
  return { ok: true };
}

/** Simpan stimulus baru. */
export async function createStimulusAction(input: unknown): Promise<ActionResult<{ id: number }>> {
  const session = await getAdminSession();
  if (!session) return NOT_ADMIN;
  const parsed = stimulusInput.safeParse(input);
  if (!parsed.success) return { ok: false, errors: parsed.error.issues.map((i) => i.message) };
  try {
    const [{ id }] = await db
      .insert(stimuli)
      .values({ ...parsed.data, imageUrl: parsed.data.imageUrl ?? null, createdBy: Number(session.user.id) })
      .$returningId();
    revalidatePath("/admin/soal/stimulus");
    return { ok: true, id };
  } catch (error) {
    if (isDuplicate(error)) return { ok: false, errors: [`Kode ${parsed.data.code} sudah dipakai stimulus lain.`] };
    throw error;
  }
}

const stimulusUpdateInput = stimulusInput.omit({ code: true }).extend({ id: z.number().int().positive() });

/** Ubah stimulus (judul, isi, gambar, status). Kode tidak bisa diubah — dipakai import Excel. */
export async function updateStimulusAction(input: unknown): Promise<ActionResult> {
  const session = await getAdminSession();
  if (!session) return NOT_ADMIN;
  const parsed = stimulusUpdateInput.safeParse(input);
  if (!parsed.success) return { ok: false, errors: parsed.error.issues.map((i) => i.message) };
  const { id, ...values } = parsed.data;
  await db
    .update(stimuli)
    .set({ ...values, imageUrl: values.imageUrl ?? null })
    .where(eq(stimuli.id, id));
  revalidatePath("/admin/soal/stimulus");
  return { ok: true };
}
