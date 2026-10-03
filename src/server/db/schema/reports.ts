import { index, int, mysqlEnum, mysqlTable, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";
import { questions } from "./content";
import { practiceQuestions } from "./practice";
import { users } from "./users";

// Laporan soal dari siswa (soal bank di pembahasan/latihan, atau soal Latihan AI).

export const REPORT_REASONS = ["kunci_salah", "soal_ambigu", "di_luar_materi", "salah_ketik", "lainnya"] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const questionReports = mysqlTable(
  "question_reports",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Tepat satu terisi. */
    questionId: int("question_id").references(() => questions.id, { onDelete: "cascade" }),
    practiceQuestionId: int("practice_question_id").references(() => practiceQuestions.id, { onDelete: "cascade" }),
    reason: mysqlEnum("reason", REPORT_REASONS).notNull(),
    note: varchar("note", { length: 500 }),
    status: mysqlEnum("status", ["open", "resolved"]).notNull().default("open"),
    resolvedBy: int("resolved_by").references(() => users.id, { onDelete: "set null" }),
    resolvedAt: timestamp("resolved_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  // Satu laporan per siswa per soal (NULL tidak bentrok di unique MySQL).
  (t) => [
    uniqueIndex("question_reports_user_question_idx").on(t.userId, t.questionId),
    uniqueIndex("question_reports_user_practice_idx").on(t.userId, t.practiceQuestionId),
    // Antrean laporan admin: status open, terbaru dulu.
    index("question_reports_status_created_idx").on(t.status, t.createdAt),
  ],
);
