// Konfigurasi Better Auth — email/password + Google (aktif bila env
// GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET diisi). HANYA diimpor dari kode server.

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/server/db";
import { accounts, sessions, users, verifications } from "@/server/db/schema";
import { SITE_NAME } from "@/lib/site";
import { getSetting } from "@/server/services/app-settings";
import { isMailConfigured, resetPasswordEmail, sendMail } from "@/server/services/mailer";

export const ROLES = ["student", "admin"] as const;

const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

/** Tombol "Lanjutkan dengan Google" hanya tampil bila kredensial OAuth tersedia. */
export const isGoogleEnabled = Boolean(googleClientId && googleClientSecret);
export type Role = (typeof ROLES)[number];

export const auth = betterAuth({
  appName: SITE_NAME,
  database: drizzleAdapter(db, {
    provider: "mysql",
    schema: { user: users, session: sessions, account: accounts, verification: verifications },
  }),
  advanced: {
    // ID memakai INT auto-increment (FK lain sudah INT).
    database: { generateId: "serial" },
    cookiePrefix: "wtp",
  },
  socialProviders: isGoogleEnabled
    ? {
        google: {
          clientId: googleClientId!,
          clientSecret: googleClientSecret!,
          // Selalu tampilkan pemilih akun (siswa sering berbagi perangkat).
          prompt: "select_account",
        },
      }
    : undefined,
  account: {
    // Email Google sudah terverifikasi → akun email/password dengan email yang
    // sama otomatis tersambung (tidak membuat akun ganda).
    accountLinking: { enabled: true, trustedProviders: ["google"] },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
    // "Lupa kata sandi" (WORKFLOW §10): aktif bila SMTP diisi. Tautan berlaku
    // 1 jam, sekali pakai; reset mengeluarkan semua perangkat.
    sendResetPassword: isMailConfigured()
      ? async ({ user, url }) => {
          // Tidak di-await: waktu respons sama untuk email terdaftar/tidak.
          void sendMail({ to: user.email, ...resetPasswordEmail(user.name, url) }).catch((e) =>
            console.error("[mail] gagal kirim email reset kata sandi:", e instanceof Error ? e.message : e),
          );
        }
      : undefined,
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true,
  },
  user: {
    additionalFields: {
      // input: false → tidak bisa diisi dari form daftar; admin ditetapkan
      // lewat `npm run user:role -- <email> admin`.
      role: { type: ["student", "admin"], required: false, defaultValue: "student", input: false },
      // Dipilih siswa saat daftar (wajib di form); bisa diganti di Pengaturan.
      jenjang: { type: ["SD", "SMP", "SMA"], required: false, input: true },
      // Diatur sistem/admin saja (lihat databaseHooks & /admin/users).
      status: { type: ["active", "pending", "rejected"], required: false, defaultValue: "active", input: false },
    },
  },
  databaseHooks: {
    user: {
      create: {
        // Bila admin mewajibkan konfirmasi, pendaftar baru menunggu persetujuan.
        before: async (user) => {
          const requireApproval = await getSetting("registration.requireApproval");
          return { data: { ...user, status: requireApproval ? "pending" : "active" } };
        },
      },
    },
  },
  // Batasi permintaan email reset (anti-spam/pemborosan kuota SMTP).
  rateLimit: {
    customRules: {
      "/request-password-reset": { window: 60 * 15, max: 3 },
      "/reset-password": { window: 60, max: 10 },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 hari
    updateAge: 60 * 60 * 24, // perpanjang sekali sehari saat aktif
  },
  // nextCookies() harus plugin terakhir — supaya server action bisa set cookie.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
