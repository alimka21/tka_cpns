import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import {
  ArrowRight,
  Award,
  BookOpenText,
  CalendarDays,
  ChartPie,
  Check,
  ChevronRight,
  Dumbbell,
  LayoutDashboard,
  ListChecks,
  Minus,
  RotateCcw,
  Timer,
  TriangleAlert,
  X,
} from "lucide-react";
import { ScoreTrend } from "@/components/analytics/score-trend";
import { SubtopicRadar } from "@/components/analytics/subtopic-radar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime, formatRupiah, scoreTone } from "@/lib/format";
import { PremiumLock } from "@/components/billing/premium-lock";
import { UpgradeModal } from "@/components/billing/upgrade-modal";
import { canSeeFullResults } from "@/server/services/access";
import { listPlans } from "@/server/services/billing";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { attempts } from "@/server/db/schema";
import {
  REVIEW_FILTERS,
  ReviewPager,
  type ReviewFilter,
} from "@/components/hasil/review-pager";
import { cn } from "@/lib/utils";
import { getAttemptReview } from "@/server/queries/attempt-review";
import {
  getAttemptResult,
  type AttemptResult,
} from "@/server/queries/attempts";

const TABS = [
  {
    key: "ringkasan",
    label: "Ringkasan",
    short: "Ringkasan",
    icon: LayoutDashboard,
  },
  {
    key: "analisa",
    label: "Analisa Kemampuan",
    short: "Analisa",
    icon: ChartPie,
  },
  {
    key: "pembahasan",
    label: "Soal & Pembahasan",
    short: "Pembahasan",
    icon: ListChecks,
  },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export const metadata: Metadata = { title: "Hasil & Analisis" };
export const dynamic = "force-dynamic";

export default async function HasilPage({
  params,
  searchParams,
}: PageProps<"/hasil/[attemptId]">) {
  const { attemptId: attemptIdParam } = await params;
  const attemptId = Number(attemptIdParam);
  if (!Number.isInteger(attemptId) || attemptId <= 0) notFound();

  const { user } = await requireUser(`/hasil/${attemptId}`);
  const userId = Number(user.id);

  // Attempt yang masih berjalan diarahkan kembali ke halaman ujian, bukan 404,
  // supaya siswa bisa melanjutkan alih-alih bingung.
  const [attemptRow] = await db
    .select({ testPackageId: attempts.testPackageId, status: attempts.status })
    .from(attempts)
    .where(eq(attempts.id, attemptId));
  if (attemptRow?.status === "in_progress")
    redirect(`/tes/${attemptRow.testPackageId}`);

  const r = await getAttemptResult(attemptId, userId);
  if (!r) notFound();
  // Akun gratis: pembahasan & statistik kelemahan dikunci (services/access.ts).
  const full = await canSeeFullResults(
    { id: userId, role: user.role },
    r.jenjang,
    r.packageId,
  );
  const weakCount = r.subtopics.filter((s) => s.percentage < 75).length;
  const cheapest = full
    ? null
    : (await listPlans({ activeOnly: true, jenjang: r.jenjang })).sort(
        (a, b) => a.price - b.price,
      )[0];

  const sp = await searchParams;
  const tab: TabKey = TABS.some((t) => t.key === sp.tab)
    ? (sp.tab as TabKey)
    : "ringkasan";
  const filter: ReviewFilter = REVIEW_FILTERS.some((f) => f.key === sp.filter)
    ? (sp.filter as ReviewFilter)
    : "semua";
  const no = Number(sp.no);
  // Pembahasan (kunci + jawaban) hanya dimuat saat tab-nya dibuka.
  const fullReview =
    tab === "pembahasan" ? await getAttemptReview(attemptId, userId) : null;
  // Pembahasan TIDAK dikirim ke browser untuk akun gratis (kunci jawaban tetap).
  const review =
    fullReview && !full
      ? {
          ...fullReview,
          items: fullReview.items.map((i) => ({ ...i, explanationHtml: null })),
        }
      : fullReview;
  if (tab === "pembahasan" && !review) notFound();
  const tabHref = (t: TabKey) =>
    t === "ringkasan"
      ? `/hasil/${r.attemptId}`
      : `/hasil/${r.attemptId}?tab=${t}`;

  return (
    <div className="flex flex-col gap-8">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-sm text-muted-foreground"
      >
        <Link href="/dashboard" className="hover:text-foreground">
          Dashboard
        </Link>
        <ChevronRight className="size-4" aria-hidden />
        <span className="font-medium text-foreground">Hasil Tes</span>
      </nav>

      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge variant="info">TKA {r.jenjang}</Badge>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-[1.75rem]">
            Hasil: {r.packageTitle}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-4" aria-hidden /> Selesai{" "}
              {formatDateTime(r.finishedAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <Timer className="size-4" aria-hidden /> {r.durationUsedMinutes}{" "}
              dari {r.durationMinutes} menit
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={`/tes/${r.packageId}`} />}
          >
            <RotateCcw aria-hidden /> Kerjakan lagi
          </Button>
        </div>
      </header>

      <nav
        aria-label="Bagian hasil tes"
        className="-mb-2 flex gap-1 overflow-x-auto border-b"
      >
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <Link
              key={t.key}
              href={tabHref(t.key)}
              scroll={false}
              aria-current={active ? "page" : undefined}
              className={cn(
                "-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-2.5 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors sm:gap-2 sm:px-4",
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden />{" "}
              <span className="sm:hidden">{t.short}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </Link>
          );
        })}
      </nav>

      {tab === "ringkasan" && (
        <SummaryTab r={r} tabHref={tabHref} full={full} weakCount={weakCount} />
      )}
      {tab === "analisa" &&
        (full ? (
          <AnalysisTab r={r} />
        ) : (
          <AnalysisLocked count={r.subtopics.length} weakCount={weakCount} />
        ))}
      {tab === "pembahasan" && review && (
        <ReviewPager
          explanationLocked={!full}
          attemptId={r.attemptId}
          items={review.items}
          stimuli={review.stimuli}
          filter={filter}
          number={Number.isInteger(no) ? no : null}
        />
      )}
      {!full && (
        <UpgradeModal
          storageKey={`upsell-hasil-${r.attemptId}`}
          correct={r.correct}
          total={r.correct + r.wrong + r.blank}
          wrong={r.wrong}
          weakCount={weakCount}
          priceText={cheapest ? `mulai ${formatRupiah(cheapest.price)}` : null}
        />
      )}
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
      <span
        className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${tone}`}
      >
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

function SummaryTab({
  r,
  tabHref,
  full,
  weakCount,
}: {
  r: AttemptResult;
  tabHref: (t: TabKey) => string;
  full: boolean;
  weakCount: number;
}) {
  const sorted = [...r.subtopics].sort((a, b) => a.percentage - b.percentage);
  const weakest = sorted[0];
  const strongest = sorted[sorted.length - 1];
  const firstScore = r.trend[0]?.score ?? r.score;
  const delta = r.score - firstScore;
  const tone = scoreTone(r.score);
  return (
    <>
      {/* Skor utama */}
      <section
        aria-label="Ringkasan skor"
        className="surface-card grid gap-6 p-6 sm:p-8 lg:grid-cols-[auto_1fr] lg:items-center lg:gap-12"
      >
        <div className="flex flex-col items-start gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            Skor akhir
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-extrabold tracking-tight text-primary">
              {r.score}
            </span>
            <span className="text-lg text-muted-foreground">/ 100</span>
          </div>
          <Badge variant={tone.variant}>{tone.label}</Badge>
          {delta !== 0 && r.trend.length > 1 && (
            <span className="text-sm text-muted-foreground">
              {delta > 0 ? "+" : ""}
              {delta} poin dibanding percobaan pertama
            </span>
          )}
        </div>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ResultStat
            icon={Check}
            label="Benar"
            value={r.correct}
            tone="text-success bg-success-soft"
          />
          <ResultStat
            icon={X}
            label="Salah"
            value={r.wrong}
            tone="text-destructive bg-destructive-soft"
          />
          <ResultStat
            icon={Minus}
            label="Kosong"
            value={r.blank}
            tone="text-muted-foreground bg-muted"
          />
          <ResultStat
            icon={Timer}
            label="Menit"
            value={r.durationUsedMinutes}
            tone="text-primary bg-primary-soft"
          />
        </dl>
      </section>

      {weakest && !full && (
        <PremiumLock
          title={
            weakCount > 0
              ? `${weakCount} subtopik perlu diperkuat`
              : "Prioritas latihan & kekuatanmu"
          }
          description="Lihat subtopik mana yang paling menahan skormu dan mana yang sudah kuat — lalu latih yang lemah dengan Latihan Kelemahan."
          variant="bars"
          compact
        />
      )}

      {weakest && full && (
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="surface-card border-destructive/30 p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
              <TriangleAlert className="size-4" aria-hidden /> Prioritas latihan
              #1
            </div>
            <h3 className="mt-2 text-xl font-bold">{weakest.subtopic}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Hanya {weakest.correct} dari {weakest.total} soal terjawab benar (
              {weakest.percentage}%). Ini subtopik dengan akurasi terendah di
              tes ini — perbaiki dulu sebelum lanjut ke paket berikutnya.
            </p>
          </div>
          {strongest && strongest !== weakest && (
            <div className="surface-card p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-success">
                <Award className="size-4" aria-hidden /> Kekuatan tertinggi
              </div>
              <h3 className="mt-2 text-xl font-bold">{strongest.subtopic}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {strongest.correct} dari {strongest.total} soal benar (
                {strongest.percentage}%). Pertahankan dengan latihan berkala.
              </p>
            </div>
          )}
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2">
        <Link
          href={tabHref("analisa")}
          scroll={false}
          className="surface-card group flex items-center justify-between gap-4 p-5 transition-shadow hover:shadow-md"
        >
          <span>
            <span className="flex items-center gap-2 font-bold">
              <ChartPie className="size-5 text-primary" aria-hidden /> Analisa
              Kemampuan
            </span>
            <span className="mt-1 block text-sm text-muted-foreground">
              Penguasaan per subtopik & prioritas latihan.
            </span>
          </span>
          <ArrowRight
            className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
        <Link
          href={
            r.wrong > 0
              ? `${tabHref("pembahasan")}&filter=salah`
              : tabHref("pembahasan")
          }
          scroll={false}
          className="surface-card group flex items-center justify-between gap-4 p-5 transition-shadow hover:shadow-md"
        >
          <span>
            <span className="flex items-center gap-2 font-bold">
              <BookOpenText className="size-5 text-primary" aria-hidden /> Soal
              & Pembahasan
            </span>
            <span className="mt-1 block text-sm text-muted-foreground">
              {r.wrong > 0
                ? `Mulai dari ${r.wrong} soal yang salah — paling efektif.`
                : "Lihat kunci & pembahasan tiap soal."}
            </span>
          </span>
          <ArrowRight
            className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      </section>

      {/* Tren */}
      {r.trend.length > 1 && (
        <section className="grid gap-6 lg:grid-cols-[3fr_2fr]">
          <div className="surface-card p-6">
            <h2 className="text-lg font-bold">Tren Skor Paket Ini</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {r.trend.length} percobaan terakhir, skala 0–100.
            </p>
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
                  <li
                    key={`${t.label}-${i}`}
                    className="flex items-center justify-between gap-4 py-3"
                  >
                    <div>
                      <div className="text-sm font-semibold">
                        Percobaan #{arr.length - i}
                        {i === 0 && (
                          <Badge variant="info" className="ml-2">
                            Terbaru
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t.label}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold tabular-nums">
                        {t.score}
                      </div>
                      <div className="text-xs text-muted-foreground tabular-nums">
                        {diff == null
                          ? "Awal"
                          : `${diff >= 0 ? "+" : ""}${diff} poin`}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>
      )}
    </>
  );
}

function AnalysisTab({ r }: { r: AttemptResult }) {
  if (r.subtopics.length === 0) {
    return (
      <section className="surface-card px-6 py-10 text-center text-sm text-muted-foreground">
        Paket ini tidak menghasilkan ringkasan per subtopik (mungkin paket sudah
        diubah sejak percobaan ini).
      </section>
    );
  }
  const sorted = [...r.subtopics].sort((a, b) => a.percentage - b.percentage);
  const weakest = sorted[0];
  const strongest = sorted[sorted.length - 1];
  const weakestIndex = r.subtopics.indexOf(weakest);
  return (
    <>
      {/* Radar + insight */}
      <section className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="surface-card p-6">
          <h2 className="text-lg font-bold">Penguasaan per Subtopik</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Persentase jawaban benar di setiap subtopik yang diujikan. Arahkan
            kursor ke titik untuk detail.
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
              <TriangleAlert className="size-4" aria-hidden /> Prioritas latihan
              #1
            </div>
            <h3 className="mt-2 text-xl font-bold">{weakest.subtopic}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Hanya {weakest.correct} dari {weakest.total} soal terjawab benar (
              {weakest.percentage}%). Ini subtopik dengan akurasi terendah di
              tes ini — perbaiki dulu sebelum lanjut ke paket berikutnya.
            </p>
          </div>
          {strongest && strongest !== weakest && (
            <div className="surface-card p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-success">
                <Award className="size-4" aria-hidden /> Kekuatan tertinggi
              </div>
              <h3 className="mt-2 text-xl font-bold">{strongest.subtopic}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {strongest.correct} dari {strongest.total} soal benar (
                {strongest.percentage}%). Pertahankan dengan latihan berkala.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Rincian per subtopik — juga berfungsi sebagai "table view" radar chart */}
      <section aria-labelledby="rincian-heading" className="surface-card p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="rincian-heading" className="text-lg font-bold">
              Rincian per Subtopik
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Diurutkan dari yang paling perlu diperkuat.
            </p>
          </div>
          <ul className="flex flex-wrap gap-2 text-xs">
            <li>
              <Badge variant="success">≥75% Baik</Badge>
            </li>
            <li>
              <Badge variant="warning">50–74% Cukup</Badge>
            </li>
            <li>
              <Badge variant="danger">&lt;50% Perlu latihan</Badge>
            </li>
          </ul>
        </div>
        <ul className="mt-6 flex flex-col divide-y">
          {sorted.map((s) => {
            const t = scoreTone(s.percentage);
            return (
              <li
                key={s.subtopic}
                className="grid gap-2 py-4 sm:grid-cols-[minmax(0,14rem)_1fr_auto] sm:items-center sm:gap-6"
              >
                <div>
                  <div className="font-semibold">{s.subtopic}</div>
                  <div className="text-xs text-muted-foreground">{s.topic}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 flex-1 rounded-full bg-muted" aria-hidden>
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${s.percentage}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-sm font-bold tabular-nums">
                    {s.percentage}%
                  </span>
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

      <section className="surface-card flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Latih subtopik terlemah (
          <strong className="text-foreground">{weakest.subtopic}</strong>)
          dengan soal-soal terfokus.
        </p>
        <Button
          variant="cta"
          nativeButton={false}
          render={<Link href="/latihan" />}
        >
          <Dumbbell aria-hidden /> Latihan kelemahan
        </Button>
      </section>
    </>
  );
}

/** Tab Analisa untuk akun gratis: contoh tampilan diburamkan + ajakan Premium (data asli tidak dikirim). */
function AnalysisLocked({
  count,
  weakCount,
}: {
  count: number;
  weakCount: number;
}) {
  return (
    <PremiumLock
      variant="chart"
      title="Statistik kelemahan khusus Premium"
      description={
        count > 0
          ? `Kami sudah menganalisis jawabanmu di ${count} subtopik${weakCount > 0 ? ` dan menemukan ${weakCount} yang perlu diperkuat` : ""}. Buka Premium untuk melihat rinciannya.`
          : "Buka Premium untuk melihat penguasaanmu per subtopik."
      }
      benefits={[
        "Grafik penguasaan per subtopik",
        "Prioritas latihan: subtopik paling lemah lebih dulu",
        "Latihan kelemahan otomatis per subtopik",
      ]}
    />
  );
}
