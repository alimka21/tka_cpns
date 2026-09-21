import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["student", "admin"]).notNull().default("student"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userAiSettings = mysqlTable("user_ai_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id),
  geminiApiKeyEncrypted: text("gemini_api_key_encrypted").notNull(),
  geminiKeyMasked: varchar("gemini_key_masked", { length: 50 }).notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
