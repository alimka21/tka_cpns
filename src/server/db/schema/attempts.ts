import {
  boolean,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/mysql-core";
import type { AnswerResponse } from "@/lib/validation/attempt";
import { subtopics } from "./content";
import { jsonText } from "./json-text";
import { testPackages } from "./packages";
import { users } from "./users";

// Grup: Attempt / pengerjaan (docs/DATABASE.md §Grup: Attempt).

export const ATTEMPT_STATUSES = ["in_progress", "submitted", "expired"] as const;
export type AttemptStatus = (typeof ATTEMPT_STATUSES)[number];

export const attempts = mysqlTable("attempts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  testPackageId: int("test_package_id")
    .notNull()
    .references(() => testPackages.id),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  endsAt: timestamp("ends_at").notNull(),
  submittedAt: timestamp("submitted_at"),
  status: mysqlEnum("status", ATTEMPT_STATUSES).notNull().default("in_progress"),
  /** Diisi saat finalize (submit atau auto-expire). */
  totalScore: int("total_score"),
  maxScore: int("max_score"),
});

export const attemptAnswers = mysqlTable(
  "attempt_answers",
  {
    id: int("id").autoincrement().primaryKey(),
    attemptId: int("attempt_id")
      .notNull()
      .references(() => attempts.id, { onDelete: "cascade" }),
    questionId: int("question_id").notNull(),
    /** Zod `answerResponse` — null = belum dijawab. */
    response: jsonText<AnswerResponse>("response"),
    isFlagged: boolean("is_flagged").notNull().default(false),
    answeredAt: timestamp("answered_at").notNull().defaultNow().onUpdateNow(),
  },
  (t) => [uniqueIndex("attempt_answers_attempt_question_idx").on(t.attemptId, t.questionId)],
);

export const attemptSubtopicScores = mysqlTable(
  "attempt_subtopic_scores",
  {
    id: int("id").autoincrement().primaryKey(),
    attemptId: int("attempt_id")
      .notNull()
      .references(() => attempts.id, { onDelete: "cascade" }),
    subtopicId: int("subtopic_id")
      .notNull()
      .references(() => subtopics.id),
    correctCount: int("correct_count").notNull(),
    totalCount: int("total_count").notNull(),
    score: int("score").notNull(),
    percentage: decimal("percentage", { precision: 5, scale: 2, mode: "number" }).notNull(),
  },
  (t) => [uniqueIndex("attempt_subtopic_scores_attempt_subtopic_idx").on(t.attemptId, t.subtopicId)],
);
