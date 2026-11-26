import { index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";
import { testPackages } from "./packages";
import { JENJANG_CODES, users } from "./users";

// Grup: Kelas Guru (DECISIONS 2026-11-26). Guru (users.is_teacher atau afiliasi aktif) membuat
// kelas; siswa bergabung dengan kode kelas. Kode afiliasi TIDAK otomatis memasukkan siswa ke kelas.
// Selama siswa anggota kelas, guru bisa memantau seluruh hasil tes & latihannya.

export const classes = mysqlTable(
  "classes",
  {
    id: int("id").autoincrement().primaryKey(),
    teacherId: int("teacher_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    /** Siswa hanya bisa bergabung bila jenjangnya sama; tugas hanya paket jenjang ini. */
    jenjang: mysqlEnum("jenjang", JENJANG_CODES).notNull(),
    /** Kode gabung (lib/classroom), huruf besar tanpa karakter mirip. */
    joinCode: varchar("join_code", { length: 8 }).notNull(),
    /** Diisi = kelas diarsipkan: tidak menerima anggota baru, tetap terlihat guru. */
    archivedAt: timestamp("archived_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("classes_join_code_idx").on(t.joinCode), index("classes_teacher_idx").on(t.teacherId)],
);

export const classMembers = mysqlTable(
  "class_members",
  {
    id: int("id").autoincrement().primaryKey(),
    classId: int("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    userId: int("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("class_members_class_user_idx").on(t.classId, t.userId), index("class_members_user_idx").on(t.userId)],
);

/**
 * Tugas = paket tes tayang yang dikerjakan mulai `starts_at`. Selesai = attempt submitted paket itu
 * yang dimulai sejak `starts_at` (dan dikumpulkan sebelum `due_at` bila diisi). Akses paket tetap
 * aturan biasa: paket Premium hanya untuk siswa Premium, kuota gratis berlaku.
 */
export const classAssignments = mysqlTable(
  "class_assignments",
  {
    id: int("id").autoincrement().primaryKey(),
    classId: int("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    testPackageId: int("test_package_id")
      .notNull()
      .references(() => testPackages.id, { onDelete: "cascade" }),
    note: text("note"),
    startsAt: timestamp("starts_at").notNull(),
    dueAt: timestamp("due_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("class_assignments_class_starts_idx").on(t.classId, t.startsAt)],
);
