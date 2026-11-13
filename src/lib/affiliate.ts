// Afiliasi guru (DECISIONS 2026-11-13): admin menambah guru lewat email; siswa yang mendaftar
// dengan kode guru mendapat diskon di pembelian Premium PERTAMA, dan guru mendapat komisi dari
// nominal yang dibayar (setelah diskon) — hanya sekali per siswa. Fungsi murni (aman untuk client & test).

import { z } from "zod";
import { normalizeReferralCode } from "@/lib/referral";

/** Komisi baru boleh dicairkan setelah masa tahan (jaga-jaga refund). */
export const COMMISSION_HOLD_DAYS = 7;
/** Pencairan minimal per transfer. */
export const MIN_PAYOUT = 50_000;

/** Harga setelah diskon pembelian pertama (potongan dibulatkan ke bawah). */
export function discountedPrice(price: number, percent: number): number {
  if (percent <= 0) return price;
  return price - Math.floor((price * percent) / 100);
}

export function commissionAvailableAt(paidAt: Date): Date {
  return new Date(paidAt.getTime() + COMMISSION_HOLD_DAYS * 86_400_000);
}

/** Kode khusus guru (mis. BUSITI): 4–12 huruf/angka, disimpan huruf besar. */
export const affiliateCodeInput = z
  .string()
  .transform(normalizeReferralCode)
  .refine((c) => c.length >= 4 && c.length <= 12, "Kode 4–12 huruf/angka (tanpa spasi).");

export const addAffiliateInput = z.object({
  email: z.string().trim().toLowerCase().email("Email tidak valid.").max(255),
  name: z.string().trim().min(2, "Isi nama guru.").max(100),
  school: z.string().trim().max(150).optional().transform((v) => v || null),
  phone: z
    .string()
    .trim()
    .max(20)
    .optional()
    .transform((v) => (v ? v.replace(/[\s-]/g, "") : null)),
  commissionPercent: z.coerce.number().int().min(0).max(60).nullable().optional(),
  note: z.string().trim().max(500).optional().transform((v) => v || null),
});
export type AddAffiliateInput = z.infer<typeof addAffiliateInput>;

/** Pesan undangan untuk dikirim admin lewat WhatsApp. */
export function inviteMessage(name: string, signupUrl: string, email: string) {
  return (
    `Halo ${name}, Anda diundang menjadi Guru Afiliasi Pakar TKA.\n\n` +
    `Daftar di ${signupUrl} memakai email ${email} — akun afiliasi aktif otomatis, ` +
    `lengkap dengan Premium gratis semua jenjang, kode khusus, dan komisi untuk setiap siswa yang membeli Premium.`
  );
}

/** Pesan yang dibagikan guru ke siswa/orang tua. */
export function studentShareMessage(code: string, link: string, discount: number) {
  return (
    `Latihan TKA SD/SMP/SMA di Pakar TKA: ribuan soal, pembahasan, dan analisis kelemahan per subtopik.\n\n` +
    `Daftar gratis lewat link ini (kode guru: ${code})` +
    (discount > 0 ? ` — dapat diskon ${discount}% untuk pembelian Premium pertama` : "") +
    `:\n${link}`
  );
}
