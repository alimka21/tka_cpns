// Konfigurasi Better Auth — email/password dulu, Google menyusul
// (docs/ARCHITECTURE.md). HANYA diimpor dari kode server.

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/server/db";
import { accounts, sessions, users, verifications } from "@/server/db/schema";
import { SITE_NAME } from "@/lib/site";

export const ROLES = ["student", "admin"] as const;
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
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
  },
  user: {
    additionalFields: {
      // input: false → tidak bisa diisi dari form daftar; admin ditetapkan
      // lewat `npm run user:role -- <email> admin`.
      role: { type: ["student", "admin"], required: false, defaultValue: "student", input: false },
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
