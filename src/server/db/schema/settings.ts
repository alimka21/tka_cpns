import { int, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";
import { jsonText } from "./json-text";
import { users } from "./users";

/** Pengaturan sistem key → value (JSON). Dibaca lewat services/app-settings.ts. */
export const appSettings = mysqlTable("app_settings", {
  key: varchar("key", { length: 64 }).primaryKey(),
  value: jsonText<unknown>("value").notNull(),
  updatedBy: int("updated_by").references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});
