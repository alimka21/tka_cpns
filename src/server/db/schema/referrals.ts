import { index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";
import { orders } from "./billing";
import { users } from "./users";

// Grup: Program referal (DECISIONS 2026-10-24). Kode referal & pemberi referal ada di `users`
// (referral_code, referred_by_user_id); di sini komisi per pembayaran, transfer admin, rekening.
// Sejak 2026-11-13 hanya guru afiliasi (tabel `affiliates`) yang kodenya berlaku (DECISIONS).

export const COMMISSION_STATUSES = ["pending", "paid", "void"] as const;
export type CommissionStatus = (typeof COMMISSION_STATUSES)[number];

/** Satu baris per order lunas milik user yang direferensikan (dibuat di billing.applyPaymentUpdate). */
export const referralCommissions = mysqlTable(
  "referral_commissions",
  {
    id: int("id").autoincrement().primaryKey(),
    referrerUserId: int("referrer_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    referredUserId: int("referred_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Unik → satu order hanya menghasilkan satu komisi (webhook idempoten). */
    orderId: int("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    orderAmount: int("order_amount").notNull(),
    /** Persen yang berlaku saat order lunas (pengaturan bisa berubah kemudian). */
    percent: int("percent").notNull(),
    amount: int("amount").notNull(),
    /** pending = belum ditransfer; paid = sudah ditransfer admin; void = order dikembalikan (refund). */
    status: mysqlEnum("status", COMMISSION_STATUSES).notNull().default("pending"),
    payoutId: int("payout_id"),
    /** Komisi boleh dicairkan mulai saat ini (masa tahan refund). Null = langsung (baris lama). */
    availableAt: timestamp("available_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    paidAt: timestamp("paid_at"),
  },
  (t) => [
    uniqueIndex("referral_commissions_order_idx").on(t.orderId),
    index("referral_commissions_referrer_idx").on(t.referrerUserId, t.status),
  ],
);

/** Catatan transfer komisi oleh admin (manual, di luar sistem). */
export const referralPayouts = mysqlTable(
  "referral_payouts",
  {
    id: int("id").autoincrement().primaryKey(),
    referrerUserId: int("referrer_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amount: int("amount").notNull(),
    /** Salinan rekening tujuan saat transfer + catatan admin (mis. no. referensi). */
    destination: varchar("destination", { length: 200 }),
    note: text("note"),
    createdBy: int("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("referral_payouts_referrer_idx").on(t.referrerUserId)],
);

/** Rekening/e-wallet tujuan transfer komisi, diisi pemilik kode di halaman Referal. */
export const referralAccounts = mysqlTable("referral_accounts", {
  userId: int("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  bankName: varchar("bank_name", { length: 60 }).notNull(),
  accountNumber: varchar("account_number", { length: 40 }).notNull(),
  accountName: varchar("account_name", { length: 100 }).notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export const AFFILIATE_STATUSES = ["invited", "active", "suspended"] as const;
export type AffiliateStatus = (typeof AFFILIATE_STATUSES)[number];

/**
 * Guru afiliasi, ditambahkan manual oleh admin lewat email. `invited` = email belum punya akun
 * (aktif otomatis saat mendaftar dengan email itu); `active` = kode berlaku + Premium gratis;
 * `suspended` = kode tidak berlaku lagi, komisi yang sudah tercatat tetap dibayar.
 */
export const affiliates = mysqlTable(
  "affiliates",
  {
    id: int("id").autoincrement().primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    userId: int("user_id").references(() => users.id, { onDelete: "set null" }),
    name: varchar("name", { length: 100 }).notNull(),
    school: varchar("school", { length: 150 }),
    phone: varchar("phone", { length: 20 }),
    note: text("note"),
    status: mysqlEnum("status", AFFILIATE_STATUSES).notNull().default("invited"),
    /** Null = pakai pengaturan `affiliate.commissionPercent`. */
    commissionPercent: int("commission_percent"),
    invitedBy: int("invited_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    activatedAt: timestamp("activated_at"),
  },
  (t) => [uniqueIndex("affiliates_email_idx").on(t.email), uniqueIndex("affiliates_user_idx").on(t.userId)],
);
