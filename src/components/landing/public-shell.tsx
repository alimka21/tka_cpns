// Header & footer halaman publik (landing + halaman materi TKA).

import Link from "next/link";
import { BrandLockup, Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { jenjangPath, subjectPath } from "@/lib/seo";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

const NAV: [string, string][] = [
  ["#kerangka", "Kerangka TKA"],
  ["#fitur", "Fitur"],
  ["#jenjang", "Jenjang"],
  ["#paket", "Paket"],
  ["#faq", "FAQ"],
];

/** `onLanding`: tautan anchor di halaman yang sama; selain itu menuju bagian di beranda. */
export function PublicHeader({ onLanding = false }: { onLanding?: boolean }) {
  return (
    <header className="sticky top-0 z-50 border-b bg-card/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-20 lg:px-8">
        <Logo priority />
        <nav aria-label="Navigasi utama" className="hidden items-center gap-1 md:flex">
          {NAV.map(([hash, label]) => (
            <a
              key={hash}
              href={onLanding ? hash : `/${hash}`}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
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
  );
}

const MATERI: { label: string; jenjang: string; subjects: { code: string; name: string }[] }[] = [
  {
    label: "TKA SD/MI",
    jenjang: "SD",
    subjects: [
      { code: "SD-MTK", name: "Matematika" },
      { code: "SD-BIND", name: "Bahasa Indonesia" },
    ],
  },
  {
    label: "TKA SMP/MTs",
    jenjang: "SMP",
    subjects: [
      { code: "SMP-MTK", name: "Matematika" },
      { code: "SMP-BIND", name: "Bahasa Indonesia" },
    ],
  },
  {
    label: "TKA SMA/MA/SMK",
    jenjang: "SMA",
    subjects: [
      { code: "SMA-MTK", name: "Matematika" },
      { code: "SMA-BIND", name: "Bahasa Indonesia" },
      { code: "SMA-BING", name: "Bahasa Inggris" },
    ],
  },
];

export function PublicFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.3fr_2fr] lg:px-8">
        <div className="flex flex-col gap-3">
          <BrandLockup className="h-auto w-44" />
          <p className="text-base font-bold text-primary">{SITE_TAGLINE}</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Platform latihan Tes Kemampuan Akademik untuk siswa SD, SMP, dan SMA — disusun mengikuti Kerangka Asesmen TKA.
          </p>
        </div>
        <nav aria-label="Materi TKA" className="grid grid-cols-2 gap-6 text-sm sm:grid-cols-3">
          {MATERI.map((m) => (
            <div key={m.jenjang} className="flex flex-col gap-2">
              <Link href={jenjangPath(m.jenjang)} className="font-bold text-foreground hover:text-primary">
                {m.label}
              </Link>
              {m.subjects.map((s) => (
                <Link key={s.code} href={subjectPath(m.jenjang, s)} className="text-muted-foreground hover:text-foreground">
                  {s.name}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </div>
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t px-4 py-5 text-sm text-muted-foreground sm:px-6 lg:px-8">
        <p>
          © {new Date().getFullYear()} {SITE_NAME}
        </p>
        <nav aria-label="Tautan legal" className="flex flex-wrap gap-x-4 gap-y-1">
          <Link href="/syarat" className="hover:text-foreground">
            Syarat & Ketentuan
          </Link>
          <Link href="/privasi" className="hover:text-foreground">
            Kebijakan Privasi
          </Link>
        </nav>
      </div>
    </footer>
  );
}
