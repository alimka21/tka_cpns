"use server";

// Kelola user (admin): tambah akun siswa, hapus, setujui/tolak pendaftar, ubah jenjang, dan
// pengaturan konfirmasi pendaftar. Ubah role SENGAJA tidak ada di sini — hanya lewat
// `npm run user:role` (docs/DECISIONS.md 2026-09-25), supaya menjadikan
// admin selalu lewat jalur yang jelas & tercatat di terminal, bukan klik UI.

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/server/auth";
import { getAdminSession } from "@/server/auth/session";
import { db } from "@/server/db";
import { JENJANG_CODES, USER_STATUSES, accounts, sessions, users } from "@/server/db/schema";
import { setSetting } from "@/server/services/app-settings";
import { randomPassword, setUserPassword } from "@/server/services/password-reset";

export type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };

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

const createUserInput = z.object({
  name: z
    .string()
    .transform((v) => v.trim().replace(/\s+/g, " "))
    .pipe(z.string().min(2, "Nama minimal 2 karakter.").max(100, "Nama maksimal 100 karakter.")),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Format email tidak valid.").max(255)),
  jenjang: z.enum(JENJANG_CODES, "Pilih jenjang SD, SMP, atau SMA."),
  password: z.string().min(8, "Kata sandi minimal 8 karakter.").max(128, "Kata sandi maksimal 128 karakter."),
});

/**
 * Admin membuatkan akun SISWA (langsung aktif, tanpa konfirmasi). Kata sandi
 * di-hash dengan konfigurasi Better Auth yang sama seperti daftar biasa dan
 * disimpan sebagai akun `credential`; siswa bisa menggantinya di Pengaturan.
 * Role admin tetap hanya lewat `npm run user:role`.
 */
export async function createUserAction(input: unknown): Promise<ActionResult> {
  const session = await getAdminSession();
  if (!session) return NOT_ADMIN;
  const parsed = createUserInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { name, email, jenjang, password } = parsed.data;

  const [taken] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (taken) return { ok: false, error: "Email ini sudah terdaftar." };

  const hash = await (await auth.$context).password.hash(password);
  try {
    await db.transaction(async (tx) => {
      const [{ id: userId }] = await tx
        .insert(users)
        .values({ name, email, jenjang, role: "student", status: "active", emailVerified: false })
        .$returningId();
      await tx.insert(accounts).values({ userId, accountId: String(userId), providerId: "credential", password: hash });
    });
  } catch (error) {
    // Dua admin membuat email yang sama bersamaan.
    if (typeof error === "object" && error && "code" in error && (error as { code: string }).code === "ER_DUP_ENTRY") {
      return { ok: false, error: "Email ini sudah terdaftar." };
    }
    throw error;
  }
  revalidatePath("/admin/users");
  return { ok: true };
}

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

/**
 * Admin mengatur ulang kata sandi user: sistem membuat kata sandi sementara,
 * menyimpan hash-nya, mengeluarkan user dari semua perangkat, lalu
 * mengembalikan kata sandi itu SEKALI untuk diberikan ke user. Tidak disimpan
 * dalam bentuk teks. Akun sendiri → pakai Profil (atau `npm run user:password`).
 */
export async function resetUserPasswordAction(userId: number): Promise<ActionResult<{ password: string }>> {
  const session = await getAdminSession();
  if (!session) return NOT_ADMIN;
  if (!z.number().int().positive().safeParse(userId).success) return { ok: false, error: "User tidak valid." };
  if (userId === Number(session.user.id)) return { ok: false, error: "Untuk akunmu sendiri, ganti kata sandi di Profil." };
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId));
  if (!user) return { ok: false, error: "User tidak ditemukan." };
  const password = randomPassword();
  await setUserPassword(user.id, password);
  return { ok: true, password };
}
