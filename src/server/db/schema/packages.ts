import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
import { PACKAGE_STATUSES } from "@/lib/validation/enums";
import { categories, questions } from "./content";
import { users } from "./users";

// Grup: Paket Tes & Akses (docs/DATABASE.md §Grup: Paket Tes / Akses).

export const testPackages = mysqlTable("test_packages", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  categoryId: int("category_id")
    .notNull()
    .references(() => categories.id),
  durationMinutes: int("duration_minutes").notNull(),
  isPremium: boolean("is_premium").notNull().default(false),
  status: mysqlEnum("status", PACKAGE_STATUSES).notNull().default("draft"),
  createdBy: int("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const testPackageQuestions = mysqlTable(
  "test_package_questions",
  {
    id: int("id").autoincrement().primaryKey(),
    testPackageId: int("test_package_id")
      .notNull()
      .references(() => testPackages.id, { onDelete: "cascade" }),
    questionId: int("question_id")
      .notNull()
      .references(() => questions.id),
    order: int("order").notNull().default(0),
    /** Override skor default (1 poin) untuk soal ini di paket ini. */
    pointsOverride: int("points_override"),
  },
  (t) => [uniqueIndex("test_package_questions_pkg_question_idx").on(t.testPackageId, t.questionId)],
);

/**
 * Fase 1: diisi manual oleh admin (`granted_by = "admin_manual"`).
 * Strukturnya sudah menyerupai hasil pembelian supaya payment gateway
 * nanti tinggal insert ke tabel yang sama (docs/DATABASE.md).
 */
export const entitlements = mysqlTable(
  "entitlements",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    testPackageId: int("test_package_id")
      .notNull()
      .references(() => testPackages.id, { onDelete: "cascade" }),
    grantedBy: mysqlEnum("granted_by", ["admin_manual", "purchase"]).notNull().default("admin_manual"),
    grantedByUserId: int("granted_by_user_id").references(() => users.id),
    grantedAt: timestamp("granted_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("entitlements_user_pkg_idx").on(t.userId, t.testPackageId)],
);
