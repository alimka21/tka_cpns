import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { users } from "./users";

// Hierarki konten = kerangka asesmen TKA (asesmen/tka-*.json, lihat
// src/server/asesmen): jenjang → mata uji → domain → subdomain.
// Nama tabel `topics`/`subtopics` dipertahankan: topic = domain,
// subtopic = subdomain (unit analisis kelemahan). Detail cakupan/batasan
// tidak disalin ke DB — dibaca dari file kerangka lewat `code`.

/** Jenjang: SD, SMP, SMA. */
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 8 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
});

/** Mata uji, mis. SMP-MTK. */
export const subjects = mysqlTable("subjects", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("category_id")
    .notNull()
    .references(() => categories.id),
  code: varchar("code", { length: 32 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["wajib", "pilihan"]).notNull(),
  structure: mysqlEnum("structure", ["kompetensi_subkompetensi", "elemen_subelemen"]).notNull(),
  order: int("order").notNull().default(0),
});

/** Domain (kompetensi / elemen), mis. SMP-MTK-D1. */
export const topics = mysqlTable("topics", {
  id: int("id").autoincrement().primaryKey(),
  subjectId: int("subject_id")
    .notNull()
    .references(() => subjects.id),
  code: varchar("code", { length: 32 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  order: int("order").notNull().default(0),
});

/** Subdomain (subkompetensi / sub-elemen), mis. SMP-MTK-D1-S1. */
export const subtopics = mysqlTable("subtopics", {
  id: int("id").autoincrement().primaryKey(),
  topicId: int("topic_id")
    .notNull()
    .references(() => topics.id),
  code: varchar("code", { length: 32 }).notNull().unique(),
  // Nama subdomain terpanjang di regulasi 284 karakter (SMA-PPKN-D4-S1).
  name: varchar("name", { length: 512 }).notNull(),
  order: int("order").notNull().default(0),
});

export const questions = mysqlTable("questions", {
  id: int("id").autoincrement().primaryKey(),
  subtopicId: int("subtopic_id")
    .notNull()
    .references(() => subtopics.id),
  type: mysqlEnum("type", ["single_choice"])
    .notNull()
    .default("single_choice"),
  questionText: text("question_text").notNull(),
  imageUrl: varchar("image_url", { length: 2048 }),
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard"]).notNull(),
  /** L1/L2/L3 sesuai level kognitif mata uji; null untuk mata uji bahasa. */
  cognitiveLevel: varchar("cognitive_level", { length: 4 }),
  status: mysqlEnum("status", ["draft", "pending_review", "published"])
    .notNull()
    .default("draft"),
  generatedBy: mysqlEnum("generated_by", ["manual", "ai", "import"])
    .notNull()
    .default("manual"),
  sourceUserId: int("source_user_id").references(() => users.id),
  createdBy: int("created_by")
    .notNull()
    .references(() => users.id),
  reviewedBy: int("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const questionOptions = mysqlTable("question_options", {
  id: int("id").autoincrement().primaryKey(),
  questionId: int("question_id")
    .notNull()
    .references(() => questions.id),
  label: mysqlEnum("label", ["A", "B", "C", "D", "E"]).notNull(),
  optionText: text("option_text").notNull(),
  isCorrect: boolean("is_correct").notNull().default(false),
  order: int("order").notNull().default(0),
});

export const questionExplanations = mysqlTable("question_explanations", {
  id: int("id").autoincrement().primaryKey(),
  questionId: int("question_id")
    .notNull()
    .unique()
    .references(() => questions.id),
  explanationText: text("explanation_text").notNull(),
});
