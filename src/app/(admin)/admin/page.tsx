import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileUp, Library, Package, Timer, Users } from "lucide-react";
import { ActivityBars } from "@/components/analytics/activity-bars";
import { DemoDataNotice, PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { demoActivity, demoAdminStats, demoAttemptsPerDay } from "@/lib/demo-data";

export const metadata: Metadata = { title: "Dashboard Admin" };

// TODO: ganti dengan agregasi dari tabel users, questions, test_packages, attempts.
export default function AdminDashboardPage() {
  const s = demoAdminStats;
  const weekTotal = demoAttemptsPerDay.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="flex flex-col gap-8">
      <DemoDataNotice />
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
            <ActivityBars data={demoAttemptsPerDay} />
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
              <span className="block font-semibold">Akses premium aktif</span>
              <span className="text-muted-foreground">Diatur manual per user</span>
            </span>
            <ArrowRight className="size-4 text-primary" aria-hidden />
          </Link>
        </section>
      </div>

      <section className="surface-card overflow-hidden">
        <div className="p-6 pb-4">
          <h2 className="text-lg font-bold">Aktivitas Terbaru</h2>
          <p className="mt-1 text-sm text-muted-foreground">Pengerjaan tes dan perubahan oleh admin.</p>
        </div>
        {/* Desktop: tabel. Mobile: kartu per baris (docs/UI_UX.md §5). */}
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead className="border-y bg-muted/50 text-left text-xs font-semibold text-muted-foreground uppercase">
              <tr>
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Aktivitas</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Waktu</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {demoActivity.map((a, i) => (
                <tr key={i} className="hover:bg-muted/40">
                  <td className="px-6 py-4 font-semibold">{a.who}</td>
                  <td className="px-6 py-4">
                    <div>{a.action}</div>
                    <div className="text-xs text-muted-foreground">{a.context}</div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={a.status.tone}>{a.status.label}</Badge>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap text-muted-foreground">{a.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="divide-y border-t md:hidden">
          {demoActivity.map((a, i) => (
            <li key={i} className="flex flex-col gap-1.5 px-6 py-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{a.who}</span>
                <span className="text-xs text-muted-foreground">{a.time}</span>
              </div>
              <div className="text-sm">{a.action}</div>
              <Badge variant={a.status.tone}>{a.status.label}</Badge>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
