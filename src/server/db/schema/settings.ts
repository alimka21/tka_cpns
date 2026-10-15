import { boolean, decimal, int, mysqlEnum, mysqlTable, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";
import { ACHIEVEMENT_CATEGORIES, SCORE_SCALES } from "@/lib/score-scale";
import { jsonText } from "./json-text";
import { users } from "./users";

/** Pengaturan sistem key → value (JSON). Dibaca lewat services/app-settings.ts. */
export const appSettings = mysqlTable("app_settings", {
  key: varchar("key", { length: 64 }).primaryKey(),
  value: jsonText<unknown>("value").notNull(),
  updatedBy: int("updated_by").references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

/**
 * Ambang kategori capaian Baik/Memadai/Kurang per skala — TIDAK diatur
 * regulasi, jadi diisi admin (Pengaturan Sistem). Kosong = kategori tidak
 * ditampilkan. `is_official` ditandai bila ambang resmi kelak terbit.
 */
export const achievementThresholds = mysqlTable(
  "achievement_thresholds",
  {
    id: int("id").autoincrement().primaryKey(),
    scoreScale: mysqlEnum("score_scale", SCORE_SCALES).notNull(),
    category: mysqlEnum("category", ACHIEVEMENT_CATEGORIES).notNull(),
    minScore: decimal("min_score", { precision: 6, scale: 2 }).notNull(),
    maxScore: decimal("max_score", { precision: 6, scale: 2 }).notNull(),
    isOfficial: boolean("is_official").notNull().default(false),
    updatedBy: int("updated_by").references(() => users.id, { onDelete: "set null" }),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (t) => [uniqueIndex("achievement_thresholds_scale_category_idx").on(t.scoreScale, t.category)],
);
