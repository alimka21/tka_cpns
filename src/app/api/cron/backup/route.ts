// Backup database terjadwal. Pasang di hPanel → Lanjutan → Cron Jobs (WORKFLOW §14):
//   curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://<domain>/api/cron/backup
// Tambah `?email=1` (mis. cron mingguan) untuk mengirim salinan ke BACKUP_EMAIL_TO.

import { timingSafeEqual } from "node:crypto";
import { createBackup, emailBackup } from "@/server/services/db-backup";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || secret.length < 24) return false;
  const header = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const given = header ?? new URL(req.url).searchParams.get("token") ?? "";
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function handle(req: Request) {
  if (!process.env.CRON_SECRET) return Response.json({ error: "CRON_SECRET belum diisi" }, { status: 503 });
  if (!authorized(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  try {
    const result = await createBackup();
    const email = new URL(req.url).searchParams.get("email") === "1" ? await emailBackup(result).catch((e: Error) => ({ sent: false, note: e.message })) : null;
    return Response.json({ ok: true, file: result.name, sizeBytes: result.sizeBytes, tables: result.tables, rows: result.rows, ms: result.ms, deleted: result.deleted, email });
  } catch (e) {
    console.error("[backup] gagal:", e instanceof Error ? e.message : e);
    return Response.json({ ok: false, error: "Backup gagal — lihat log server." }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
