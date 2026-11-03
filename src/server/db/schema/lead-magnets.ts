import { boolean, index, int, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
import { mediumBlob } from "./blob";
import { testPackages } from "./packages";
import { users } from "./users";

// Grup: Lead magnet — file materi gratis di /materi/[slug] (bukan Google Drive).
// File disimpan di DB seperti gambar soal (DECISIONS 2026-09-30: aman dari redeploy
// Hostinger & ikut backup). Query daftar WAJIB memilih kolom eksplisit (tanpa blob).

/** Satu materi yang bisa diunduh. Slug = bagian URL /materi/<slug> yang dipakai di link kampanye. */
export const leadMagnets = mysqlTable("lead_magnets", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  /** Cuplikan isi (teks) yang tampil sebelum mengunduh. */
  previewText: text("preview_text"),
  /** Gambar pratinjau publik (sudah dikompres WebP). NULL = tanpa gambar. */
  previewImage: mediumBlob("preview_image"),
  previewImageMime: varchar("preview_image_mime", { length: 32 }),
  fileData: mediumBlob("file_data").notNull(),
  /** Nama file saat diunduh. */
  fileName: varchar("file_name", { length: 200 }).notNull(),
  fileMime: varchar("file_mime", { length: 64 }).notNull(),
  fileSize: int("file_size").notNull(),
  /** true = harus login (akun aktif) untuk mengunduh. */
  requiresLogin: boolean("requires_login").notNull().default(true),
  /** false = halaman /materi/<slug> 404 (link kampanye lama mati). */
  isActive: boolean("is_active").notNull().default(true),
  /** Paket tes yang ditawarkan di bawah tombol unduh. NULL = ajakan Demo Tes. */
  ctaPackageId: int("cta_package_id").references(() => testPackages.id, { onDelete: "set null" }),
  createdBy: int("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  /** Ikut jadi kunci cache isi file di memori (services/lead-magnets). */
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

/** Satu baris per unduhan. user_id NULL = pengunjung tanpa login (materi tanpa wajib login). */
export const leadMagnetDownloads = mysqlTable(
  "lead_magnet_downloads",
  {
    id: int("id").autoincrement().primaryKey(),
    leadMagnetId: int("lead_magnet_id")
      .notNull()
      .references(() => leadMagnets.id, { onDelete: "cascade" }),
    userId: int("user_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("lead_magnet_downloads_magnet_idx").on(t.leadMagnetId, t.createdAt), index("lead_magnet_downloads_user_idx").on(t.userId)],
);
