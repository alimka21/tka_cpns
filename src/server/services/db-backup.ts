// Backup database (SERVER-ONLY): dump SQL lengkap → .sql.gz di BACKUP_DIR,
// rotasi BACKUP_KEEP file terbaru. Format kompatibel dengan `mysql` CLI dan
// Import phpMyAdmin (WORKFLOW §14). Tabel sesi/token login hanya strukturnya
// (data rahasia & sementara). Dipanggil cron (/api/cron/backup), tombol admin,
// dan `npm run db:backup`.

import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, readdir, rename, rm, stat } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { createGzip } from "node:zlib";
import mysql from "mysql2/promise";

/** Data tabel ini tidak ikut dibackup (hanya struktur): token sesi & verifikasi bersifat rahasia dan sementara. */
const STRUCTURE_ONLY = new Set(["sessions", "verifications"]);
const BATCH_ROWS = 200;
const BATCH_BYTES = 1_000_000;
const FILE_RE = /^pakartka-(\d{8}-\d{6})\.sql\.gz$/;

export type BackupFile = { name: string; sizeBytes: number; createdAt: Date };
export type BackupResult = BackupFile & { tables: number; rows: number; ms: number; deleted: string[] };

export function backupDir() {
  return process.env.BACKUP_DIR?.trim() || path.join(homedir(), "backups", "pakartka");
}

export function backupKeep() {
  const n = Number(process.env.BACKUP_KEEP);
  return Number.isInteger(n) && n >= 1 ? Math.min(n, 365) : 14;
}

/** Nama file dari daftar backup — menolak path traversal. */
export function safeBackupName(name: string) {
  return FILE_RE.test(name) ? name : null;
}

export async function listBackups(): Promise<BackupFile[]> {
  const dir = backupDir();
  const names = await readdir(dir).catch(() => [] as string[]);
  const files = await Promise.all(
    names
      .filter((n) => FILE_RE.test(n))
      .map(async (name) => {
        const s = await stat(path.join(dir, name));
        return { name, sizeBytes: s.size, createdAt: s.mtime };
      }),
  );
  return files.sort((a, b) => b.name.localeCompare(a.name));
}

export function backupReadStream(name: string) {
  const safe = safeBackupName(name);
  if (!safe) throw new Error("Nama file backup tidak valid.");
  return createReadStream(path.join(backupDir(), safe));
}

function stamp(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}-${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}`;
}

const q = (ident: string) => `\`${ident.replace(/`/g, "``")}\``;

/** Satu backup berjalan dalam satu proses (cron & tombol admin bisa bersamaan). */
let running: Promise<BackupResult> | null = null;

export function createBackup(): Promise<BackupResult> {
  running ??= runBackup().finally(() => {
    running = null;
  });
  return running;
}

async function runBackup(): Promise<BackupResult> {
  const started = Date.now();
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL belum diisi.");
  const dir = backupDir();
  await mkdir(dir, { recursive: true, mode: 0o700 });
  const name = `pakartka-${stamp(new Date())}.sql.gz`;
  const tmp = path.join(dir, `.${name}.tmp`);

  // Koneksi tersendiri: tanggal dibaca apa adanya (dateStrings) di zona UTC, sama dengan saat ditulis ulang.
  const conn = await mysql.createConnection({ uri: url, dateStrings: true, timezone: "Z", supportBigNumbers: true, bigNumberStrings: true });
  let tables = 0;
  let rows = 0;
  try {
    await conn.query("SET time_zone = '+00:00'");
    // Snapshot konsisten untuk tabel InnoDB tanpa mengunci aplikasi.
    await conn.query("SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ");
    await conn.query("START TRANSACTION WITH CONSISTENT SNAPSHOT");
    const [dbRow] = (await conn.query("SELECT DATABASE() AS d")) as unknown as [{ d: string }[]];
    const [tableRows] = (await conn.query(
      "SELECT table_name AS t FROM information_schema.tables WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE' ORDER BY table_name",
    )) as unknown as [{ t: string }[]];

    async function* dump() {
      yield `-- Backup ${dbRow[0].d} — ${new Date().toISOString()}\n-- Pulihkan: mysql <db> < file.sql (setelah gunzip) atau Import di phpMyAdmin.\n`;
      yield "SET NAMES utf8mb4;\nSET time_zone = '+00:00';\nSET FOREIGN_KEY_CHECKS = 0;\nSET UNIQUE_CHECKS = 0;\nSET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';\n\n";
      for (const { t } of tableRows) {
        tables++;
        const [[create]] = (await conn.query(`SHOW CREATE TABLE ${q(t)}`)) as unknown as [Record<string, string>[]];
        yield `-- Tabel ${t}\nDROP TABLE IF EXISTS ${q(t)};\n${create["Create Table"]};\n\n`;
        if (STRUCTURE_ONLY.has(t)) continue;
        const [pk] = (await conn.query(
          "SELECT column_name AS c FROM information_schema.key_column_usage WHERE table_schema = DATABASE() AND table_name = ? AND constraint_name = 'PRIMARY' ORDER BY ordinal_position",
          [t],
        )) as unknown as [{ c: string }[]];
        const order = pk.length ? ` ORDER BY ${pk.map((r) => q(r.c)).join(", ")}` : "";
        for (let offset = 0; ; offset += BATCH_ROWS) {
          const [batch] = (await conn.query(`SELECT * FROM ${q(t)}${order} LIMIT ${BATCH_ROWS} OFFSET ${offset}`)) as unknown as [Record<string, unknown>[]];
          if (batch.length === 0) break;
          const cols = Object.keys(batch[0]).map(q).join(", ");
          let values: string[] = [];
          let size = 0;
          for (const row of batch) {
            const v = `(${Object.values(row).map((x) => conn.escape(x)).join(", ")})`;
            values.push(v);
            size += v.length;
            if (size >= BATCH_BYTES) {
              yield `INSERT INTO ${q(t)} (${cols}) VALUES\n${values.join(",\n")};\n`;
              values = [];
              size = 0;
            }
          }
          if (values.length) yield `INSERT INTO ${q(t)} (${cols}) VALUES\n${values.join(",\n")};\n`;
          rows += batch.length;
          if (batch.length < BATCH_ROWS) break;
        }
        yield "\n";
      }
      yield "SET FOREIGN_KEY_CHECKS = 1;\nSET UNIQUE_CHECKS = 1;\n-- Selesai.\n";
    }

    await pipeline(dump, createGzip({ level: 6 }), createWriteStream(tmp, { mode: 0o600 }));
    await conn.query("COMMIT");
  } catch (e) {
    await rm(tmp, { force: true });
    throw e;
  } finally {
    await conn.end();
  }
  await rename(tmp, path.join(dir, name));

  // Rotasi: sisakan BACKUP_KEEP file terbaru (file yang baru dibuat selalu termasuk).
  const all = await listBackups();
  const deleted: string[] = [];
  for (const old of all.slice(backupKeep())) {
    await rm(path.join(dir, old.name), { force: true });
    deleted.push(old.name);
  }
  const s = await stat(path.join(dir, name));
  return { name, sizeBytes: s.size, createdAt: s.mtime, tables, rows, ms: Date.now() - started, deleted };
}

/** Batas lampiran email (Gmail menerima ±25 MB; base64 menambah ±33%). */
const EMAIL_MAX_BYTES = 18 * 1024 * 1024;

/** Kirim salinan backup ke BACKUP_EMAIL_TO (salinan di luar server hosting). */
export async function emailBackup(file: BackupFile): Promise<{ sent: boolean; note: string }> {
  const to = process.env.BACKUP_EMAIL_TO?.trim();
  if (!to) return { sent: false, note: "BACKUP_EMAIL_TO belum diisi" };
  const { isMailConfigured, sendMail } = await import("./mailer");
  if (!isMailConfigured()) return { sent: false, note: "SMTP belum dikonfigurasi" };
  const mb = (file.sizeBytes / 1024 / 1024).toFixed(1);
  const tooBig = file.sizeBytes > EMAIL_MAX_BYTES;
  const text = tooBig
    ? `Backup ${file.name} (${mb} MB) berhasil dibuat, tetapi terlalu besar untuk lampiran email. Unduh dari Admin → Backup Database.`
    : `Terlampir backup database Pakar TKA: ${file.name} (${mb} MB).\nSimpan di tempat aman (berisi data pengguna). Cara memulihkan: docs/WORKFLOW.md §14.`;
  await sendMail({
    to,
    subject: `Backup database Pakar TKA — ${file.name.slice(9, 17)}`,
    text,
    html: `<p>${text.replace(/\n/g, "<br>")}</p>`,
    ...(!tooBig && { attachments: [{ filename: file.name, path: path.join(backupDir(), file.name) }] }),
  });
  return { sent: true, note: tooBig ? "terlalu besar — email tanpa lampiran" : `terkirim ke ${to}` };
}
