// Konfigurasi Better Auth — email/password + Google (aktif bila env
// GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET diisi). HANYA diimpor dari kode server.

import { randomBytes } from "node:crypto";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/server/db";
import { accounts, sessions, users, verifications } from "@/server/db/schema";
import { PLACEHOLDER_EMAIL_DOMAIN, isPlaceholderEmail, looksLikePhone, normalizePhone, usernameSchema } from "@/lib/identity";
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
          if (isPlaceholderEmail(user.email)) return;
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
      // Dipilih siswa saat daftar (wajib di form); setelah itu hanya admin yang bisa mengganti.
      jenjang: { type: ["SD", "SMP", "SMA"], required: false, input: true },
      // Diatur sistem/admin saja (lihat databaseHooks & /admin/users).
      status: { type: ["active", "pending", "rejected"], required: false, defaultValue: "active", input: false },
      // Diisi saat daftar (divalidasi & dinormalkan di hooks.before); sesudahnya
      // hanya lewat server action profil/admin.
      username: { type: "string", required: false, input: true },
      phone: { type: "string", required: false, input: true },
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
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      const body = ctx.body && typeof ctx.body === "object" ? (ctx.body as Record<string, unknown>) : null;
      if (!body) return;
      // Jenjang hanya diisi saat daftar; sesudahnya hanya admin (/admin/users) yang bisa mengganti.
      // Username & No. HP diubah lewat server action (validasi + cek unik).
      if (ctx.path === "/update-user") {
        if ("jenjang" in body) throw new APIError("FORBIDDEN", { message: "Jenjang hanya bisa diganti oleh admin." });
        if ("username" in body || "phone" in body) throw new APIError("FORBIDDEN", { message: "Ubah username/No. HP di Pengaturan." });
      }
      if (ctx.path === "/sign-up/email") return { context: { body: await normalizeSignUp(body) } };
      // Kolom login menerima username / No. HP / email → diterjemahkan ke email
      // sebelum Better Auth memeriksa kata sandi (rate limit & pesan error tetap sama).
      if (ctx.path === "/sign-in/email" && typeof body.email === "string" && !body.email.includes("@")) {
        return { context: { body: { ...body, email: await emailForIdentifier(body.email) } } };
      }
    }),
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

/** Daftar email/password: username wajib & unik, No. HP & email opsional. */
async function normalizeSignUp(body: Record<string, unknown>) {
  const username = usernameSchema.safeParse(body.username ?? "");
  if (!username.success) throw new APIError("BAD_REQUEST", { message: username.error.issues[0].message, code: "INVALID_USERNAME" });
  const [taken] = await db.select({ id: users.id }).from(users).where(eq(users.username, username.data));
  if (taken) throw new APIError("BAD_REQUEST", { message: "Username sudah dipakai.", code: "USERNAME_TAKEN" });

  const rawPhone = typeof body.phone === "string" ? body.phone.trim() : "";
  const phone = rawPhone ? normalizePhone(rawPhone) : null;
  if (rawPhone && !phone) throw new APIError("BAD_REQUEST", { message: "Nomor HP tidak valid.", code: "INVALID_PHONE" });

  const rawEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (isPlaceholderEmail(rawEmail)) throw new APIError("BAD_REQUEST", { message: "Format email tidak valid.", code: "INVALID_EMAIL" });
  const email = rawEmail || `u${randomBytes(8).toString("hex")}@${PLACEHOLDER_EMAIL_DOMAIN}`;
  return { ...body, username: username.data, phone, email };
}

/**
 * Username / No. HP → email akun. Tidak ketemu → error yang sama dengan
 * kata sandi salah (tidak membocorkan akun mana yang ada). Nomor HP yang
 * dipakai beberapa akun (mis. HP orang tua untuk kakak-adik) harus masuk
 * dengan username.
 */
async function emailForIdentifier(identifier: string) {
  const invalid = () => new APIError("UNAUTHORIZED", { message: "Invalid email or password", code: "INVALID_EMAIL_OR_PASSWORD" });
  if (looksLikePhone(identifier)) {
    const phone = normalizePhone(identifier);
    if (!phone) throw invalid();
    const rows = await db.select({ email: users.email }).from(users).where(eq(users.phone, phone)).limit(2);
    if (rows.length > 1) {
      throw new APIError("UNAUTHORIZED", { message: "Nomor HP dipakai beberapa akun.", code: "PHONE_SHARED" });
    }
    if (!rows[0]) throw invalid();
    return rows[0].email;
  }
  const username = usernameSchema.safeParse(identifier);
  if (!username.success) throw invalid();
  const [row] = await db.select({ email: users.email }).from(users).where(eq(users.username, username.data));
  if (!row) throw invalid();
  return row.email;
}
