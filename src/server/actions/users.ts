"use server";

// Kelola user (admin): hapus, setujui/tolak pendaftar, ubah jenjang, dan
// pengaturan konfirmasi pendaftar. Ubah role SENGAJA tidak ada di sini — hanya lewat
// `npm run user:role` (docs/DECISIONS.md 2026-09-25), supaya menjadikan
// admin selalu lewat jalur yang jelas & tercatat di terminal, bukan klik UI.

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { getAdminSession } from "@/server/auth/session";
import { db } from "@/server/db";
import { JENJANG_CODES, USER_STATUSES, sessions, users } from "@/server/db/schema";
import { setSetting } from "@/server/services/app-settings";

export type ActionResult = { ok: true } | { ok: false; error: string };

function isFkError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "ER_ROW_IS_REFERENCED_2";
}

export async function deleteUserAction(userId: number): Promise<ActionResult> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: "Sesi admin berakhir. Silakan masuk lagi." };
  if (Number(session.user.id) === userId) return { ok: false, error: "Tidak bisa menghapus akunmu sendiri." };

  try {
    await db.delete(users).where(eq(users.id, userId));
  } catch (error) {
    if (isFkError(error)) {
      return { ok: false, error: "User ini masih punya data terkait (soal/paket/percobaan) — tidak bisa dihapus." };
    }
    throw error;
  }
  revalidatePath("/admin/users");
  return { ok: true };
}

const NOT_ADMIN = { ok: false as const, error: "Sesi admin berakhir. Silakan masuk lagi." };
const id = z.number().int().positive();

/** Setujui (active) / tolak (rejected) / kembalikan ke menunggu — hanya untuk akun siswa. */
export async function setUserStatusAction(input: { userIds: number[]; status: string }): Promise<ActionResult> {
  const session = await getAdminSession();
  if (!session) return NOT_ADMIN;
  const parsed = z.object({ userIds: z.array(id).min(1).max(500), status: z.enum(USER_STATUSES) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Data tidak valid." };
  const { userIds, status } = parsed.data;
  await db.update(users).set({ status }).where(and(inArray(users.id, userIds), eq(users.role, "student")));
  // Akun yang ditolak langsung keluar dari semua perangkat.
  if (status === "rejected") await db.delete(sessions).where(inArray(sessions.userId, userIds));
  revalidatePath("/admin/users");
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function approveAllPendingAction(): Promise<ActionResult> {
  const session = await getAdminSession();
  if (!session) return NOT_ADMIN;
  await db.update(users).set({ status: "active" }).where(eq(users.status, "pending"));
  revalidatePath("/admin/users");
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function setUserJenjangAction(input: { userId: number; jenjang: string }): Promise<ActionResult> {
  const session = await getAdminSession();
  if (!session) return NOT_ADMIN;
  const parsed = z.object({ userId: id, jenjang: z.enum(JENJANG_CODES) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Jenjang tidak valid." };
  await db.update(users).set({ jenjang: parsed.data.jenjang }).where(eq(users.id, parsed.data.userId));
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function setRequireApprovalAction(enabled: boolean): Promise<ActionResult> {
  const session = await getAdminSession();
  if (!session) return NOT_ADMIN;
  await setSetting("registration.requireApproval", Boolean(enabled), Number(session.user.id));
  revalidatePath("/admin/pengaturan");
  revalidatePath("/admin/users");
  return { ok: true };
}
