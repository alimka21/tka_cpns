// Potongan UI halaman materi TKA publik (/tka/...).

import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const FORM_INFO: Record<string, { name: string; text: string }> = {
  pg: { name: "Pilihan Ganda", text: "Satu jawaban benar dari beberapa pilihan." },
  pgk_mcma: { name: "PG Kompleks (MCMA)", text: "Lebih dari satu jawaban benar — semua yang benar harus dipilih." },
  pgk_kategori: { name: "PG Kompleks Kategori", text: "Menilai setiap pernyataan, misalnya Benar/Salah atau Sesuai/Tidak Sesuai." },
};

export function Breadcrumbs({ items }: { items: { name: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((it, i) => (
          <li key={it.name} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="size-3.5" aria-hidden />}
            {it.href ? (
              <Link href={it.href} className="hover:text-foreground">
                {it.name}
              </Link>
            ) : (
              <span aria-current="page" className="font-medium text-foreground">
                {it.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function FaqList({ faqs }: { faqs: { q: string; a: string }[] }) {
  return (
    <div className="flex flex-col gap-3">
      {faqs.map((f) => (
        <details key={f.q} className="group rounded-2xl border bg-background px-5 py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
            <h3>{f.q}</h3>
            <span className="text-xl text-primary transition-transform group-open:rotate-45" aria-hidden>
              +
            </span>
          </summary>
          <p className="mt-3 text-muted-foreground">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

export function MateriCta({ title, text }: { title: string; text: string }) {
  return (
    <section className="flex flex-col items-center gap-5 rounded-3xl bg-primary px-6 py-12 text-center text-primary-foreground sm:px-12">
      <h2 className="max-w-2xl text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h2>
      <p className="max-w-xl text-white/80">{text}</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="lg" variant="cta" nativeButton={false} render={<Link href="/daftar" />}>
          Daftar Gratis <ArrowRight aria-hidden />
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
          nativeButton={false}
          render={<Link href="/tes/demo" />}
        >
          Coba Demo Tes
        </Button>
      </div>
    </section>
  );
}
