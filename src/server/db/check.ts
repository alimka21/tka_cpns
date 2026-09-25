// Cek koneksi database (read-only): `npm run db:check`.
// Menampilkan versi server, tabel, dan migrasi yang sudah dijalankan —
// tidak mengubah apa pun. Pesan error diberi petunjuk khusus Hostinger.

import mysql from "mysql2/promise";

const HINTS: Record<string, string> = {
  ER_ACCESS_DENIED_ERROR:
    "Username/password salah, atau user belum diberi akses ke database ini. Cek di hPanel → Databases → MySQL Databases.",
  ER_BAD_DB_ERROR: "Nama database tidak ditemukan. Salin nama lengkapnya dari hPanel (biasanya berawalan u123456789_).",
  ENOTFOUND: "Host tidak dikenal. Salin hostname MySQL dari hPanel, jangan pakai domain website.",
  ECONNREFUSED:
    "Koneksi ditolak. Dari komputer lokal, 'localhost' tidak bisa dipakai — gunakan host remote dari hPanel dan aktifkan Remote MySQL.",
  ETIMEDOUT:
    "Koneksi timeout. Aktifkan Remote MySQL di hPanel dan tambahkan IP publik komputer ini (atau sementara '%' saat development).",
  ER_HOST_NOT_PRIVILEGED: "IP komputer ini belum diizinkan. Tambahkan di hPanel → Databases → Remote MySQL.",
};

function describeUrl(raw: string) {
  try {
    const url = new URL(raw);
    return `${url.username}@${url.hostname}:${url.port || "3306"}${url.pathname}`;
  } catch {
    return null;
  }
}

async function main() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL belum diisi di .env");
  const target = describeUrl(raw);
  if (!target) throw new Error("DATABASE_URL tidak valid. Format: mysql://USER:PASSWORD@HOST:3306/NAMA_DB (password dengan karakter khusus harus di-encode, mis. @ → %40)");
  if (raw.includes("user:password@localhost")) throw new Error("DATABASE_URL masih nilai contoh dari .env.example — isi dengan kredensial dari hPanel.");

  console.log(`Menghubungkan ke ${target} …`);
  const conn = await mysql.createConnection({ uri: raw, connectTimeout: 10_000 });
  try {
    const [[{ version }]] = (await conn.query("SELECT VERSION() AS version")) as unknown as [[{ version: string }]];
    console.log(`✓ Terhubung. Server: ${version}`);

    const [tables] = (await conn.query("SHOW TABLES")) as unknown as [Record<string, string>[]];
    const names = tables.map((t) => Object.values(t)[0]);
    console.log(`  Tabel (${names.length}): ${names.join(", ") || "— kosong, siap untuk npm run db:migrate"}`);

    if (names.includes("__drizzle_migrations")) {
      const [rows] = (await conn.query("SELECT COUNT(*) AS n FROM __drizzle_migrations")) as unknown as [[{ n: number }]];
      console.log(`  Migrasi yang sudah dijalankan: ${rows[0].n}`);
    }
  } finally {
    await conn.end();
  }
}

main().catch((error: { code?: string; message?: string }) => {
  console.error(`✗ Gagal: ${error.message ?? error}`);
  const hint = error.code && HINTS[error.code];
  if (hint) console.error(`  Petunjuk: ${hint}`);
  process.exit(1);
});
