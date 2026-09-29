import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileUp, Library, Package, Timer, Users } from "lucide-react";
import { ActivityBars } from "@/components/analytics/activity-bars";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime, scoreTone } from "@/lib/format";
import { getAdminStats, getAttemptsPerDay, getRecentAttempts } from "@/server/queries/admin-dashboard";

export const metadata: Metadata = { title: "Dashboard Admin" };
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [s, attemptsPerDay, recent] = await Promise.all([getAdminStats(), getAttemptsPerDay(7), getRecentAttempts(8)]);
  const weekTotal = attemptsPerDay.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Dashboard"
        description="Ringkasan pengguna, bank soal, dan aktivitas tes."
        actions={
          <>
            <Button variant="outline" nativeButton={false} render={<Link href="/admin/soal/import" />}>
              <FileUp aria-hidden /> Import Soal
            </Button>
            <Button nativeButton={false} render={<Link href="/admin/paket-tes" />}>
              <Package aria-hidden /> Buat Paket Tes
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total user" value={s.users.toLocaleString("id-ID")} icon={Users} hint={`${s.premiumUsers} dengan akses premium`} />
        <StatCard
          label="Soal di bank"
          value={s.questions.toLocaleString("id-ID")}
          unit="butir"
          icon={Library}
          tone="success"
          hint={`${s.pendingReview} menunggu review`}
        />
        <StatCard label="Paket tes terbit" value={String(s.publishedPackages)} unit="paket" icon={Package} tone="cta" />
        <StatCard label="Percobaan hari ini" value={String(s.attemptsToday)} unit="sesi" icon={Timer} tone="muted" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <section className="surface-card p-6">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold">Aktivitas Tes 7 Hari Terakhir</h2>
              <p className="mt-1 text-sm text-muted-foreground">Jumlah percobaan tes yang selesai per hari.</p>
            </div>
            <span className="text-sm text-muted-foreground">
              Total <span className="font-bold text-foreground">{weekTotal}</span> sesi
            </span>
          </div>
          <div className="mt-6">
            <ActivityBars data={attemptsPerDay} />
          </div>
        </section>

        <section className="surface-card flex flex-col gap-4 p-6">
          <h2 className="text-lg font-bold">Perlu Tindakan</h2>
          <Link
            href="/admin/soal?status=pending_review"
            className="flex items-center gap-4 rounded-xl border border-warning/40 bg-warning-soft p-4 transition-colors hover:border-warning"
          >
            <span className="text-3xl font-bold text-warning-strong">{s.pendingReview}</span>
            <span className="flex-1 text-sm">
              <span className="block font-semibold">Soal menunggu review</span>
              <span className="text-muted-foreground">Hasil import & AI belum tayang</span>
            </span>
            <ArrowRight className="size-4 text-warning-strong" aria-hidden />
          </Link>
          <Link
            href="/admin/users"
            className="flex items-center gap-4 rounded-xl border p-4 transition-colors hover:border-primary/40"
          >
            <span className="text-3xl font-bold text-primary">{s.premiumUsers}</span>
            <span className="flex-1 text-sm">
              <span className="block font-semibold">User dengan akses premium</span>
              <span className="text-muted-foreground">Diatur manual per paket</span>
            </span>
            <ArrowRight className="size-4 text-primary" aria-hidden />
          </Link>
        </section>
      </div>

      <section className="surface-card overflow-hidden">
        <div className="p-6 pb-4">
          <h2 className="text-lg font-bold">Percobaan Tes Terbaru</h2>
          <p className="mt-1 text-sm text-muted-foreground">8 percobaan yang paling baru dikumpulkan siswa.</p>
        </div>
        {recent.length === 0 ? (
          <p className="border-t px-6 py-10 text-center text-sm text-muted-foreground">Belum ada percobaan tes yang selesai.</p>
        ) : (
          <>
            {/* Desktop: tabel. Mobile: kartu per baris (docs/UI_UX.md §5). */}
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead className="border-y bg-muted/50 text-left text-xs font-semibold text-muted-foreground uppercase">
                  <tr>
                    <th className="px-6 py-3">User</th>
                    <th className="px-6 py-3">Paket</th>
                    <th className="px-6 py-3">Skor</th>
                    <th className="px-6 py-3 text-right">Waktu</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recent.map((a) => {
                    const tone = scoreTone(a.score);
                    return (
                      <tr key={a.id} className="hover:bg-muted/40">
                        <td className="px-6 py-4 font-semibold">{a.userName}</td>
                        <td className="px-6 py-4">
                          <div>{a.packageTitle}</div>
                          <div className="text-xs text-muted-foreground">{a.jenjang}</div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={tone.variant}>Skor {a.score}</Badge>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap text-muted-foreground">{formatDateTime(a.submittedAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <ul className="divide-y border-t md:hidden">
              {recent.map((a) => {
                const tone = scoreTone(a.score);
                return (
                  <li key={a.id} className="flex flex-col gap-1.5 px-6 py-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{a.userName}</span>
                      <span className="text-xs text-muted-foreground">{formatDateTime(a.submittedAt)}</span>
                    </div>
                    <div className="text-sm">
                      {a.packageTitle} · {a.jenjang}
                    </div>
                    <Badge variant={tone.variant}>Skor {a.score}</Badge>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
