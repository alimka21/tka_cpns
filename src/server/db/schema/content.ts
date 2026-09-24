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

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
});

export const topics = mysqlTable("topics", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("category_id")
    .notNull()
    .references(() => categories.id),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  order: int("order").notNull().default(0),
});

export const subtopics = mysqlTable("subtopics", {
  id: int("id").autoincrement().primaryKey(),
  topicId: int("topic_id")
    .notNull()
    .references(() => topics.id),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
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
