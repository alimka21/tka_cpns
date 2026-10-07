// Salin KONTEN dari database produksi (.env.prod) ke database LOKAL (.env):
// kerangka, soal, bacaan, gambar, paket, paket langganan, pengaturan.
// TIDAK disalin: akun & sesi, jawaban/percobaan, latihan, pembayaran,
// membership, API key, laporan soal, log AI. Pembuat konten diganti akun
// pengganti anonim (Admin <id>, admin<id>@dev.local) agar foreign key valid.
//
//   npm run db:dev:sync                       # isi ulang database lokal (data lokal DIHAPUS)
//   npm run db:dev:sync -- --sumber=.env.lain  # sumber selain .env.prod
//
// Pengaman: produksi hanya dibaca (SELECT); tujuan wajib localhost/127.0.0.1.

import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { parseEnv } from "node:util";
import mysql from "mysql2/promise";

const CONTENT_TABLES = [
  "categories",
  "subjects",
  "topics",
  "subtopics",
  "stimuli",
  "questions",
  "question_options",
  "question_explanations",
  "question_images",
  "test_packages",
  "test_package_questions",
  "plans",
  "app_settings",
] as const;

/** Kolom konten yang merujuk users → perlu akun pengganti di lokal. */
const USER_REFS: [string, string][] = [
  ["questions", "created_by"],
  ["questions", "reviewed_by"],
  ["questions", "source_user_id"],
  ["stimuli", "created_by"],
  ["question_images", "uploaded_by"],
  ["test_packages", "created_by"],
  ["app_settings", "updated_by"],
];

function host(url: string) {
  return new URL(url).hostname;
}

async function main() {
  const devUrl = process.env.DATABASE_URL;
  if (!devUrl) throw new Error("DATABASE_URL (.env) kosong.");
  const source = process.argv.find((a) => a.startsWith("--sumber="))?.slice("--sumber=".length) || ".env.prod";
  let prodUrl: string | undefined;
  try {
    prodUrl = parseEnv(readFileSync(source, "utf8")).DATABASE_URL;
  } catch {
    throw new Error(`File ${source} tidak ditemukan (berisi DATABASE_URL produksi).`);
  }
  if (!prodUrl) throw new Error(`${source} tidak berisi DATABASE_URL.`);
  if (!["localhost", "127.0.0.1"].includes(host(devUrl))) throw new Error(`Tujuan bukan database lokal (${host(devUrl)}). Dibatalkan.`);
  if (devUrl === prodUrl) throw new Error("DATABASE_URL lokal sama dengan produksi. Dibatalkan.");

  const prod = await mysql.createConnection({ uri: prodUrl });
  const dev = await mysql.createConnection({ uri: devUrl });
  console.log(`Sumber: ${host(prodUrl)} (baca saja) → tujuan: ${host(devUrl)}/${new URL(devUrl).pathname.slice(1)}`);

  await dev.query("SET FOREIGN_KEY_CHECKS = 0");
  const [tables] = await dev.query<mysql.RowDataPacket[]>("SELECT table_name AS t FROM information_schema.tables WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'");
  for (const { t } of tables) if (!String(t).startsWith("__drizzle")) await dev.query("TRUNCATE TABLE ??", [t]);

  // Akun pengganti untuk semua pembuat/peninjau konten.
  const ids = new Set<number>();
  for (const [table, col] of USER_REFS) {
    const [rows] = await prod.query<mysql.RowDataPacket[]>("SELECT DISTINCT ?? AS id FROM ?? WHERE ?? IS NOT NULL", [col, table, col]);
    for (const r of rows) ids.add(Number(r.id));
  }
  const now = new Date();
  if (ids.size) {
    await dev.query("INSERT INTO users (id, name, email, email_verified, role, status, created_at, updated_at) VALUES ?", [
      [...ids].map((id) => [id, `Admin ${id}`, `admin${id}@dev.local`, 0, "admin", "active", now, now]),
    ]);
  }

  for (const table of CONTENT_TABLES) {
    const chunk = table === "question_images" ? 10 : 500;
    let offset = 0;
    let copied = 0;
    for (;;) {
      const [rows] = await prod.query<mysql.RowDataPacket[]>("SELECT * FROM ?? ORDER BY 1 LIMIT ? OFFSET ?", [table, chunk, offset]);
      if (rows.length === 0) break;
      const cols = Object.keys(rows[0]);
      await dev.query("INSERT INTO ?? (??) VALUES ?", [table, cols, rows.map((r) => cols.map((c) => r[c]))]);
      copied += rows.length;
      offset += chunk;
    }
    console.log(`  ${table.padEnd(24)} ${copied}`);
  }
  await dev.query("SET FOREIGN_KEY_CHECKS = 1");
  await prod.end();
  await dev.end();

  // Akun admin lokal untuk masuk ke dev (kata sandi acak, ditampilkan sekali).
  const { setUserPassword } = await import("@/server/services/password-reset");
  const { db } = await import("@/server/db");
  const { users } = await import("@/server/db/schema");
  const [{ id }] = await db.insert(users).values({ name: "Admin Dev", email: "admin@dev.local", role: "admin", status: "active", emailVerified: true }).$returningId();
  const password = `dev-${randomBytes(6).toString("hex")}`;
  await setUserPassword(id, password);
  console.log(`\nSelesai. ${ids.size} akun pengganti dibuat.`);
  console.log(`Masuk ke dev: admin@dev.local / ${password}   (hanya berlaku di database lokal)`);
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  },
);
