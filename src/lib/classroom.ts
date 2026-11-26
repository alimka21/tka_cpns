// Kelas guru (DECISIONS 2026-11-26): kode gabung, validasi input, dan status tugas.
// Fungsi murni (aman untuk client & test).

import { z } from "zod";

/** Huruf/angka tanpa yang mudah tertukar (0/O, 1/I/L) — sama dengan kode referal. */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const CLASS_CODE_LENGTH = 6;

export function generateClassCode(random: () => number = Math.random): string {
  let code = "";
  for (let i = 0; i < CLASS_CODE_LENGTH; i++) code += ALPHABET[Math.floor(random() * ALPHABET.length)];
  return code;
}

/** Input user → bentuk baku (huruf besar, tanpa spasi/tanda). */
export function normalizeClassCode(raw: unknown): string {
  return typeof raw === "string" ? raw.toUpperCase().replace(/[^A-Z0-9]/g, "") : "";
}

export const classCodeInput = z
  .string()
  .transform(normalizeClassCode)
  .refine((c) => c.length === CLASS_CODE_LENGTH, `Kode kelas terdiri dari ${CLASS_CODE_LENGTH} huruf/angka.`);

export const classInput = z.object({
  name: z.string().trim().min(2, "Isi nama kelas (mis. 6A Matematika).").max(100, "Nama kelas maksimal 100 karakter."),
  jenjang: z.enum(["SD", "SMP", "SMA"], { message: "Pilih jenjang kelas." }),
});
export type ClassInput = z.infer<typeof classInput>;

export const assignmentInput = z
  .object({
    classId: z.number().int().positive(),
    testPackageId: z.coerce.number().int().positive({ message: "Pilih paket tes." }),
    /** ISO dari browser guru (datetime-local → toISOString), jadi zona waktu sudah benar. */
    startsAt: z.iso.datetime({ message: "Isi waktu mulai." }),
    dueAt: z.union([z.literal(""), z.iso.datetime()]).optional().transform((v) => v || null),
    note: z.string().trim().max(500, "Catatan maksimal 500 karakter.").optional().transform((v) => v || null),
  })
  .refine((v) => !v.dueAt || new Date(v.dueAt) > new Date(v.startsAt), { message: "Batas waktu harus setelah waktu mulai.", path: ["dueAt"] });
export type AssignmentInput = z.infer<typeof assignmentInput>;

export type AssignmentPhase = "upcoming" | "open" | "closed";

export function assignmentPhase(now: Date, startsAt: Date, dueAt: Date | null): AssignmentPhase {
  if (now < startsAt) return "upcoming";
  if (dueAt && now > dueAt) return "closed";
  return "open";
}

/** Attempt dihitung untuk tugas bila dimulai sejak tugas dibuka dan dikumpulkan sebelum batas waktu. */
export function attemptCountsForAssignment(a: { startedAt: Date; submittedAt: Date | null }, startsAt: Date, dueAt: Date | null): boolean {
  if (!a.submittedAt || a.startedAt < startsAt) return false;
  return !dueAt || a.submittedAt <= dueAt;
}

export function joinLink(siteUrl: string, code: string) {
  return `${siteUrl.replace(/\/$/, "")}/gabung/${code}`;
}

export function classShareMessage(className: string, code: string, link: string) {
  return [
    `Halo! Ayo gabung ke kelas *${className}* di Pakar TKA supaya Bapak/Ibu guru bisa memantau latihanmu.`,
    "",
    `1. Daftar/masuk di Pakar TKA`,
    `2. Buka link ini: ${link}`,
    `   atau masukkan kode kelas *${code}* di menu Kelas.`,
  ].join("\n");
}
