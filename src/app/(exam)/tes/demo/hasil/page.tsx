import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Award,
  BookOpenText,
  Check,
  ChartNoAxesColumn,
  Lightbulb,
  ListChecks,
  Minus,
  RotateCcw,
  Sparkles,
  Target,
  TrendingUp,
  TriangleAlert,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { SubtopicRadar } from "@/components/analytics/subtopic-radar";
import { ReviewCard } from "@/components/hasil/review-card";
import { RichHtml } from "@/components/tes/rich-html";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { scoreTone } from "@/lib/format";
import { getSession } from "@/server/auth/session";
import { scoreDemo, type DemoResult } from "@/server/demo/demo-test";
import { DEMO_ANSWERS_COOKIE, parseDemoAnswers } from "../demo-answers";

export const metadata: Metadata = { title: "Hasil Demo TKA" };
export const dynamic = "force-dynamic";

function headline(score: number) {
  if (score >= 75) return { title: "Hebat! Dasarmu sudah kuat.", body: "Tinggal poles beberapa bagian supaya skormu makin stabil di atas 80." };
  if (score >= 50) return { title: "Lumayan! Skormu bisa naik cepat.", body: "Ada beberapa subdomain yang tinggal sedikit lagi. Fokus ke sana dulu." };
  return { title: "Tenang — justru di sini kamu paling banyak bisa naik.", body: "Kami sudah menemukan bagian mana yang perlu kamu latih lebih dulu." };
}

export default async function DemoHasilPage() {
  const answers = parseDemoAnswers((await cookies()).get(DEMO_ANSWERS_COOKIE)?.value);
  if (!answers) redirect("/tes/demo");

  const [r, session] = [scoreDemo(answers), await getSession()];
  const tone = scoreTone(r.score);
  const head = headline(r.score);
  // Urut terlemah → terkuat; seri → urutan kerangka.
  const ranked = [...r.subdomains].sort((a, b) => a.percentage - b.percentage || a.id - b.id);
  const weakest = ranked[0];
  const strongest = [...ranked].reverse().find((s) => s.percentage >= 50 && s !== weakest) ?? null;
  const plan = ranked.filter((s) => s.percentage < 100).slice(0, 3);
  const primaryCta = session ? { href: "/dashboard", label: "Ke Dashboard" } : { href: "/daftar", label: "Daftar gratis" };

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 border-b bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo href="/" />
          <Button nativeButton={false} render={<Link href={primaryCta.href} />}>
            {primaryCta.label}
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">
        {/* Skor */}
        <section aria-label="Skor demo" className="surface-card grid gap-6 p-6 sm:p-8 lg:grid-cols-[auto_1fr] lg:items-center lg:gap-12">
          <div className="flex flex-col items-start gap-2">
            <Badge variant="info">Hasil Demo · TKA SMP</Badge>
            <span className="mt-2 text-sm font-medium text-muted-foreground">Skor kamu</span>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-extrabold tracking-tight text-primary">{r.score}</span>
              <span className="text-lg text-muted-foreground">/ 100</span>
            </div>
            <Badge variant={tone.variant}>{tone.label}</Badge>
          </div>
          <div className="flex flex-col gap-5">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{head.title}</h1>
              <p className="mt-1 text-muted-foreground">{head.body}</p>
            </div>
            <dl className="grid grid-cols-3 gap-3">
              <Stat icon={Check} label="Benar" value={r.correct} tone="text-success bg-success-soft" />
              <Stat icon={X} label="Salah" value={r.wrong} tone="text-destructive bg-destructive-soft" />
              <Stat icon={Minus} label="Kosong" value={r.blank} tone="text-muted-foreground bg-muted" />
            </dl>
            <ul className="grid gap-3 sm:grid-cols-2">
              {r.subjects.map((s) => (
                <li key={s.name} className="rounded-xl border p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">{s.name}</span>
                    <span className="font-bold tabular-nums">{s.percentage}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-muted" aria-hidden>
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${s.percentage}%` }} />
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {s.correct} dari {s.total} soal benar
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Diagnosa */}
        <section className="grid gap-6 lg:grid-cols-[3fr_2fr]">
          <div className="surface-card p-6">
            <h2 className="text-lg font-bold">Peta kemampuanmu per subdomain</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Setiap soal TKA menguji subdomain tertentu di kerangka asesmen resmi. Ini penguasaanmu di 5 subdomain demo.
            </p>
            <div className="mt-6">
              <SubtopicRadar
                weakestIndex={r.subdomains.indexOf(weakest)}
                data={r.subdomains.map((s) => ({
                  label: s.name.length > 18 ? `${s.name.slice(0, 17).trimEnd()}…` : s.name,
                  fullLabel: s.name,
                  percentage: s.percentage,
                  correct: s.correct,
                  total: s.total,
                }))}
              />
            </div>
          </div>
          <div className="flex flex-col gap-6">
            {weakest.percentage < 100 ? (
              <div className="surface-card border-destructive/30 p-6">
                <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
                  <TriangleAlert className="size-4" aria-hidden /> Prioritas latihan #1
                </div>
                <h3 className="mt-2 text-xl font-bold">{weakest.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{weakest.subject}</p>
                <p className="mt-3 text-sm text-muted-foreground">
                  {weakest.correct} dari {weakest.total} soal benar ({weakest.percentage}%). {weakest.tip}
                </p>
              </div>
            ) : (
              <div className="surface-card border-success/40 p-6">
                <div className="flex items-center gap-2 text-sm font-semibold text-success">
                  <Award className="size-4" aria-hidden /> Sempurna!
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Semua subdomain demo terjawab benar. Uji dirimu dengan paket tes lengkap yang lebih menantang.
                </p>
              </div>
            )}
            {strongest && (
              <div className="surface-card p-6">
                <div className="flex items-center gap-2 text-sm font-semibold text-success">
                  <Award className="size-4" aria-hidden /> Kekuatanmu
                </div>
                <h3 className="mt-2 text-xl font-bold">{strongest.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {strongest.correct} dari {strongest.total} soal benar ({strongest.percentage}%). Pertahankan dengan latihan
                  berkala.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Rincian = table view radar */}
        <section aria-labelledby="rincian-heading" className="surface-card p-6">
          <h2 id="rincian-heading" className="text-lg font-bold">
            Rincian per subdomain
          </h2>
          <ul className="mt-4 flex flex-col divide-y">
            {ranked.map((s) => {
              const t = scoreTone(s.percentage);
              return (
                <li key={s.id} className="grid gap-2 py-4 sm:grid-cols-[minmax(0,16rem)_1fr_auto] sm:items-center sm:gap-6">
                  <div>
                    <div className="font-semibold">{s.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {s.subject} · {s.code}
                    </div>
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

        {/* Rencana belajar */}
        {plan.length > 0 && (
          <section aria-labelledby="rencana-heading" className="surface-card p-6">
            <h2 id="rencana-heading" className="flex items-center gap-2 text-lg font-bold">
              <Lightbulb className="size-5 text-cta" aria-hidden /> Rencana belajar untukmu
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Disusun dari jawabanmu barusan, mulai dari yang paling berdampak.</p>
            <ol className="mt-4 flex flex-col gap-3">
              {plan.map((s, i) => (
                <li key={s.id} className="flex gap-4 rounded-xl border p-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <div>
                    <div className="font-semibold">
                      {s.name} <span className="font-normal text-muted-foreground">· sekarang {s.percentage}%</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{s.tip}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        <SignupCta result={r} primaryCta={primaryCta} loggedIn={!!session} />

        {/* Pembahasan */}
        <section aria-labelledby="pembahasan-heading" className="flex flex-col gap-4">
          <div>
            <h2 id="pembahasan-heading" className="text-xl font-bold">
              Pembahasan setiap soal
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Bandingkan jawabanmu dengan kunci, lalu pelajari caranya.</p>
          </div>
          <ol className="flex flex-col gap-6">
            {r.items.map((item, idx) => {
              const firstOfGroup = item.stimulusId != null && r.items[idx - 1]?.stimulusId !== item.stimulusId;
              return (
                <li key={item.questionId} className="flex flex-col gap-3">
                  {firstOfGroup && (
                    <details className="surface-card group p-5" open>
                      <summary className="flex cursor-pointer items-center gap-2 font-semibold">
                        <BookOpenText className="size-4 text-primary" aria-hidden /> Bacaan: {r.stimulus.title}
                      </summary>
                      <div className="mt-3 leading-relaxed">
                        <RichHtml html={r.stimulus.html} />
                      </div>
                    </details>
                  )}
                  <ReviewCard item={item} />
                </li>
              );
            })}
          </ol>
        </section>

        <div className="flex flex-col items-center gap-3 pb-8 text-center">
          <p className="text-sm text-muted-foreground">Siap mengerjakan paket tes lengkap?</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button size="lg" variant="cta" nativeButton={false} render={<Link href={primaryCta.href} />}>
              {primaryCta.label} <ArrowRight aria-hidden />
            </Button>
            <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/tes/demo" />}>
              <RotateCcw aria-hidden /> Ulangi demo
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

function SignupCta({
  result,
  primaryCta,
  loggedIn,
}: {
  result: DemoResult;
  primaryCta: { href: string; label: string };
  loggedIn: boolean;
}) {
  const benefits = [
    { icon: ListChecks, text: "Paket tes TKA lengkap untuk SD, SMP, dan SMA sesuai kerangka asesmen resmi" },
    { icon: ChartNoAxesColumn, text: "Analisis per subdomain dari semua tes, bukan cuma skor akhir" },
    { icon: TrendingUp, text: "Peta progres kemampuan — lihat subdomain yang naik dari waktu ke waktu" },
    { icon: Target, text: "Prioritas latihan otomatis dari kelemahanmu sendiri" },
  ];
  return (
    <section
      aria-labelledby="cta-heading"
      className="relative overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground shadow-md sm:p-8"
    >
      <div className="relative grid gap-6 lg:grid-cols-[3fr_2fr] lg:items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
            <Sparkles className="size-3.5 text-cta" aria-hidden /> Ini baru {result.total} soal
          </span>
          <h2 id="cta-heading" className="mt-3 text-2xl font-bold tracking-tight">
            {loggedIn ? "Lanjutkan dengan paket tes sungguhan" : "Dapatkan diagnosa lengkap — gratis"}
          </h2>
          <ul className="mt-4 flex flex-col gap-2 text-sm text-white/85">
            {benefits.map(({ icon: Icon, text }) => (
              <li key={text} className="flex gap-2">
                <Icon className="mt-0.5 size-4 shrink-0 text-cta" aria-hidden /> {text}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-2">
          <Button size="lg" variant="cta" nativeButton={false} render={<Link href={primaryCta.href} />}>
            {primaryCta.label} <ArrowRight aria-hidden />
          </Button>
          {!loggedIn && (
            <p className="text-center text-xs text-white/70">
              Sudah punya akun?{" "}
              <Link href="/masuk" className="font-semibold text-white underline">
                Masuk
              </Link>
            </p>
          )}
        </div>
      </div>
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-white/5" />
    </section>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: typeof Check; label: string; value: number; tone: string }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-xl border p-3 sm:flex-row sm:items-center sm:gap-3 sm:p-4">
      <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${tone}`}>
        <Icon className="size-[18px]" aria-hidden />
      </span>
      <div className="flex flex-col-reverse">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="text-xl font-bold">{value}</dd>
      </div>
    </div>
  );
}
