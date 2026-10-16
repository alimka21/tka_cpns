import {
  boolean,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const JENJANG_CODES = ["SD", "SMP", "SMA"] as const;
export type JenjangCode = (typeof JENJANG_CODES)[number];
export const USER_STATUSES = ["active", "pending", "rejected"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

// Tabel auth mengikuti skema Better Auth (src/server/auth) dengan
// `generateId: "serial"` — id tetap INT auto-increment supaya FK lain
// (questions.created_by, dst.) tidak berubah. Password TIDAK disimpan di
// `users`, melainkan di `accounts.password` (hash scrypt Better Auth).

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  /** Siswa tanpa email memakai alamat pengganti `@tanpa-email.pakartka.invalid` (lib/identity). */
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  /** Untuk masuk selain email (huruf kecil, lib/identity). NULL = akun Google yang belum membuatnya. */
  username: varchar("username", { length: 20 }).unique(),
  /**
   * No. HP/WA bentuk `628…` — boleh milik orang tua, jadi TIDAK unik (kakak-adik
   * bisa sama). Tujuan admin mengirim kata sandi baru; masuk dengan nomor HP
   * hanya bila nomor itu milik satu akun.
   */
  phone: varchar("phone", { length: 16 }),
  /** Provinsi asal (nama dari lib/provinces). Wajib saat daftar sejak 2026-10-16; NULL = akun lama. */
  province: varchar("province", { length: 64 }),
  /** Nama sekolah (teks bebas). Wajib saat daftar sejak 2026-10-16; NULL = akun lama. */
  schoolName: varchar("school_name", { length: 150 }),
  image: text("image"),
  role: mysqlEnum("role", ["student", "admin"]).notNull().default("student"),
  /** Jenjang siswa — menentukan paket tes, soal & kurikulum. NULL = belum memilih (akun lama). */
  jenjang: mysqlEnum("jenjang", JENJANG_CODES),
  /**
   * active = boleh memakai aplikasi; pending = menunggu konfirmasi admin
   * (bila pengaturan `registration.requireApproval` aktif); rejected = ditolak.
   */
  status: mysqlEnum("status", USER_STATUSES).notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (t) => [
  // Badge "menunggu konfirmasi" di setiap halaman admin + tab status.
  index("users_status_idx").on(t.status),
  index("users_created_at_idx").on(t.createdAt),
  index("users_phone_idx").on(t.phone),
  index("users_province_idx").on(t.province),
]);

export const sessions = mysqlTable(
  "sessions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 255 }).notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    ipAddress: varchar("ip_address", { length: 64 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (t) => [index("sessions_user_id_idx").on(t.userId)],
);

export const accounts = mysqlTable(
  "accounts",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: varchar("account_id", { length: 255 }).notNull(),
    providerId: varchar("provider_id", { length: 64 }).notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    /** Hash password untuk login email/password. */
    password: text("password"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (t) => [index("accounts_user_id_idx").on(t.userId)],
);

export const verifications = mysqlTable(
  "verifications",
  {
    id: int("id").autoincrement().primaryKey(),
    identifier: varchar("identifier", { length: 255 }).notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (t) => [index("verifications_identifier_idx").on(t.identifier)],
);

/** Satu baris per user: Gemini API key terenkripsi (services/crypto.ts). */
export const userAiSettings = mysqlTable("user_ai_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  geminiApiKeyEncrypted: text("gemini_api_key_encrypted").notNull(),
  geminiKeyMasked: varchar("gemini_key_masked", { length: 50 }).notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
