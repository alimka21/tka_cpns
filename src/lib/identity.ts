import { z } from "zod";

// Identitas login selain email: username & nomor HP (docs/DECISIONS.md 2026-10-15).
// Dipakai form client, hook Better Auth, dan server action admin/profil.

/**
 * Better Auth mewajibkan email unik. Siswa yang daftar tanpa email diberi
 * alamat pengganti di domain `.invalid` (RFC 2606, tidak pernah bisa menerima
 * email) — tidak ditampilkan di UI dan tidak pernah dikirimi email.
 */
export const PLACEHOLDER_EMAIL_DOMAIN = "tanpa-email.pakartka.invalid";

export function isPlaceholderEmail(email: string | null | undefined) {
  return Boolean(email?.toLowerCase().endsWith(`@${PLACEHOLDER_EMAIL_DOMAIN}`));
}

/** Email untuk ditampilkan; null bila akun tanpa email. */
export function visibleEmail(email: string | null | undefined) {
  return email && !isPlaceholderEmail(email) ? email : null;
}

/**
 * Username: 3–20 karakter huruf kecil/angka/`_`/`.`, minimal satu huruf —
 * supaya tidak pernah tertukar dengan nomor HP di kolom login.
 */
export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Username minimal 3 karakter.")
  .max(20, "Username maksimal 20 karakter.")
  .regex(/^[a-z0-9_.]+$/, "Username hanya boleh huruf, angka, titik, dan garis bawah (tanpa spasi).")
  .regex(/[a-z]/, "Username harus mengandung huruf.");

/** Nomor HP Indonesia → bentuk baku `628…`; null bila bukan nomor HP yang valid. */
export function normalizePhone(raw: string): string | null {
  let digits = raw.trim().replace(/[\s\-.()]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  if (!/^\d+$/.test(digits)) return null;
  if (digits.startsWith("0")) digits = `62${digits.slice(1)}`;
  else if (digits.startsWith("8")) digits = `62${digits}`;
  return /^628\d{7,11}$/.test(digits) ? digits : null;
}

/** Kolom login berisi nomor HP (bukan username/email)? Username selalu mengandung huruf. */
export function looksLikePhone(identifier: string) {
  return /^\+?[\d\s\-.()]+$/.test(identifier.trim());
}

/** No. HP opsional: kosong → null, selain itu wajib valid. */
export const optionalPhoneSchema = z
  .string()
  .trim()
  .transform((v, ctx) => {
    if (!v) return null;
    const phone = normalizePhone(v);
    if (!phone) {
      ctx.addIssue({ code: "custom", message: "Nomor HP tidak valid. Contoh: 0812 3456 7890." });
      return z.NEVER;
    }
    return phone;
  });

/** `628123…` → `0812-3456-7890` untuk ditampilkan. */
export function formatPhone(phone: string | null | undefined) {
  if (!phone) return "";
  const local = phone.startsWith("62") ? `0${phone.slice(2)}` : phone;
  return local.replace(/^(\d{4})(\d{4})(\d+)$/, "$1-$2-$3");
}

/** Tautan wa.me dengan pesan terisi. */
export function whatsappLink(phone: string, text?: string) {
  return `https://wa.me/${phone}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
