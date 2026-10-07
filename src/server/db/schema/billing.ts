import { boolean, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";
import { jsonText } from "./json-text";
import { JENJANG_CODES, users } from "./users";

// Grup: Langganan & pembayaran (DOKU Checkout QRIS, DECISIONS 2026-10-07).
// Akun gratis: paket tes `is_premium = false` saja. Premium (membership aktif)
// membuka semua paket premium jenjangnya + Latihan Kelemahan.

/** Paket langganan yang dijual (diatur admin di /admin/langganan). */
export const plans = mysqlTable("plans", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description"),
  /** NULL = berlaku untuk semua jenjang. */
  jenjang: mysqlEnum("jenjang", JENJANG_CODES),
  /** Rupiah, tanpa desimal. */
  price: int("price").notNull(),
  /** NULL = selamanya. */
  durationDays: int("duration_days"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: int("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const ORDER_STATUSES = ["pending", "paid", "expired", "failed", "cancelled", "refunded"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Satu percobaan pembelian = satu order DOKU (`order_code` = invoice_number DOKU). */
export const orders = mysqlTable(
  "orders",
  {
    id: int("id").autoincrement().primaryKey(),
    orderCode: varchar("order_code", { length: 50 }).notNull().unique(),
    userId: int("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    planId: int("plan_id")
      .notNull()
      .references(() => plans.id),
    /** Salinan saat order dibuat (harga plan bisa berubah kemudian). */
    planName: varchar("plan_name", { length: 120 }).notNull(),
    jenjang: mysqlEnum("jenjang", JENJANG_CODES),
    durationDays: int("duration_days"),
    amount: int("amount").notNull(),
    status: mysqlEnum("status", ORDER_STATUSES).notNull().default("pending"),
    redirectUrl: varchar("redirect_url", { length: 500 }),
    paymentType: varchar("payment_type", { length: 40 }),
    transactionId: varchar("transaction_id", { length: 80 }),
    paidAt: timestamp("paid_at"),
    /** Notifikasi/status terakhir dari DOKU (audit). */
    lastPayload: jsonText<unknown>("last_payload"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (t) => [index("orders_user_idx").on(t.userId), index("orders_created_at_idx").on(t.createdAt)],
);

/** Masa Premium aktif. Dari pembelian (order_id) atau diberikan admin. */
export const memberships = mysqlTable(
  "memberships",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Unik → satu order hanya bisa mengaktifkan satu membership (webhook idempoten). */
    orderId: int("order_id").references(() => orders.id, { onDelete: "set null" }),
    /** NULL = semua jenjang. */
    jenjang: mysqlEnum("jenjang", JENJANG_CODES),
    startsAt: timestamp("starts_at").notNull().defaultNow(),
    /** NULL = selamanya. */
    endsAt: timestamp("ends_at"),
    grantedBy: mysqlEnum("granted_by", ["purchase", "admin_manual"]).notNull(),
    grantedByUserId: int("granted_by_user_id").references(() => users.id, { onDelete: "set null" }),
    revokedAt: timestamp("revoked_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("memberships_order_idx").on(t.orderId), index("memberships_user_idx").on(t.userId)],
);
