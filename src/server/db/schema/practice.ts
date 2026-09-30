import { boolean, foreignKey, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";
import type { AnswerResponse } from "@/lib/validation/attempt";
import { DIFFICULTIES, QUESTION_TYPES } from "@/lib/validation/enums";
import { questions, subtopics } from "./content";
import { jsonText } from "./json-text";
import { users } from "./users";

// Grup: Latihan Kelemahan (docs/AI_GENERATION.md §5 & §7). Latihan TIDAK
// dihitung ke skor tes resmi, tapi ikut diagnosa per subdomain.

export const PRACTICE_STATUSES = ["in_progress", "completed", "abandoned"] as const;
export type PracticeStatus = (typeof PRACTICE_STATUSES)[number];

export const practiceSessions = mysqlTable("practice_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  /** subtopics.id yang dipilih untuk sesi ini. */
  targetSubtopicIds: jsonText<number[]>("target_subtopic_ids").notNull(),
  questionCount: int("question_count").notNull(),
  status: mysqlEnum("status", PRACTICE_STATUSES).notNull().default("in_progress"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  /** Diisi saat sesi diselesaikan. */
  totalScore: int("total_score"),
  maxScore: int("max_score"),
});

export type PracticeQuestionOption = { label: string; text: string; isCorrect: boolean; correctCategory: string | null };

/**
 * Soal AI privat milik SATU siswa (Latihan Kelemahan saat bank kurang).
 * Tidak masuk bank resmi, tidak dipakai tes resmi, tanpa review admin
 * (divalidasi otomatis), berlabel "Latihan AI" dan bisa dilaporkan.
 * Id opsi = urutan 1..n (unik per soal) — kunci hanya di server.
 */
export const practiceQuestions = mysqlTable("practice_questions", {
  id: int("id").autoincrement().primaryKey(),
  ownerUserId: int("owner_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  subtopicId: int("subtopic_id")
    .notNull()
    .references(() => subtopics.id),
  type: mysqlEnum("type", QUESTION_TYPES).notNull(),
  questionText: text("question_text").notNull(),
  categoryLabels: jsonText<[string, string]>("category_labels"),
  options: jsonText<PracticeQuestionOption[]>("options").notNull(),
  explanation: text("explanation").notNull(),
  difficulty: mysqlEnum("difficulty", DIFFICULTIES).notNull(),
  cognitiveLevel: varchar("cognitive_level", { length: 4 }),
  model: varchar("model", { length: 64 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const practiceSessionItems = mysqlTable(
  "practice_session_items",
  {
    id: int("id").autoincrement().primaryKey(),
    sessionId: int("session_id")
      .notNull()
      .references(() => practiceSessions.id, { onDelete: "cascade" }),
    order: int("order").notNull(),
    /** Tepat satu terisi: soal bank ATAU soal AI privat (Latihan AI). */
    questionId: int("question_id").references(() => questions.id),
    /** FK diberi nama pendek di bawah (nama otomatis Drizzle > 64 karakter, ditolak MariaDB). */
    practiceQuestionId: int("practice_question_id"),
    /** Zod `answerResponse`; null = belum dijawab. Sekali dijawab tidak bisa diubah. */
    response: jsonText<AnswerResponse>("response"),
    isCorrect: boolean("is_correct"),
    answeredAt: timestamp("answered_at"),
  },
  (t) => [
    foreignKey({ name: "psi_practice_question_fk", columns: [t.practiceQuestionId], foreignColumns: [practiceQuestions.id] }).onDelete("cascade"),
    uniqueIndex("practice_items_session_order_idx").on(t.sessionId, t.order),
    uniqueIndex("practice_items_session_question_idx").on(t.sessionId, t.questionId),
  ],
);
