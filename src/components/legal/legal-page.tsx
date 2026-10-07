// Kerangka halaman legal (Kebijakan Privasi, Syarat & Ketentuan): header logo,
// judul, tanggal berlaku, daftar isi, isi, dan tautan silang.

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { SITE_NAME } from "@/lib/site";

export type LegalSection = { id: string; title: string; body: React.ReactNode };

/** Email kontak dari env CONTACT_EMAIL (opsional) — server only. */
export function contactEmail() {
  return process.env.CONTACT_EMAIL?.trim() || null;
}

export function ContactLine() {
  const email = contactEmail();
  return email ? (
    <>
      email{" "}
      <a href={`mailto:${email}`} className="font-semibold text-primary hover:underline">
        {email}
      </a>
    </>
  ) : (
    <>kanal kontak resmi yang tercantum di situs ini</>
  );
}

export function LegalPage({
  title,
  intro,
  effectiveDate,
  sections,
  other,
}: {
  title: string;
  intro: React.ReactNode;
  effectiveDate: string;
  sections: LegalSection[];
  other: { href: string; label: string };
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          <Link href="/" className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" aria-hidden /> Beranda
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Berlaku sejak {effectiveDate}</p>
        <div className="mt-6 text-base leading-relaxed text-foreground/90">{intro}</div>

        <nav aria-label="Daftar isi" className="surface-card mt-8 p-5">
          <h2 className="text-sm font-bold">Daftar isi</h2>
          <ol className="mt-3 grid list-decimal gap-1.5 pl-5 text-sm sm:grid-cols-2">
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-primary hover:underline">
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-10 flex flex-col gap-10">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="scroll-mt-6">
              <h2 id={`${s.id}-h`} className="text-xl font-bold">
                {i + 1}. {s.title}
              </h2>
              <div className="legal-body mt-3 flex flex-col gap-3 leading-relaxed text-foreground/90 [&_li]:ml-5 [&_li]:list-disc [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5">
                {s.body}
              </div>
            </section>
          ))}
        </div>
      </main>

      <footer className="border-t bg-card">
        <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:px-6">
          <span>
            © {new Date().getFullYear()} {SITE_NAME}
          </span>
          <Link href={other.href} className="font-semibold text-primary hover:underline">
            {other.label}
          </Link>
        </div>
      </footer>
    </div>
  );
}
