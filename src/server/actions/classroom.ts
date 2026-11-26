"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assignmentInput, classCodeInput, classInput } from "@/lib/classroom";
import { getActiveSession } from "@/server/auth/session";
import {
  createAssignment,
  createClass,
  deleteAssignment,
  deleteClass,
  enableTeacher,
  joinClass,
  leaveClass,
  regenerateClassCode,
  removeMember,
  renameClass,
  setClassArchived,
  teacherInfo,
} from "@/server/services/classroom";

type Result<T = object> = ({ ok: true; message?: string } & T) | { ok: false; error: string };
const NO_SESSION = { ok: false as const, error: "Sesi berakhir. Silakan masuk lagi." };
const NOT_TEACHER = { ok: false as const, error: "Aktifkan akun guru dulu di menu Guru." };
const id = z.number().int().positive();

function firstError(e: z.ZodError) {
  return e.issues[0]?.message ?? "Data tidak valid.";
}

/** Sesi guru (users.is_teacher atau afiliasi aktif); null bila bukan guru. */
async function teacherSession(): Promise<{ userId: number } | { error: { ok: false; error: string } }> {
  const session = await getActiveSession();
  if (!session) return { error: NO_SESSION };
  const userId = Number(session.user.id);
  if (!(await teacherInfo(userId)).isTeacher) return { error: NOT_TEACHER };
  return { userId };
}

function refreshTeacher(classId?: number) {
  revalidatePath("/guru");
  if (classId) revalidatePath(`/guru/kelas/${classId}`);
  revalidatePath("/kelas");
}

export async function enableTeacherAction(): Promise<Result> {
  const session = await getActiveSession();
  if (!session) return NO_SESSION;
  if (session.user.role === "admin") return { ok: false, error: "Akun admin tidak perlu mengaktifkan akun guru." };
  await enableTeacher(Number(session.user.id));
  revalidatePath("/", "layout");
  return { ok: true, message: "Akun guru aktif. Silakan buat kelas pertama Anda." };
}

export async function createClassAction(input: unknown): Promise<Result<{ id?: number }>> {
  const t = await teacherSession();
  if ("error" in t) return t.error;
  const parsed = classInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const r = await createClass(t.userId, parsed.data);
  if (!r.ok) return r;
  refreshTeacher();
  return { ok: true, id: r.id, message: `Kelas dibuat. Kode kelas: ${r.joinCode}` };
}

export async function updateClassAction(input: unknown): Promise<Result> {
  const t = await teacherSession();
  if ("error" in t) return t.error;
  const parsed = z
    .object({ classId: id, action: z.enum(["rename", "archive", "unarchive", "regenerate", "delete"]), name: z.string().optional() })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "Data tidak valid." };
  const { classId, action } = parsed.data;
  let message = "Tersimpan.";
  if (action === "rename") {
    const name = classInput.shape.name.safeParse(parsed.data.name ?? "");
    if (!name.success) return { ok: false, error: firstError(name.error) };
    const r = await renameClass(t.userId, classId, name.data);
    if (!r.ok) return r;
  } else if (action === "archive" || action === "unarchive") {
    const r = await setClassArchived(t.userId, classId, action === "archive");
    if (!r.ok) return r;
    message = action === "archive" ? "Kelas diarsipkan — tidak menerima anggota baru." : "Kelas aktif kembali.";
  } else if (action === "regenerate") {
    const r = await regenerateClassCode(t.userId, classId);
    if (!r.ok) return r;
    message = `Kode baru: ${r.joinCode}. Kode lama tidak berlaku lagi.`;
  } else {
    const r = await deleteClass(t.userId, classId);
    if (!r.ok) return r;
    refreshTeacher();
    return { ok: true, message: "Kelas dihapus." };
  }
  refreshTeacher(classId);
  return { ok: true, message };
}

export async function removeMemberAction(input: unknown): Promise<Result> {
  const t = await teacherSession();
  if ("error" in t) return t.error;
  const parsed = z.object({ classId: id, userId: id }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Data tidak valid." };
  const r = await removeMember(t.userId, parsed.data.classId, parsed.data.userId);
  if (!r.ok) return r;
  refreshTeacher(parsed.data.classId);
  return { ok: true, message: "Siswa dikeluarkan dari kelas." };
}

export async function createAssignmentAction(input: unknown): Promise<Result> {
  const t = await teacherSession();
  if ("error" in t) return t.error;
  const parsed = assignmentInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const r = await createAssignment(t.userId, parsed.data);
  if (!r.ok) return r;
  refreshTeacher(parsed.data.classId);
  return { ok: true, message: "Tugas dibuat dan tampil di menu Kelas siswa." };
}

export async function deleteAssignmentAction(input: unknown): Promise<Result> {
  const t = await teacherSession();
  if ("error" in t) return t.error;
  const parsed = z.object({ classId: id, assignmentId: id }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Data tidak valid." };
  const r = await deleteAssignment(t.userId, parsed.data.assignmentId);
  if (!r.ok) return r;
  refreshTeacher(parsed.data.classId);
  return { ok: true, message: "Tugas dihapus." };
}

export async function joinClassAction(code: unknown): Promise<Result> {
  const session = await getActiveSession();
  if (!session) return NO_SESSION;
  const parsed = classCodeInput.safeParse(code);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const r = await joinClass({ id: Number(session.user.id), jenjang: session.user.jenjang ?? null }, parsed.data);
  if (!r.ok) return r;
  revalidatePath("/kelas");
  return { ok: true, message: r.already ? `Kamu sudah tergabung di kelas ${r.name}.` : `Berhasil bergabung ke kelas ${r.name}.` };
}

export async function leaveClassAction(classId: unknown): Promise<Result> {
  const session = await getActiveSession();
  if (!session) return NO_SESSION;
  const parsed = id.safeParse(classId);
  if (!parsed.success) return { ok: false, error: "Data tidak valid." };
  await leaveClass(Number(session.user.id), parsed.data);
  revalidatePath("/kelas");
  return { ok: true, message: "Kamu keluar dari kelas. Guru tidak lagi bisa melihat progresmu." };
}
