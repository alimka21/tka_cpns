// Atur ulang kata sandi oleh admin / skrip terminal. Kata sandi sementara
// dibuat acak, di-hash dengan konfigurasi Better Auth yang sama seperti daftar
// biasa, dan HANYA dikembalikan sekali ke pemanggil — tidak pernah disimpan
// dalam bentuk teks (lihat DECISIONS 2026-10-07).

import { randomInt } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { accounts, sessions } from "@/server/db/schema";

/** Kata sandi sementara mudah dibaca: tanpa huruf/angka yang mirip (O/0, l/1/I). */
export function randomPassword() {
  const pick = (chars: string, n: number) => Array.from({ length: n }, () => chars[randomInt(chars.length)]).join("");
  return `${pick("ABCDEFGHJKLMNPQRSTUVWXYZ", 3)}${pick("abcdefghijkmnpqrstuvwxyz", 4)}-${pick("23456789", 4)}`;
}

/** Ganti kata sandi user (buat akun credential bila belum ada) & keluarkan dari semua perangkat. */
export async function setUserPassword(userId: number, password: string) {
  const hash = await (await auth.$context).password.hash(password);
  const [credential] = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.providerId, "credential")));
  if (credential) await db.update(accounts).set({ password: hash }).where(eq(accounts.id, credential.id));
  else await db.insert(accounts).values({ userId, accountId: String(userId), providerId: "credential", password: hash });
  await db.delete(sessions).where(eq(sessions.userId, userId));
}
