import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, ChevronRight, Layers, TrendingUp, TriangleAlert } from "lucide-react";
import { StatCard } from "@/components/layout/stat-card";
import { PackageGrid } from "@/components/student/package-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime, scoreTone } from "@/lib/format";
import { requireUser } from "@/server/auth/session";
import { listStudentHistory } from "@/server/queries/attempts";
import { listPackagesForStudent } from "@/server/queries/packages";
import { hasPremium } from "@/server/services/billing";
import { getStudentProgress, type PrioritySubdomain } from "@/server/queries/progress";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { user } = await requireUser("/dashboard");
  const userId = Number(user.id);
  const firstName = user.name.split(" ")[0];

  const jenjang = user.role === "admin" ? null : (user.jenjang ?? null);
  const premium = await hasPremium({ id: userId, role: user.role }, jenjang);
  const [packages, history, progress] = await Promise.all([
    listPackagesForStudent(userId, jenjang, premium),
    listStudentHistory(userId, 10),
    getStudentProgress(userId),
  ]);
  const weakest = progress.priorities[0];
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
          <StatCard label="Tes selesai" value={String(progress.testCount)} unit="sesi" icon={BookOpenCheck} tone="success" />
          <StatCard
            label="Rata-rata skor"
            value={average == null ? "—" : String(average)}
            unit="/ 100"
            icon={TrendingUp}
            tone="cta"
            hint={history.length > 0 ? `${history.length} tes terakhir` : undefined}
          />
        </div>
      </section>

      {weakest && <WeakestCard weakest={weakest} />}

      <section aria-labelledby="paket-heading" className="flex flex-col gap-5">
        <div>
          <h2 id="paket-heading" className="text-xl font-bold">
            Paket Latihan TKA{user.role !== "admin" && user.jenjang ? ` ${user.jenjang}` : ""}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {user.role === "admin" ? "Semua jenjang (tampilan admin). " : "Sesuai jenjangmu — ganti di Pengaturan bila keliru. "}
            Paket gratis bisa langsung dikerjakan; paket premium terbuka dengan langganan Premium.
          </p>
        </div>
        <PackageGrid packages={packages} />
      </section>

      <section aria-labelledby="riwayat-heading" className="flex flex-col gap-5">
        <div className="flex items-end justify-between gap-4">
          <h2 id="riwayat-heading" className="text-xl font-bold">
            Riwayat Pengerjaan
          </h2>
          {history.length > 0 && (
            <Link href="/riwayat" className="text-sm font-semibold text-primary hover:underline">
              Lihat semua
            </Link>
          )}
        </div>
        {history.length === 0 ? (
          <p className="surface-card px-6 py-10 text-center text-sm text-muted-foreground">
            Belum ada percobaan yang selesai. Kerjakan paket tes pertamamu di atas.
          </p>
        ) : (
          <ul className="surface-card divide-y">
            {history.slice(0, 5).map((item) => {
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
                        {item.status === "expired" && " · waktu habis"}
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

function WeakestCard({ weakest: w }: { weakest: PrioritySubdomain }) {
  return (
    <section
      aria-labelledby="terlemah-heading"
      className="relative overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground shadow-md sm:p-8"
    >
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
            <TriangleAlert className="size-3.5 text-cta" aria-hidden />
            Prioritas latihan · akurasi {w.diagnosis.accuracy}%
          </span>
          <h2 id="terlemah-heading" className="mt-3 text-2xl font-bold tracking-tight">
            {w.name}
          </h2>
          <p className="mt-2 text-sm text-white/80">
            {w.subject} → {w.domain}. Ini subdomain dengan akurasi terendah dari {w.diagnosis.windowQuestions} soal
            terbarumu di sana. Latih khusus subdomain ini dengan pembahasan langsung.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
          <Button size="lg" variant="cta" nativeButton={false} render={<Link href={`/latihan?sub=${w.subtopicId}`} />}>
            Latihan subdomain ini <ArrowRight aria-hidden />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-white/30 bg-transparent text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
            nativeButton={false}
            render={<Link href="/progres" />}
          >
            Lihat progres lengkap
          </Button>
        </div>
      </div>
      {/* Dekorasi halus */}
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-white/5" />
    </section>
  );
}
