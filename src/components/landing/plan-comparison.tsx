// Landing: perbandingan akun Gratis vs Premium (#paket). Semua klaim mengikuti
// aturan akses nyata (services/access.ts, DECISIONS 2026-10-07); harga & angka
// dari DB (queries/landing.ts). Teknik: harga per hari (anchoring), "tunjukkan,
// bukan ceritakan" (contoh hasil tes gratis vs premium), loss framing, penghapus
// keraguan. Sengaja tanpa hitung mundur palsu, kelangkaan buatan, atau testimoni
// karangan.

import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  Check,
  CircleCheck,
  CircleX,
  Crown,
  Dumbbell,
  Lock,
  QrCode,
  RefreshCcw,
  Sparkles,
  TrendingUp,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { LandingPlan, LandingStats } from "@/server/queries/landing";

type Cell = boolean | string;
const ROWS: {
  group: string;
  items: { label: string; free: Cell; premium: Cell }[];
}[] = [
  {
    group: "Tes & paket",
    items: [
      {
        label:
          "Ujian online format TKA (timer server, autosave, 3 bentuk soal)",
        free: true,
        premium: true,
      },
      {
        label: "Paket tes gratis",
        free: "1 paket per mapel",
        premium: "Semua",
      },
      { label: "Paket tes khusus Premium", free: false, premium: true },
    ],
  },
  {
    group: "Hasil tes",
    items: [
      { label: "Skor & kunci jawaban", free: true, premium: true },
      {
        label: "Pembahasan langkah demi langkah tiap soal",
        free: false,
        premium: true,
      },
    ],
  },
  {
    group: "Analisis & latihan",
    items: [
      { label: "Analisa kemampuan per subtopik", free: false, premium: true },
      {
        label: "Progres & tren kemampuan dari semua tes",
        free: false,
        premium: true,
      },
      { label: "Latihan Kelemahan per subtopik", free: false, premium: true },
      {
        label: "Soal latihan tambahan dari AI (pakai API key Gemini-mu)",
        free: false,
        premium: true,
      },
    ],
  },
];

const FREE_POINTS: { text: string; ok: boolean }[] = [
  { text: "Rasakan ujian TKA sungguhan — 1 paket gratis tiap mapel", ok: true },
  { text: "Skor & kunci jawaban langsung", ok: true },
  { text: "Pembahasan per soal", ok: false },
  { text: "Analisa kelemahan & progres", ok: false },
  { text: "Latihan Kelemahan", ok: false },
];

const PREMIUM_POINTS: { icon: LucideIcon; text: string }[] = [
  {
    icon: BookOpenCheck,
    text: "Semua paket tes, termasuk paket khusus Premium",
  },
  { icon: Sparkles, text: "Pembahasan langkah demi langkah di setiap soal" },
  {
    icon: TrendingUp,
    text: "Analisa per subtopik & grafik progres dari semua tes",
  },
  {
    icon: Dumbbell,
    text: "Latihan Kelemahan — soal khusus subtopik terlemahmu",
  },
];

export function PlanComparison({
  plan,
  stats,
}: {
  plan: LandingPlan | null;
  stats: LandingStats | null;
}) {
  const perDay = plan?.durationDays
    ? Math.ceil(plan.price / plan.durationDays)
    : null;
  return (
    <section id="paket" className="scroll-mt-20 bg-background">
      <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-sm font-bold tracking-wide text-primary uppercase">
            Gratis vs Premium
          </span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Tahu nilaimu itu baik.{" "}
            <span className="text-primary">Tahu cara menaikkannya</span> jauh
            lebih baik.
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Akun gratis cukup untuk merasakan tes TKA yang sesungguhnya. Premium
            menunjukkan <em>kenapa</em> jawabanmu salah dan <em>apa</em> yang
            harus dilatih berikutnya.
          </p>
        </div>

        {/* Kartu paket */}
        <div className="mx-auto mt-12 grid max-w-5xl items-stretch gap-6 md:grid-cols-[2fr_3fr]">
          <article className="surface-card flex flex-col gap-6 p-6 sm:p-8">
            <div>
              <h3 className="text-xl font-bold">Gratis</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Untuk mencoba dan mengenal format TKA.
              </p>
            </div>
            <p>
              <span className="text-4xl font-extrabold tracking-tight">
                Rp0
              </span>
              <span className="ml-1 text-sm text-muted-foreground">
                selamanya
              </span>
            </p>
            <ul className="flex flex-1 flex-col gap-3 text-sm">
              {FREE_POINTS.map((p) => (
                <li
                  key={p.text}
                  className={cn(
                    "flex items-start gap-2.5",
                    !p.ok && "text-muted-foreground",
                  )}
                >
                  {p.ok ? (
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-success"
                      aria-label="Termasuk"
                    />
                  ) : (
                    <Lock
                      className="mt-0.5 size-4 shrink-0"
                      aria-label="Khusus Premium"
                    />
                  )}
                  <span
                    className={cn(
                      !p.ok && "line-through decoration-muted-foreground/40",
                    )}
                  >
                    {p.text}
                  </span>
                </li>
              ))}
            </ul>
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={<Link href="/daftar" />}
            >
              Daftar Gratis
            </Button>
          </article>

          <article className="relative flex flex-col gap-6 overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-[#1e3a8a] p-6 text-primary-foreground shadow-xl ring-4 ring-cta/30 sm:p-8">
            <span className="absolute top-5 right-5 inline-flex items-center gap-1 rounded-full bg-cta px-3 py-1 text-xs font-bold text-cta-foreground">
              <Crown className="size-3.5" aria-hidden /> Paling direkomendasikan
            </span>
            <div>
              <h3 className="text-xl font-bold">Premium</h3>
              <p className="mt-1 text-sm text-primary-foreground/80">
                Untuk persiapan yang terarah sampai hari ujian.
              </p>
            </div>
            {plan ? (
              <div>
                <p>
                  <span className="text-4xl font-extrabold tracking-tight">
                    {formatRupiah(plan.price)}
                  </span>
                  <span className="ml-1 text-sm text-primary-foreground/80">
                    /{" "}
                    {plan.durationDays
                      ? `${plan.durationDays} hari`
                      : "selamanya"}
                  </span>
                </p>
                {perDay && (
                  <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold">
                    <Zap className="size-3.5 text-cta" aria-hidden /> Hanya ±{" "}
                    {formatRupiah(perDay)} per hari
                  </p>
                )}
              </div>
            ) : (
              <p className="text-lg font-semibold">
                Harga terjangkau — lihat setelah daftar
              </p>
            )}
            <ul className="grid flex-1 gap-3 text-sm sm:grid-cols-2">
              {PREMIUM_POINTS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-2.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/15">
                    <Icon className="size-4 text-cta" aria-hidden />
                  </span>
                  <span className="pt-1">{text}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-3">
              <Button
                size="lg"
                variant="cta"
                nativeButton={false}
                render={<Link href="/daftar?next=%2Flangganan" />}
              >
                Mulai Premium <ArrowRight aria-hidden />
              </Button>
              <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-primary-foreground/85">
                <li className="flex items-center gap-1">
                  <QrCode className="size-3.5" aria-hidden /> Bayar QRIS
                </li>
                <li className="flex items-center gap-1">
                  <Zap className="size-3.5" aria-hidden /> Aktif otomatis
                </li>
                <li className="flex items-center gap-1">
                  <RefreshCcw className="size-3.5" aria-hidden /> Tanpa
                  perpanjangan otomatis
                </li>
              </ul>
            </div>
          </article>
        </div>

        {/* Tunjukkan bedanya: contoh hasil tes */}
        <div className="mx-auto mt-20 max-w-5xl">
          <h3 className="text-center text-2xl font-extrabold tracking-tight">
            Bedanya terasa tepat setelah kamu menekan &ldquo;Kumpulkan&rdquo;
          </h3>
          <p className="mx-auto mt-2 max-w-2xl text-center text-muted-foreground">
            Tanpa pembahasan, kamu hanya tahu jawabanmu salah. Dengan Premium,
            kamu tahu letak salahnya — dan langsung melatihnya.
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <ResultMock premium={false} />
            <ResultMock premium />
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Contoh tampilan — soal, nilai, dan subtopik hanya ilustrasi.
          </p>
        </div>

        {/* Tabel lengkap */}
        <div className="mx-auto mt-20 max-w-4xl">
          <h3 className="text-center text-2xl font-extrabold tracking-tight">
            Perbandingan lengkap
          </h3>
          <div className="surface-card mt-8 overflow-hidden">
            <div className="grid grid-cols-[1fr_5.5rem_5.5rem] items-center gap-2 border-b bg-muted/40 px-4 py-3 text-xs font-bold sm:grid-cols-[1fr_9rem_9rem] sm:px-6 sm:text-sm">
              <span>Fitur</span>
              <span className="text-center">Gratis</span>
              <span className="flex items-center justify-center gap-1 text-primary">
                <Crown className="size-4 text-cta" aria-hidden /> Premium
              </span>
            </div>
            {ROWS.map((g) => (
              <div key={g.group}>
                <p className="border-b bg-muted/20 px-4 py-2 text-xs font-bold tracking-wide text-muted-foreground uppercase sm:px-6">
                  {g.group}
                </p>
                <ul className="divide-y">
                  {g.items.map((row) => (
                    <li
                      key={row.label}
                      className="grid grid-cols-[1fr_5.5rem_5.5rem] items-center gap-2 px-4 py-3 text-sm sm:grid-cols-[1fr_9rem_9rem] sm:px-6"
                    >
                      <span>{row.label}</span>
                      <CellView value={row.free} />
                      <CellView value={row.premium} premium />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Angka nyata + CTA penutup */}
        <div className="mx-auto mt-16 flex max-w-4xl flex-col items-center gap-6 text-center">
          {stats && stats.packages > 0 && (
            <dl className="flex w-full flex-wrap justify-center gap-3">
              {(
                [
                  [stats.packages, "paket tes siap dikerjakan"],
                  [stats.questions, "soal lengkap dengan pembahasan"],
                  [stats.premiumPackages, "paket khusus Premium"],
                ] as const
              )
                .filter(([n]) => n > 0)
                .map(([n, label]) => (
                  <div
                    key={label}
                    className="surface-card min-w-0 flex-1 basis-28 px-3 py-4"
                  >
                    <dt className="sr-only">{label}</dt>
                    <dd>
                      <span className="block text-2xl font-extrabold text-primary tabular-nums sm:text-3xl">
                        {n.toLocaleString("id-ID")}
                      </span>
                      <span className="text-xs text-muted-foreground sm:text-sm">
                        {label}
                      </span>
                    </dd>
                  </div>
                ))}
            </dl>
          )}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              variant="cta"
              nativeButton={false}
              render={<Link href="/daftar" />}
            >
              Coba Gratis Sekarang <ArrowRight aria-hidden />
            </Button>
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={<Link href="/daftar?next=%2Flangganan" />}
            >
              <Crown className="text-cta" aria-hidden /> Langsung Premium
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Mulai gratis tanpa kartu kredit. Upgrade kapan saja dari akunmu.
          </p>
        </div>
      </div>
    </section>
  );
}

function CellView({ value, premium }: { value: Cell; premium?: boolean }) {
  if (typeof value === "string")
    return (
      <span
        className={cn(
          "text-center text-xs font-semibold sm:text-sm",
          premium ? "text-primary" : "text-muted-foreground",
        )}
      >
        {value}
      </span>
    );
  return value ? (
    <CircleCheck
      className={cn(
        "mx-auto size-5",
        premium ? "text-success" : "text-success/70",
      )}
      aria-label="Ya"
    />
  ) : (
    <CircleX
      className="mx-auto size-5 text-muted-foreground/50"
      aria-label="Tidak"
    />
  );
}

/** Ilustrasi halaman hasil tes untuk akun gratis vs premium (data contoh). */
function ResultMock({ premium }: { premium: boolean }) {
  return (
    <figure
      className={cn(
        "surface-card flex flex-col overflow-hidden",
        premium ? "border-2 border-primary shadow-lg" : "opacity-95",
      )}
      aria-label={
        premium
          ? "Contoh hasil tes akun Premium"
          : "Contoh hasil tes akun gratis"
      }
    >
      <figcaption
        className={cn(
          "flex items-center justify-between px-5 py-3 text-sm font-bold",
          premium
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground",
        )}
      >
        <span className="flex items-center gap-1.5">
          {premium && <Crown className="size-4 text-cta" aria-hidden />}
          Akun {premium ? "Premium" : "Gratis"}
        </span>
        <span className="text-xs font-semibold opacity-90">
          Skor 70 · 21/30 benar
        </span>
      </figcaption>
      <div className="flex flex-1 flex-col gap-4 p-5 text-sm">
        <div className="rounded-lg border p-3">
          <p className="text-xs font-semibold text-muted-foreground">
            Soal 7 · Pecahan
          </p>
          <p className="mt-1 font-medium">Hasil dari 2/3 + 1/4 adalah ….</p>
          <p className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-destructive-soft px-2 py-0.5 font-semibold text-destructive">
              Jawabanmu: 3/7
            </span>
            <span className="rounded-full bg-success-soft px-2 py-0.5 font-semibold text-success-strong">
              Kunci: 11/12
            </span>
          </p>
        </div>
        {premium ? (
          <>
            <div className="rounded-lg bg-primary-soft p-3">
              <p className="text-xs font-bold text-primary">Pembahasan</p>
              <p className="mt-1 text-xs leading-relaxed">
                Samakan penyebut dulu: 2/3 = 8/12 dan 1/4 = 3/12, lalu jumlahkan
                pembilangnya: 8/12 + 3/12 = 11/12. Jawaban 3/7 muncul karena
                menjumlahkan pembilang dan penyebut langsung — kesalahan yang
                sering terjadi.
              </p>
            </div>
            <div>
              <p className="text-xs font-bold">Subtopik yang perlu dilatih</p>
              {(
                [
                  ["Pecahan", 40],
                  ["Pengukuran", 55],
                ] as const
              ).map(([name, v]) => (
                <div key={name} className="mt-2">
                  <div className="flex justify-between text-xs">
                    <span>{name}</span>
                    <span className="font-semibold tabular-nums">{v}%</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-destructive/70"
                      style={{ width: `${v}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <span className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-cta px-3 py-2 text-xs font-bold text-cta-foreground">
              <Dumbbell className="size-4" aria-hidden /> Latihan Pecahan
              sekarang
            </span>
          </>
        ) : (
          <div className="relative flex flex-1 flex-col gap-3">
            <div
              aria-hidden
              className="flex flex-col gap-2 blur-[3px] select-none"
            >
              {[90, 100, 75, 85, 60, 95].map((w, i) => (
                <div
                  key={i}
                  className="h-2.5 rounded-full bg-muted-foreground/25"
                  style={{ width: `${w}%` }}
                />
              ))}
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center">
              <span className="flex size-9 items-center justify-center rounded-full bg-card shadow">
                <Lock className="size-4 text-muted-foreground" aria-hidden />
              </span>
              <p className="text-xs font-semibold text-muted-foreground">
                Pembahasan & analisa terkunci
              </p>
              <p className="text-xs text-muted-foreground">
                Kamu tahu salah — tapi tidak tahu kenapa.
              </p>
            </div>
          </div>
        )}
      </div>
    </figure>
  );
}
