import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Brain,
  CircleCheck,
  Clock,
  Crosshair,
  Layers,
  ListChecks,
  Quote,
  Save,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { BrandLockup, Logo } from "@/components/brand/logo";
import { PlanComparison } from "@/components/landing/plan-comparison";
import { Button } from "@/components/ui/button";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import { cn } from "@/lib/utils";
import { getLandingData } from "@/server/queries/landing";

// Dirender setiap kunjungan: angka paket & soal, harga Premium, dan testimoni
// selalu sesuai database (beberapa COUNT kecil — ringan).
export const dynamic = "force-dynamic";

// Struktur mengikuti docs/UI_UX.md §4.1 & layar Stitch "Landing Page".
// Semua klaim di halaman ini harus faktual — jangan tambahkan angka pengguna,
// tingkat kelulusan, atau testimoni karangan. Testimoni hanya dari DB
// (testimoni diisi admin di Pengaturan Sistem; section tersembunyi bila kosong).

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

/** Fakta kesesuaian dengan Kerangka Asesmen TKA (asesmen/*.json, docs/ATURAN_PAKET.md).
 *  Nomor urut = penanda ①–④ pada ilustrasi soal di sebelahnya. */
const kerangka: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: ListChecks,
    title: "Tiga bentuk soal resmi",
    text: "Pilihan Ganda, PG Kompleks pilih-banyak (MCMA), dan PG Kompleks Kategori — sama seperti ujian sesungguhnya.",
  },
  {
    icon: Layers,
    title: "Dipetakan ke elemen & subelemen",
    text: "Setiap soal punya topik dan subtopik kerangka. Paket mencakup semua topik dan minimal 80% subtopik mapel.",
  },
  {
    icon: Brain,
    title: "Level kognitif L1–L3",
    text: "Dari pemahaman, aplikasi, hingga penalaran — paket tidak didominasi soal mudah atau hafalan.",
  },
  {
    icon: BookOpenCheck,
    title: "Pembahasan di setiap soal",
    text: "Kunci dan langkah penyelesaian lengkap, termasuk kesalahan yang sering terjadi.",
  },
];

const faqs: { q: string; a: string }[] = [
  {
    q: "Apa itu TKA?",
    a: "Tes Kemampuan Akademik (TKA) adalah tes terstandar dari Kemendikdasmen untuk mengukur capaian akademik murid SD, SMP, dan SMA/SMK. Hasilnya dapat dipakai, antara lain, untuk keperluan seleksi akademik.",
  },
  {
    q: "Apakah soal di sini sama dengan soal TKA resmi?",
    a: "Tidak. Soal di sini adalah soal latihan yang disusun mandiri mengikuti Kerangka Asesmen TKA resmi — bentuk soal, cakupan materi, dan level kognitifnya sama, tetapi bukan bocoran atau salinan soal ujian.",
  },
  {
    q: "Bagaimana analisis kelemahan bekerja?",
    a: "Setiap soal terhubung ke satu subtopik kerangka. Setelah tes, skor dihitung per subtopik dan digabung dari semua tes yang pernah kamu kerjakan, sehingga terlihat subtopik mana yang paling perlu dilatih.",
  },
  {
    q: "Apakah bisa dikerjakan di HP?",
    a: "Bisa. Tampilan tes menyesuaikan layar HP, jawaban tersimpan otomatis setiap kamu memilih, dan waktu dihitung dari server — jadi aman meski koneksi sempat terputus.",
  },
  {
    q: "Apakah gratis?",
    a: "Daftar gratis tanpa kartu kredit. Akun gratis bisa mengerjakan 1 paket tes gratis di setiap mata pelajaran dan melihat skor serta kunci jawaban. Premium membuka semua paket tes, pembahasan tiap soal, analisa kelemahan per subtopik, progres, dan Latihan Kelemahan.",
  },
  {
    q: "Bagaimana cara membayar Premium?",
    a: "Pilih paket di menu Langganan, lalu bayar dengan QRIS (GoPay, OVO, DANA, ShopeePay, atau m-banking) yang diproses oleh DOKU. Premium aktif otomatis begitu pembayaran berhasil dan tidak diperpanjang otomatis — kamu yang memutuskan kapan memperpanjang.",
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

const steps = [
  { title: "Daftar & pilih jenjang", text: "Buat akun gratis, lalu pilih paket sesuai jenjangmu." },
  { title: "Kerjakan tes", text: "Satu soal per layar, timer jelas, bisa tandai ragu-ragu." },
  { title: "Latih yang lemah", text: "Lihat subtopik terlemah dan lanjut ke latihan terfokus." },
];

export default async function LandingPage() {
  const { testimonials, plan, stats } = await getLandingData();
  return (
    <div className="flex flex-1 flex-col bg-card">
      <header className="sticky top-0 z-50 border-b bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-20 lg:px-8">
          <Logo priority />
          <nav aria-label="Navigasi utama" className="hidden items-center gap-1 md:flex">
            {[
              ["#kerangka", "Kerangka TKA"],
              ["#fitur", "Fitur"],
              ["#jenjang", "Jenjang"],
              ["#paket", "Paket"],
              ["#faq", "FAQ"],
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
                <Sparkles className="size-3.5" aria-hidden /> {SITE_NAME} · Latihan TKA SD · SMP · SMA
              </span>
              <p className="text-xl font-extrabold tracking-tight">
                <span className="text-primary">Kenali Kelemahan,</span> <span className="text-cta-hover">Kuasai TKA.</span>
              </p>
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

        {/* Kerangka asesmen: ilustrasi soal beranotasi ①–④ + penjelasan bernomor */}
        <section id="kerangka" className="scroll-mt-20 bg-gradient-to-b from-card via-primary-soft/40 to-card">
          <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <SectionHeading eyebrow="Sesuai kerangka resmi" title="Disusun mengikuti Kerangka Asesmen TKA" wide />
            <ul className="mt-5 flex flex-wrap justify-center gap-2" aria-label="Acuan regulasi">
              {[
                ["SD & SMP", "Perkaban BSKAP No. 047/H/AN/2025"],
                ["SMA / SMK", "Perkaban BSKAP No. 045/H/AN/2025"],
              ].map(([level, reg]) => (
                <li key={level} className="flex items-center gap-2 rounded-full border bg-card py-1 pr-3 pl-1 text-xs shadow-sm sm:text-sm">
                  <span className="rounded-full bg-primary px-2.5 py-0.5 font-bold text-primary-foreground">{level}</span>
                  <span className="font-medium text-muted-foreground">{reg}</span>
                </li>
              ))}
            </ul>

            <div className="mt-14 grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-16">
              <KerangkaIllustration />
              <ol className="flex flex-col gap-7">
                {kerangka.map(({ icon: Icon, title, text }, i) => (
                  <li key={title} className="flex gap-4">
                    <Marker n={i + 1} className="mt-0.5 size-9 text-base" />
                    <div>
                      <h3 className="flex items-center gap-2 text-lg font-bold">
                        <Icon className="size-5 text-primary" aria-hidden /> {title}
                      </h3>
                      <p className="mt-1 text-muted-foreground">{text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <p className="mx-auto mt-14 max-w-2xl text-center text-xs text-muted-foreground">
              Soal latihan disusun mandiri mengikuti kerangka asesmen; bukan soal resmi TKA.
            </p>
          </div>
        </section>

        {/* Fitur */}
        <section id="fitur" className="scroll-mt-20 bg-background">
          <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Fitur"
              title="Semua yang kamu butuhkan untuk latihan TKA"
              wide
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
        <PlanComparison plan={plan} stats={stats} />

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

        {/* Testimoni — hanya dari data asli yang diisi admin */}
        {testimonials.length > 0 && (
          <section id="testimoni" className="scroll-mt-20 bg-background">
            <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
              <SectionHeading eyebrow="Testimoni" title="Kata mereka yang sudah berlatih" />
              <ul className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {testimonials.map((t, i) => (
                  <li key={i} className="surface-card flex flex-col gap-4 p-6">
                    <Quote className="size-7 text-primary/40" aria-hidden />
                    <blockquote className="flex-1 leading-relaxed">{t.quote}</blockquote>
                    <div className="flex items-center gap-3 border-t pt-4">
                      <span className="flex size-10 items-center justify-center rounded-full bg-primary-soft font-bold text-primary" aria-hidden>
                        {t.name.trim().charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <div className="font-bold">{t.name}</div>
                        {t.role && <div className="text-sm text-muted-foreground">{t.role}</div>}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 bg-card">
          <div className="mx-auto w-full max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
            <SectionHeading eyebrow="FAQ" title="Pertanyaan yang sering diajukan" />
            <div className="mt-10 flex flex-col gap-3">
              {faqs.map((f) => (
                <details key={f.q} className="group rounded-2xl border bg-background px-5 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                    {f.q}
                    <span className="text-xl text-primary transition-transform group-open:rotate-45" aria-hidden>
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </div>
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
          <div className="flex flex-col gap-3">
            <BrandLockup className="h-auto w-44" />
            <p className="text-base font-bold text-primary">{SITE_TAGLINE}</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Platform latihan Tes Kemampuan Akademik untuk siswa SD, SMP, dan SMA — disusun mengikuti Kerangka Asesmen TKA.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground md:items-end">
            <nav aria-label="Tautan legal" className="flex flex-wrap gap-x-4 gap-y-1">
              <Link href="/syarat" className="hover:text-foreground">
                Syarat & Ketentuan
              </Link>
              <Link href="/privasi" className="hover:text-foreground">
                Kebijakan Privasi
              </Link>
            </nav>
            <p>
              © {new Date().getFullYear()} {SITE_NAME}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/** `wide`: judul panjang tetap satu baris di desktop (tetap membungkus di HP). */
function SectionHeading({ eyebrow, title, text, wide }: { eyebrow: string; title: string; text?: string; wide?: boolean }) {
  return (
    <div className={cn("mx-auto text-center", wide ? "max-w-4xl" : "max-w-2xl")}>
      <span className="text-sm font-bold tracking-wide text-primary uppercase">{eyebrow}</span>
      <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
      {text && <p className="mt-3 text-lg text-muted-foreground">{text}</p>}
    </div>
  );
}

/** Penanda bernomor yang menghubungkan ilustrasi dengan daftar penjelasan. */
function Marker({ n, className }: { n: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("flex size-7 shrink-0 items-center justify-center rounded-full bg-cta text-sm font-extrabold text-cta-foreground shadow-md ring-4 ring-card", className)}
    >
      {n}
    </span>
  );
}

/** Ilustrasi kartu soal (contoh, bukan soal dari bank) dengan anotasi ①–④ sejajar elemennya. */
function KerangkaIllustration() {
  const options = ["3 buku", "4 buku", "5 buku", "6 buku"];
  const small = "size-5 text-[11px] ring-2 shadow-none";
  return (
    <div
      role="img"
      aria-label="Contoh kartu soal: bentuk Pilihan Ganda, subtopik Aljabar Persamaan Linear, level kognitif L2 Aplikasi, dilengkapi pembahasan"
      className="surface-card mx-auto w-full max-w-lg shadow-xl ring-8 ring-primary/5"
    >
      {/* ① bentuk soal */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-t-[inherit] border-b bg-muted/50 p-3">
        <Marker n={1} className={small} />
        {["Pilihan Ganda", "PGK MCMA", "PGK Kategori"].map((t, i) => (
          <span
            key={t}
            className={cn("rounded-lg px-2.5 py-1 text-xs font-semibold", i === 0 ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground")}
          >
            {t}
          </span>
        ))}
      </div>

      <div className="flex flex-col gap-4 p-5 sm:p-6">
        {/* ② subtopik & ③ level kognitif */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
          <span className="flex items-center gap-1.5">
            <Marker n={2} className={small} />
            <span className="rounded-full bg-primary-soft px-2.5 py-1 font-semibold text-primary">SMP · Aljabar › Persamaan Linear</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Marker n={3} className={small} />
            <span className="rounded-full bg-warning-soft px-2.5 py-1 font-semibold text-warning-strong">L2 · Aplikasi</span>
          </span>
        </div>

        <p className="leading-relaxed">
          Harga 3 buku tulis dan 2 pensil adalah Rp29.000,00. Jika harga 1 pensil Rp4.000,00, banyak buku yang dapat dibeli
          dengan uang Rp35.000,00 adalah ....
        </p>

        <ul className="grid grid-cols-2 gap-2 text-sm">
          {options.map((o, i) => (
            <li key={o} className={cn("flex items-center gap-2 rounded-lg border px-3 py-2", i === 2 && "border-primary bg-primary-soft font-semibold text-primary")}>
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-md text-xs font-bold",
                  i === 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {"ABCD"[i]}
              </span>
              {o}
            </li>
          ))}
        </ul>

        {/* ④ pembahasan */}
        <div className="rounded-xl bg-success-soft p-3 text-sm">
          <div className="flex items-center gap-1.5 font-semibold text-success-strong">
            <Marker n={4} className={small} />
            <BookOpenCheck className="size-4" aria-hidden /> Pembahasan
          </div>
          <p className="mt-1 text-muted-foreground">Harga 1 buku = (29.000 − 8.000) : 3 = 7.000, jadi 35.000 : 7.000 = 5 buku.</p>
        </div>
      </div>
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
