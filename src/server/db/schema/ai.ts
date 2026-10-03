import { customType, index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
import { users } from "./users";

// Grup: AI & media soal (docs/AI_GENERATION.md, DECISIONS 2026-09-30).

/** Biner hingga 16 MB (MariaDB/MySQL MEDIUMBLOB); driver mengembalikan Buffer. */
const mediumBlob = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => "mediumblob",
});

/**
 * Galeri gambar soal. Disimpan di DB (bukan disk) supaya aman dari redeploy
 * Hostinger & ikut backup database. Sudah dikompres ke WebP saat upload.
 * Dirujuk soal lewat `questions.image_url = "/gambar/<id>"`.
 */
export const questionImages = mysqlTable("question_images", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  mime: varchar("mime", { length: 32 }).notNull(),
  width: int("width").notNull(),
  height: int("height").notNull(),
  sizeBytes: int("size_bytes").notNull(),
  /** SHA-256 isi file hasil kompres — cegah unggahan ganda. */
  sha256: varchar("sha256", { length: 64 }).notNull().unique(),
  data: mediumBlob("data").notNull(),
  uploadedBy: int("uploaded_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const AI_GENERATION_MODES = ["baru", "variasi", "gambar", "grup"] as const;
export type AiGenerationMode = (typeof AI_GENERATION_MODES)[number];

/** Audit & pembatasan panggilan Gemini — TANPA isi API key. */
export const aiGenerationLogs = mysqlTable("ai_generation_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  purpose: mysqlEnum("purpose", ["bank_admin", "practice"]).notNull(),
  mode: mysqlEnum("mode", AI_GENERATION_MODES).notNull(),
  subtopicCode: varchar("subtopic_code", { length: 32 }).notNull(),
  sourceQuestionId: int("source_question_id"),
  imageId: int("image_id"),
  requested: int("requested").notNull(),
  validCount: int("valid_count").notNull().default(0),
  model: varchar("model", { length: 64 }).notNull(),
  error: text("error"),
  durationMs: int("duration_ms").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  // Batas harian Latihan AI per siswa (user + purpose + sejak tanggal).
  index("ai_logs_user_purpose_created_idx").on(t.userId, t.purpose, t.createdAt),
]);
