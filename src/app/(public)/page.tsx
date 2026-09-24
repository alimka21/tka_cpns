import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  CircleCheck,
  Clock,
  Crosshair,
  Layers,
  Minus,
  Save,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { SITE_NAME } from "@/lib/site";
import { cn } from "@/lib/utils";

// Struktur mengikuti docs/UI_UX.md §4.1 & layar Stitch "Landing Page".
// Semua klaim di halaman ini harus faktual — jangan tambahkan angka pengguna,
// tingkat kelulusan, atau testimoni sebelum datanya benar-benar ada.

const highlights: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Layers, title: "SD · SMP · SMA", text: "Paket per jenjang & mapel" },
  { icon: Crosshair, title: "Per subtopik", text: "Analisis kelemahan presisi" },
  { icon: Clock, title: "Timer server", text: "Adil, tidak bisa diakali" },
  { icon: Save, title: "Autosave", text: "Jawaban tersimpan tiap klik" },
];

const features: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: BarChart3,
    title: "Analisis Kelemahan per Subtopik",
    text: "Bukan cuma skor akhir. Radar chart menunjukkan subtopik mana yang paling lemah — misalnya Pecahan atau Teks Eksplanasi — supaya belajar lebih terarah.",
  },
  {
    icon: Layers,
    title: "Bank Soal Terstruktur",
    text: "Soal tersusun per Jenjang → Mata Pelajaran → Subtopik, lengkap dengan rumus matematika yang rapi dan pembahasan.",
  },
  {
    icon: ShieldCheck,
    title: "Simulasi yang Adil",
    text: "Waktu dihitung dari server, kunci jawaban tidak pernah dikirim ke browser selama tes, dan jawaban tersimpan otomatis.",
  },
  {
    icon: Sparkles,
    title: "Latihan Terfokus",
    text: "Setelah tes, langsung lanjut ke latihan subtopik terlemah. Materi baru terus ditambah oleh tim, termasuk dengan bantuan AI yang direview manual.",
  },
];

const jenjang = [
  {
    level: "SD",
    title: "TKA SD / MI",
    text: "Latihan dasar numerasi dan literasi untuk kelas 6.",
    subjects: ["Matematika", "Bahasa Indonesia"],
  },
  {
    level: "SMP",
    title: "TKA SMP / MTs",
    text: "Penguatan konsep dan penalaran untuk kelas 9.",
    subjects: ["Matematika", "Bahasa Indonesia"],
  },
  {
    level: "SMA",
    title: "TKA SMA / MA / SMK",
    text: "Persiapan mapel wajib dan pilihan untuk kelas 12.",
    subjects: ["Matematika", "Bahasa Indonesia", "Bahasa Inggris", "Mapel pilihan"],
  },
];

const plans = [
  {
    name: "Gratis",
    tagline: "Untuk mencoba sistem ujian dan mulai latihan.",
    cta: { label: "Daftar Gratis", href: "/daftar", variant: "outline" as const },
    features: [
      { text: "Paket latihan gratis tiap jenjang", included: true },
      { text: "Skor langsung setelah tes", included: true },
      { text: "Analisis per subtopik", included: true },
      { text: "Semua paket simulasi lengkap", included: false },
      { text: "Paket HOTS & latihan lanjutan", included: false },
    ],
  },
  {
    name: "Premium",
    tagline: "Akses penuh untuk persiapan intensif.",
    cta: { label: "Daftar & Minta Akses", href: "/daftar", variant: "cta" as const },
    featured: true,
    features: [
      { text: "Semua yang ada di paket Gratis", included: true },
      { text: "Semua paket simulasi lengkap", included: true },
      { text: "Paket HOTS & latihan lanjutan", included: true },
      { text: "Riwayat & tren skor tiap paket", included: true },
      { text: "Diaktifkan manual oleh admin", included: true },
    ],
  },
];

const steps = [
  { title: "Daftar & pilih jenjang", text: "Buat akun gratis, lalu pilih paket sesuai jenjangmu." },
  { title: "Kerjakan tes", text: "Satu soal per layar, timer jelas, bisa tandai ragu-ragu." },
  { title: "Latih yang lemah", text: "Lihat subtopik terlemah dan lanjut ke latihan terfokus." },
];

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col bg-card">
      <header className="sticky top-0 z-50 border-b bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-20 lg:px-8">
          <Logo />
          <nav aria-label="Navigasi utama" className="hidden items-center gap-1 md:flex">
            {[
              ["#fitur", "Fitur"],
              ["#jenjang", "Jenjang"],
              ["#paket", "Paket"],
            ].map(([href, label]) => (
              <a key={href} href={href} className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="hidden sm:inline-flex" nativeButton={false} render={<Link href="/masuk" />}>
              Masuk
            </Button>
            <Button variant="cta" nativeButton={false} render={<Link href="/daftar" />}>
              Daftar Gratis
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary-soft to-card">
          <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
            <div className="flex flex-col items-start gap-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-card px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="size-3.5" aria-hidden /> Latihan Tes Kemampuan Akademik SD · SMP · SMA
              </span>
              <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
                Latihan TKA jadi lebih <span className="text-primary">terarah</span> & terukur
              </h1>
              <p className="max-w-xl text-lg text-muted-foreground">
                Kerjakan paket tes, lalu langsung tahu subtopik mana yang perlu diperkuat — bukan cuma angka skor di
                akhir.
              </p>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Button size="lg" variant="cta" nativeButton={false} render={<Link href="/daftar" />}>
                  Mulai Gratis Sekarang <ArrowRight aria-hidden />
                </Button>
                <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/tes/demo" />}>
                  Coba Demo Tes
                </Button>
              </div>
              <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <CircleCheck className="size-4 text-success" aria-hidden /> Gratis, tanpa kartu kredit
                <span aria-hidden>·</span>
                <Link href="/masuk" className="font-semibold text-primary hover:underline">
                  Sudah punya akun? Masuk
                </Link>
              </p>
            </div>
            <HeroPreview />
          </div>
        </section>

        {/* Highlight bar */}
        <section aria-label="Keunggulan singkat" className="border-y bg-card">
          <ul className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-4 lg:px-8">
            {highlights.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div>
                  <div className="font-bold">{title}</div>
                  <div className="text-sm text-muted-foreground">{text}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Fitur */}
        <section id="fitur" className="scroll-mt-20 bg-background">
          <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Fitur"
              title="Semua yang kamu butuhkan untuk latihan TKA"
              text="Dirancang supaya waktu belajarmu dipakai untuk hal yang paling berdampak."
            />
            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              {features.map(({ icon: Icon, title, text }) => (
                <article key={title} className="surface-card flex gap-5 p-6 sm:p-8">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Icon className="size-6" aria-hidden />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold">{title}</h3>
                    <p className="mt-2 text-muted-foreground">{text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Jenjang */}
        <section id="jenjang" className="scroll-mt-20 bg-card">
          <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Jenjang"
              title="Pilih jenjangmu"
              text="Paket disusun per jenjang dan mata pelajaran mengikuti kisi-kisi TKA."
            />
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {jenjang.map((j) => (
                <article key={j.level} className="surface-card flex flex-col gap-5 p-6 sm:p-8">
                  <span className="flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-xl font-extrabold text-primary">
                    {j.level}
                  </span>
                  <div>
                    <h3 className="text-xl font-bold">{j.title}</h3>
                    <p className="mt-1 text-muted-foreground">{j.text}</p>
                  </div>
                  <ul className="flex flex-wrap gap-2">
                    {j.subjects.map((s) => (
                      <li key={s} className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                        {s}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Gratis vs Premium */}
        <section id="paket" className="scroll-mt-20 bg-background">
          <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Paket"
              title="Mulai gratis, upgrade saat butuh"
              text="Akses premium saat ini diaktifkan manual oleh admin — pembayaran online menyusul."
            />
            <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
              {plans.map((plan) => (
                <article
                  key={plan.name}
                  className={cn(
                    "surface-card relative flex flex-col gap-6 p-6 sm:p-8",
                    plan.featured && "border-2 border-primary shadow-md",
                  )}
                >
                  {plan.featured && (
                    <span className="absolute -top-3 left-6 rounded-full bg-cta px-3 py-1 text-xs font-bold text-cta-foreground">
                      Paling lengkap
                    </span>
                  )}
                  <div>
                    <h3 className="text-2xl font-bold">{plan.name}</h3>
                    <p className="mt-1 text-muted-foreground">{plan.tagline}</p>
                  </div>
                  <ul className="flex flex-1 flex-col gap-3">
                    {plan.features.map((f) => (
                      <li key={f.text} className={cn("flex items-start gap-3 text-sm", !f.included && "text-muted-foreground")}>
                        {f.included ? (
                          <Check className="mt-0.5 size-4 shrink-0 text-success" aria-label="Termasuk" />
                        ) : (
                          <Minus className="mt-0.5 size-4 shrink-0" aria-label="Tidak termasuk" />
                        )}
                        {f.text}
                      </li>
                    ))}
                  </ul>
                  <Button size="lg" variant={plan.cta.variant} nativeButton={false} render={<Link href={plan.cta.href} />}>
                    {plan.cta.label}
                  </Button>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Cara kerja */}
        <section className="bg-card">
          <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <SectionHeading eyebrow="Cara kerja" title="Tiga langkah sederhana" />
            <ol className="mt-12 grid gap-6 md:grid-cols-3">
              {steps.map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-bold">{step.title}</h3>
                    <p className="mt-1 text-muted-foreground">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* CTA akhir */}
        <section className="bg-card px-4 pb-20 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-6 rounded-3xl bg-primary px-6 py-14 text-center text-primary-foreground sm:px-12">
            <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">
              Siap tahu subtopik mana yang perlu kamu kuasai?
            </h2>
            <p className="max-w-xl text-white/80">Daftar dalam hitungan detik, lalu kerjakan paket pertamamu hari ini.</p>
            <Button size="lg" variant="cta" nativeButton={false} render={<Link href="/daftar" />}>
              Daftar Akun Gratis <ArrowRight aria-hidden />
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t bg-background">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex flex-col gap-2">
            <Logo />
            <p className="text-sm text-muted-foreground">Platform latihan Tes Kemampuan Akademik untuk siswa SD, SMP, dan SMA.</p>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {SITE_NAME}
          </p>
        </div>
      </footer>
    </div>
  );
}

function SectionHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="text-sm font-bold tracking-wide text-primary uppercase">{eyebrow}</span>
      <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
      {text && <p className="mt-3 text-lg text-muted-foreground">{text}</p>}
    </div>
  );
}

/** Ilustrasi hasil analisis (bukan data asli) — meniru kartu dashboard di Stitch. */
function HeroPreview() {
  const bars = [
    { label: "Bilangan Bulat", value: 100 },
    { label: "Persamaan Linear", value: 80 },
    { label: "Pola Bilangan", value: 75 },
    { label: "Pecahan", value: 38, weak: true },
  ];
  return (
    <div
      role="img"
      aria-label="Contoh tampilan hasil: skor 72 dari 100, subtopik terlemah Pecahan dengan akurasi 38 persen"
      className="surface-card relative mx-auto w-full max-w-md p-6 shadow-xl lg:ml-auto"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase">Contoh hasil</div>
          <div className="mt-1 font-bold">TKA SMP · Matematika</div>
        </div>
        <span className="rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-semibold text-success">Selesai</span>
      </div>
      <div className="mt-5 flex items-baseline gap-2">
        <span className="text-5xl font-extrabold text-primary">72</span>
        <span className="text-muted-foreground">/ 100</span>
      </div>
      <div className="mt-6 flex flex-col gap-3">
        {bars.map((b) => (
          <div key={b.label}>
            <div className="mb-1 flex justify-between text-xs">
              <span className={cn("font-medium", b.weak && "font-bold text-foreground")}>
                {b.weak && "⚠ "}
                {b.label}
              </span>
              <span className="font-semibold tabular-nums">{b.value}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div className={cn("h-2 rounded-full", b.weak ? "bg-destructive" : "bg-primary")} style={{ width: `${b.value}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex gap-3 rounded-xl border border-destructive/20 bg-destructive-soft p-3">
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
        <div className="text-xs">
          <div className="font-bold text-foreground">Titik lemah: Pecahan</div>
          <div className="text-muted-foreground">Latih 10 soal fokus untuk menutup celah ini.</div>
        </div>
      </div>
      <div className="absolute -bottom-4 -left-4 hidden items-center gap-2 rounded-xl border bg-card px-3 py-2 text-xs font-semibold shadow-lg sm:flex">
        <Save className="size-4 text-success" aria-hidden /> Jawaban tersimpan otomatis
      </div>
    </div>
  );
}
