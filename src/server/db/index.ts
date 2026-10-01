import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

// Pengaman koneksi idle: MariaDB Hostinger memakai `wait_timeout` 20 detik, dan
// jaringan (NAT/seluler) bisa memutus TCP yang menganggur tanpa pemberitahuan
// → pool memakai ulang koneksi mati → query gagal ECONNRESET (HTTP 500, terlihat
// saat uji 2026-10-01). Koneksi idle ditutup sendiri setelah 10 detik + TCP
// keep-alive. Pembersihan mysql2 hanya aktif bila maxIdle < connectionLimit.
const connection = mysql.createPool({
  uri: process.env.DATABASE_URL!,
  connectionLimit: 10,
  maxIdle: 9,
  idleTimeout: 10_000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 5_000,
});

export const db = drizzle(connection, { schema, mode: "default" });
