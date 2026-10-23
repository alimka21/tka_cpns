// Program referal (DECISIONS 2026-10-24): setiap user punya kode unik; pendaftar baru boleh
// memasukkan kode orang lain. Pemilik kode mendapat komisi (default 20%) dari setiap pembayaran
// Premium yang lunas oleh user yang ia referensikan; admin mentransfer komisi secara manual.
// Fungsi di sini murni (aman untuk client & test).

import { z } from "zod";

/** Huruf/angka tanpa yang mudah tertukar (0/O, 1/I/L). */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const REFERRAL_CODE_LENGTH = 7;
export const DEFAULT_COMMISSION_PERCENT = 20;
/** Kode teman masih boleh diisi belakangan (mis. daftar lewat Google) selama sekian hari & belum pernah membayar. */
export const LATE_REFERRAL_DAYS = 7;

export function generateReferralCode(random: () => number = Math.random): string {
  let code = "";
  for (let i = 0; i < REFERRAL_CODE_LENGTH; i++) code += ALPHABET[Math.floor(random() * ALPHABET.length)];
  return code;
}

/** Input user → bentuk baku (huruf besar, tanpa spasi/tanda). Kosong → "". */
export function normalizeReferralCode(raw: unknown): string {
  return typeof raw === "string" ? raw.toUpperCase().replace(/[^A-Z0-9]/g, "") : "";
}

export const referralCodeInput = z
  .string()
  .transform(normalizeReferralCode)
  .refine((c) => c === "" || (c.length >= 4 && c.length <= 12), "Kode referal tidak valid.");

/** Komisi dibulatkan ke bawah (rupiah utuh). */
export function commissionAmount(paidAmount: number, percent: number): number {
  return Math.floor((paidAmount * percent) / 100);
}

/** "Budi Santoso" → "Budi S." — nama teman yang direferensikan tidak ditampilkan utuh. */
export function maskName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts[0] ?? "";
  return `${parts[0]} ${parts.slice(1).map((p) => `${p[0].toUpperCase()}.`).join(" ")}`;
}

export function referralLink(siteUrl: string, code: string) {
  return `${siteUrl.replace(/\/$/, "")}/daftar?ref=${encodeURIComponent(code)}`;
}

export const payoutAccountInput = z.object({
  bankName: z.string().trim().min(2, "Isi nama bank/e-wallet.").max(60),
  accountNumber: z
    .string()
    .trim()
    .regex(/^[0-9 -]{5,40}$/, "Nomor rekening/e-wallet hanya angka (5–40 digit).")
    .transform((v) => v.replace(/[\s-]/g, "")),
  accountName: z.string().trim().min(2, "Isi nama pemilik rekening.").max(100),
});
export type PayoutAccountInput = z.infer<typeof payoutAccountInput>;
