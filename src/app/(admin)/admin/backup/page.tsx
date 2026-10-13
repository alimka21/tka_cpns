import type { Metadata } from "next";
import { CircleAlert, CircleCheck, Clock, Download, HardDrive, Mail } from "lucide-react";
import { BackupNowButton } from "@/components/admin/backup-now-button";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import { SITE_URL } from "@/lib/site";
import { backupDir, backupKeep, listBackups } from "@/server/services/db-backup";
import { isMailConfigured } from "@/server/services/mailer";

export const metadata: Metadata = { title: "Backup Database" };
export const dynamic = "force-dynamic";

const STALE_HOURS = 36;

function size(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(2)} MB` : `${Math.ceil(bytes / 1024)} KB`;
}

export default async function AdminBackupPage() {
  const files = await listBackups();
  const latest = files[0];
  // eslint-disable-next-line react-hooks/purity -- server component, dirender per request
  const ageHours = latest ? (Date.now() - latest.createdAt.getTime()) / 3_600_000 : null;
  const cronReady = (process.env.CRON_SECRET?.trim().length ?? 0) >= 24;
  const emailTo = process.env.BACKUP_EMAIL_TO?.trim() || null;
  const canEmail = Boolean(emailTo && isMailConfigured());
  const healthy = ageHours != null && ageHours <= STALE_HOURS;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <PageHeader
        title="Backup Database"
        description="Salinan lengkap database (soal, paket, gambar, akun, hasil tes, pembayaran) dalam satu file .sql.gz. Dibuat otomatis oleh cron setiap hari."
      />

      <section className={`surface-card flex flex-col gap-3 p-6 ${healthy ? "border-success/40" : "border-warning/50"}`}>
        <p className="flex flex-wrap items-center gap-2 font-semibold">
          {healthy ? <CircleCheck className="size-5 text-success-strong" aria-hidden /> : <CircleAlert className="size-5 text-warning-strong" aria-hidden />}
          {latest ? `Backup terakhir ${formatDateTime(latest.createdAt.toISOString())}` : "Belum ada backup di server"}
          {ageHours != null && !healthy && <Badge variant="warning">lebih dari {STALE_HOURS} jam lalu — cek cron</Badge>}
        </p>
        <dl className="grid gap-x-4 gap-y-1.5 text-sm text-muted-foreground sm:grid-cols-[auto_1fr]">
          <dt className="flex items-center gap-1.5">
            <Clock className="size-4" aria-hidden /> Cron otomatis
          </dt>
          <dd>
            {cronReady ? (
              <>
                CRON_SECRET terisi. Perintah cron (hPanel → Lanjutan → Cron Jobs):{" "}
                <code className="mt-1 block rounded bg-muted px-2 py-1 text-xs break-all text-foreground">
                  curl -fsS -H &quot;Authorization: Bearer &lt;CRON_SECRET&gt;&quot; {SITE_URL}/api/cron/backup
                </code>
              </>
            ) : (
              <span className="text-warning-strong">CRON_SECRET belum diisi (minimal 24 karakter) — backup otomatis belum aktif.</span>
            )}
          </dd>
          <dt className="flex items-center gap-1.5">
            <HardDrive className="size-4" aria-hidden /> Lokasi
          </dt>
          <dd>
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">{backupDir()}</code> · disimpan {backupKeep()} file terbaru
            (env BACKUP_DIR, BACKUP_KEEP)
          </dd>
          <dt className="flex items-center gap-1.5">
            <Mail className="size-4" aria-hidden /> Salinan email
          </dt>
          <dd>
            {canEmail
              ? `ke ${emailTo} — tambahkan ?email=1 pada cron mingguan`
              : emailTo
                ? "BACKUP_EMAIL_TO terisi, tetapi SMTP belum dikonfigurasi"
                : "nonaktif (isi env BACKUP_EMAIL_TO untuk salinan di luar server)"}
          </dd>
        </dl>
        <BackupNowButton canEmail={canEmail} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">File backup ({files.length})</h2>
        {files.length === 0 ? (
          <p className="surface-card px-6 py-10 text-center text-sm text-muted-foreground">Belum ada file. Klik &ldquo;Buat backup sekarang&rdquo;.</p>
        ) : (
          <ul className="surface-card divide-y">
            {files.map((f, i) => (
              <li key={f.name} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-mono text-sm">{f.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDateTime(f.createdAt.toISOString())} · {size(f.sizeBytes)}
                  </div>
                </div>
                {i === 0 && <Badge variant="success">Terbaru</Badge>}
                <a
                  href={`/api/admin/backup/${encodeURIComponent(f.name)}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold hover:bg-muted"
                  download
                >
                  <Download className="size-4" aria-hidden /> Unduh
                </a>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-muted-foreground">
          File berisi data pribadi pengguna (email, hash kata sandi) — simpan di tempat aman. Token sesi login tidak ikut dibackup. Cara
          memulihkan: Hostinger phpMyAdmin → Import file .sql.gz.
        </p>
      </section>
    </div>
  );
}
