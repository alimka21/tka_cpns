import { z } from "zod";

// Dipakai form client & (nanti) handler Better Auth di server.

const email = z.string().trim().toLowerCase().email("Format email tidak valid.");

export const signInInput = z.object({
  email,
  password: z.string().min(1, "Kata sandi wajib diisi."),
});

const newPassword = z
  .string()
  .min(8, "Kata sandi minimal 8 karakter.")
  .max(128, "Kata sandi terlalu panjang.")
  .regex(/[A-Za-z]/, "Kata sandi harus mengandung huruf.")
  .regex(/\d/, "Kata sandi harus mengandung angka.");

export const signUpInput = z
  .object({
    name: z.string().trim().min(2, "Nama minimal 2 karakter.").max(255),
    jenjang: z.enum(["SD", "SMP", "SMA"], "Pilih jenjangmu."),
    email,
    password: newPassword,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Konfirmasi kata sandi tidak sama.",
  });

export const forgotPasswordInput = z.object({ email });

export const resetPasswordInput = z
  .object({ password: newPassword, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Konfirmasi kata sandi tidak sama.",
  });

export type SignInInput = z.infer<typeof signInInput>;
export type SignUpInput = z.infer<typeof signUpInput>;
