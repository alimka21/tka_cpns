import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, ChevronRight, Layers, TrendingUp, TriangleAlert } from "lucide-react";
import { StatCard } from "@/components/layout/stat-card";
import { PackageGrid } from "@/components/student/package-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime, scoreTone } from "@/lib/format";
import { requireUser } from "@/server/auth/session";
import { getWeakestSubtopicForStudent, listStudentHistory } from "@/server/queries/attempts";
import { listPackagesForStudent } from "@/server/queries/packages";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { user } = await requireUser("/dashboard");
  const userId = Number(user.id);
  const firstName = user.name.split(" ")[0];

  const [packages, history, weakest] = await Promise.all([
    listPackagesForStudent(userId),
    listStudentHistory(userId, 10),
    getWeakestSubtopicForStudent(userId),
  ]);
  const average = history.length > 0 ? Math.round(history.reduce((sum, h) => sum + h.score, 0) / history.length) : null;

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-[1.75rem]">Halo, {firstName}! 👋</h1>
          <p className="mt-1 text-muted-foreground">
            Lanjutkan latihanmu. Fokus ke subtopik terlemah dulu supaya skormu naik paling cepat.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Paket tersedia" value={String(packages.length)} icon={Layers} hint="Paket tes yang sudah diterbitkan" />
          <StatCard label="Tes selesai" value={String(history.length)} unit="sesi" icon={BookOpenCheck} tone="success" />
          <StatCard label="Rata-rata skor" value={average == null ? "—" : String(average)} unit="/ 100" icon={TrendingUp} tone="cta" />
        </div>
      </section>

      {weakest && <WeakestCard weakest={weakest} />}

      <section aria-labelledby="paket-heading" className="flex flex-col gap-5">
        <div>
          <h2 id="paket-heading" className="text-xl font-bold">
            Paket Latihan TKA
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Paket gratis bisa langsung dikerjakan. Paket premium dibuka manual oleh admin.
          </p>
        </div>
        <PackageGrid packages={packages} />
      </section>

      <section aria-labelledby="riwayat-heading" className="flex flex-col gap-5">
        <h2 id="riwayat-heading" className="text-xl font-bold">
          Riwayat Pengerjaan
        </h2>
        {history.length === 0 ? (
          <p className="surface-card px-6 py-10 text-center text-sm text-muted-foreground">
            Belum ada percobaan yang selesai. Kerjakan paket tes pertamamu di atas.
          </p>
        ) : (
          <ul className="surface-card divide-y">
            {history.map((item) => {
              const tone = scoreTone(item.score);
              return (
                <li key={item.attemptId}>
                  <Link
                    href={`/hasil/${item.attemptId}`}
                    className="flex flex-col gap-3 p-5 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:gap-6"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-muted-foreground">
                        {item.jenjang} · {formatDateTime(item.finishedAt)}
                      </div>
                      <div className="mt-0.5 font-semibold">{item.packageTitle}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {item.correct} benar dari {item.total} soal
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold">{item.score}</div>
                        <Badge variant={tone.variant}>{tone.label}</Badge>
                      </div>
                      <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function WeakestCard({
  weakest,
}: {
  weakest: { subtopic: string; topic: string; subject: string; percentage: number; correct: number; total: number };
}) {
  const w = weakest;
  return (
    <section
      aria-labelledby="terlemah-heading"
      className="relative overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground shadow-md sm:p-8"
    >
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
            <TriangleAlert className="size-3.5 text-cta" aria-hidden />
            Subtopik terlemah · akurasi {w.percentage}%
          </span>
          <h2 id="terlemah-heading" className="mt-3 text-2xl font-bold tracking-tight">
            {w.subtopic}
          </h2>
          <p className="mt-2 text-sm text-white/80">
            {w.subject} → {w.topic}. Kamu menjawab benar {w.correct} dari {w.total} soal di subtopik ini pada
            keseluruhan percobaanmu. Cari paket yang membahas subtopik ini untuk menutup celahnya.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
          <Button size="lg" variant="cta" nativeButton={false} render={<Link href="#paket-heading" />}>
            Lihat paket latihan <ArrowRight aria-hidden />
          </Button>
        </div>
      </div>
      {/* Dekorasi halus */}
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-white/5" />
    </section>
  );
}
