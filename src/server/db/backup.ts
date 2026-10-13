// `npm run db:backup` (lokal, .env) / `npm run prod:db:backup` (produksi → file di komputer ini).
// Opsi: --dir=<folder> (default BACKUP_DIR atau ~/backups/pakartka), --email.

import { createBackup, emailBackup } from "@/server/services/db-backup";

async function main() {
  const dir = process.argv.find((a) => a.startsWith("--dir="))?.slice(6);
  if (dir) process.env.BACKUP_DIR = dir;
  const host = URL.parse(process.env.DATABASE_URL ?? "")?.hostname ?? "?";
  console.log(`Backup database di ${host} …`);
  const r = await createBackup();
  console.log(`✓ ${r.name} — ${(r.sizeBytes / 1024 / 1024).toFixed(2)} MB, ${r.tables} tabel, ${r.rows} baris, ${(r.ms / 1000).toFixed(1)} dtk`);
  console.log(`  Folder: ${process.env.BACKUP_DIR || "~/backups/pakartka"}`);
  if (r.deleted.length) console.log(`  Dihapus (rotasi): ${r.deleted.join(", ")}`);
  if (process.argv.includes("--email")) console.log("  Email:", (await emailBackup(r)).note);
  process.exit(0);
}

main().catch((e) => {
  console.error("✗ Backup gagal:", e instanceof Error ? e.message : e);
  process.exit(1);
});
