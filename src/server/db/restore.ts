// `npm run db:restore -- <file.sql.gz> [--db=<nama>]` — pulihkan backup ke database
// LOKAL (.env). Sengaja menolak host non-lokal: produksi dipulihkan lewat
// phpMyAdmin (WORKFLOW §14) supaya tidak tertimpa tanpa sengaja.

import { createReadStream } from "node:fs";
import { createGunzip } from "node:zlib";
import mysql from "mysql2/promise";

async function main() {
  const file = process.argv.slice(2).find((a) => !a.startsWith("--"));
  if (!file) throw new Error("Pakai: npm run db:restore -- <file.sql.gz> [--db=<nama>]");
  const url = URL.parse(process.env.DATABASE_URL ?? "");
  if (!url || !["localhost", "127.0.0.1"].includes(url.hostname)) throw new Error("Hanya untuk database lokal (DATABASE_URL di .env).");
  const target = process.argv.find((a) => a.startsWith("--db="))?.slice(5);
  if (target) {
    if (!/^[A-Za-z0-9_]+$/.test(target)) throw new Error("Nama database tidak valid.");
    url.pathname = `/${target}`;
    const admin = await mysql.createConnection({ uri: url.toString().replace(/\/[^/?]*(\?|$)/, "/$1") });
    await admin.query(`CREATE DATABASE IF NOT EXISTS \`${target}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await admin.end();
  }
  const conn = await mysql.createConnection({ uri: url.toString() });
  console.log(`Memulihkan ${file} → ${url.pathname.slice(1)} …`);
  let buf = "";
  let count = 0;
  const run = async (stmt: string) => {
    if (stmt.trim().replace(/^(--.*\n?)+/gm, "").trim()) {
      await conn.query(stmt);
      count++;
    }
  };
  // Dump kita: setiap pernyataan diakhiri ";\n" dan string tidak memuat baris baru mentah.
  for await (const chunk of createReadStream(file).pipe(createGunzip())) {
    buf += chunk.toString("utf8");
    let i;
    while ((i = buf.indexOf(";\n")) !== -1) {
      await run(buf.slice(0, i));
      buf = buf.slice(i + 2);
    }
  }
  await run(buf);
  await conn.end();
  console.log(`✓ Selesai — ${count} pernyataan dijalankan.`);
}

main().catch((e) => {
  console.error("✗ Gagal:", e instanceof Error ? e.message : e);
  process.exit(1);
});
