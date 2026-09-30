import { boolean, int, mysqlEnum, mysqlTable, timestamp, uniqueIndex } from "drizzle-orm/mysql-core";
import type { AnswerResponse } from "@/lib/validation/attempt";
import { questions } from "./content";
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

export const practiceSessionItems = mysqlTable(
  "practice_session_items",
  {
    id: int("id").autoincrement().primaryKey(),
    sessionId: int("session_id")
      .notNull()
      .references(() => practiceSessions.id, { onDelete: "cascade" }),
    order: int("order").notNull(),
    /** Soal bank. (Soal AI privat menyusul: kolom practice_question_id.) */
    questionId: int("question_id")
      .notNull()
      .references(() => questions.id),
    /** Zod `answerResponse`; null = belum dijawab. Sekali dijawab tidak bisa diubah. */
    response: jsonText<AnswerResponse>("response"),
    isCorrect: boolean("is_correct"),
    answeredAt: timestamp("answered_at"),
  },
  (t) => [
    uniqueIndex("practice_items_session_order_idx").on(t.sessionId, t.order),
    uniqueIndex("practice_items_session_question_idx").on(t.sessionId, t.questionId),
  ],
);
