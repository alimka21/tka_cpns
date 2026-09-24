import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Award,
  CalendarDays,
  Check,
  ChevronRight,
  Crosshair,
  Minus,
  RotateCcw,
  Timer,
  TriangleAlert,
  X,
} from "lucide-react";
import { ScoreTrend } from "@/components/analytics/score-trend";
import { SubtopicRadar } from "@/components/analytics/subtopic-radar";
import { DemoDataNotice } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { demoResult } from "@/lib/demo-data";
import { formatDateTime, scoreTone } from "@/lib/format";

export const metadata: Metadata = { title: "Hasil & Analisis" };

// TODO: baca attempts + attempt_subtopic_scores milik siswa yang login.
// Sementara hanya /hasil/demo yang tersedia (data contoh).
export default async function HasilPage({ params }: PageProps<"/hasil/[attemptId]">) {
  const { attemptId } = await params;
  if (attemptId !== demoResult.attemptId) notFound();

  const r = demoResult;
  const tone = scoreTone(r.score);
  const sorted = [...r.subtopics].sort((a, b) => a.percentage - b.percentage);
  const weakest = sorted[0];
  const strongest = sorted[sorted.length - 1];
  const weakestIndex = r.subtopics.indexOf(weakest);
  const firstScore = r.trend[0].score;
  const delta = r.score - firstScore;

  return (
    <div className="flex flex-col gap-8">
      <DemoDataNotice />

      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground">
          Dashboard
        </Link>
        <ChevronRight className="size-4" aria-hidden />
        <span className="font-medium text-foreground">Hasil Tes</span>
      </nav>

      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge variant="info">
            TKA {r.jenjang} · {r.packageTitle.split("—")[1]?.trim() ?? r.packageTitle}
          </Badge>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-[1.75rem]">Hasil: {r.packageTitle}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-4" aria-hidden /> Selesai {formatDateTime(r.finishedAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <Timer className="size-4" aria-hidden /> {r.durationUsedMinutes} dari {r.durationMinutes} menit
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" nativeButton={false} render={<Link href="/tes/demo" />}>
            <RotateCcw aria-hidden /> Kerjakan lagi
          </Button>
          <Button disabled title="Tersedia setelah pembahasan tersambung database">
            Lihat pembahasan
          </Button>
        </div>
      </header>

      {/* Skor utama */}
      <section aria-label="Ringkasan skor" className="surface-card grid gap-6 p-6 sm:p-8 lg:grid-cols-[auto_1fr] lg:items-center lg:gap-12">
        <div className="flex flex-col items-start gap-2">
          <span className="text-sm font-medium text-muted-foreground">Skor akhir</span>
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-extrabold tracking-tight text-primary">{r.score}</span>
            <span className="text-lg text-muted-foreground">/ 100</span>
          </div>
          <Badge variant={tone.variant}>{tone.label}</Badge>
          {delta !== 0 && (
            <span className="text-sm text-muted-foreground">
              {delta > 0 ? "+" : ""}
              {delta} poin dibanding percobaan pertama
            </span>
          )}
        </div>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ResultStat icon={Check} label="Benar" value={r.correct} tone="text-success bg-success-soft" />
          <ResultStat icon={X} label="Salah" value={r.wrong} tone="text-destructive bg-destructive-soft" />
          <ResultStat icon={Minus} label="Kosong" value={r.blank} tone="text-muted-foreground bg-muted" />
          <ResultStat icon={Timer} label="Menit" value={r.durationUsedMinutes} tone="text-primary bg-primary-soft" />
        </dl>
      </section>

      {/* Radar + insight */}
      <section className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="surface-card p-6">
          <h2 className="text-lg font-bold">Penguasaan per Subtopik</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Persentase jawaban benar di setiap subtopik yang diujikan. Arahkan kursor ke titik untuk detail.
          </p>
          <div className="mt-6">
            <SubtopicRadar
              weakestIndex={weakestIndex}
              data={r.subtopics.map((s) => ({
                label: s.short,
                fullLabel: s.subtopic,
                percentage: s.percentage,
                correct: s.correct,
                total: s.total,
              }))}
            />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="surface-card border-destructive/30 p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
              <TriangleAlert className="size-4" aria-hidden /> Prioritas latihan #1
            </div>
            <h3 className="mt-2 text-xl font-bold">{weakest.subtopic}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Hanya {weakest.correct} dari {weakest.total} soal terjawab benar ({weakest.percentage}%). Ini subtopik
              dengan akurasi terendah di tes ini — perbaiki dulu sebelum lanjut ke paket berikutnya.
            </p>
            <Button variant="cta" className="mt-4 w-full" nativeButton={false} render={<Link href="/tes/demo" />}>
              <Crosshair aria-hidden /> Latihan fokus {weakest.short}
            </Button>
          </div>
          <div className="surface-card p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-success">
              <Award className="size-4" aria-hidden /> Kekuatan tertinggi
            </div>
            <h3 className="mt-2 text-xl font-bold">{strongest.subtopic}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {strongest.correct} dari {strongest.total} soal benar ({strongest.percentage}%). Pertahankan dengan
              latihan berkala.
            </p>
          </div>
        </div>
      </section>

      {/* Rincian per subtopik — juga berfungsi sebagai "table view" radar chart */}
      <section aria-labelledby="rincian-heading" className="surface-card p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="rincian-heading" className="text-lg font-bold">
              Rincian per Subtopik
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Diurutkan dari yang paling perlu diperkuat.</p>
          </div>
          <ul className="flex flex-wrap gap-2 text-xs">
            <li><Badge variant="success">≥75% Baik</Badge></li>
            <li><Badge variant="warning">50–74% Cukup</Badge></li>
            <li><Badge variant="danger">&lt;50% Perlu latihan</Badge></li>
          </ul>
        </div>
        <ul className="mt-6 flex flex-col divide-y">
          {sorted.map((s) => {
            const t = scoreTone(s.percentage);
            return (
              <li key={s.subtopic} className="grid gap-2 py-4 sm:grid-cols-[minmax(0,14rem)_1fr_auto] sm:items-center sm:gap-6">
                <div>
                  <div className="font-semibold">{s.subtopic}</div>
                  <div className="text-xs text-muted-foreground">{s.topic}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 flex-1 rounded-full bg-muted" aria-hidden>
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${s.percentage}%` }} />
                  </div>
                  <span className="w-12 text-right text-sm font-bold tabular-nums">{s.percentage}%</span>
                </div>
                <div className="flex items-center gap-3 sm:justify-end">
                  <span className="text-sm text-muted-foreground tabular-nums">
                    {s.correct}/{s.total} benar
                  </span>
                  <Badge variant={t.variant}>{t.label}</Badge>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Tren */}
      <section className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="surface-card p-6">
          <h2 className="text-lg font-bold">Tren Skor Paket Ini</h2>
          <p className="mt-1 text-sm text-muted-foreground">{r.trend.length} percobaan terakhir, skala 0–100.</p>
          <div className="mt-6">
            <ScoreTrend points={r.trend} />
          </div>
        </div>
        <div className="surface-card p-6">
          <h2 className="text-lg font-bold">Riwayat Percobaan</h2>
          <ol className="mt-4 flex flex-col divide-y">
            {[...r.trend].reverse().map((t, i, arr) => {
              const prev = arr[i + 1];
              const diff = prev ? t.score - prev.score : null;
              return (
                <li key={t.label} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <div className="text-sm font-semibold">
                      Percobaan #{arr.length - i}
                      {i === 0 && (
                        <Badge variant="info" className="ml-2">
                          Terbaru
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{t.label}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold tabular-nums">{t.score}</div>
                    <div className="text-xs text-muted-foreground tabular-nums">
                      {diff == null ? "Awal" : `${diff >= 0 ? "+" : ""}${diff} poin`}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>
    </div>
  );
}

function ResultStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Check;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border p-4">
      <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${tone}`}>
        <Icon className="size-[18px]" aria-hidden />
      </span>
      {/* dt harus sebelum dd; urutan visual dibalik dengan flex-col-reverse. */}
      <div className="flex flex-col-reverse">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="text-xl font-bold">{value}</dd>
      </div>
    </div>
  );
}
