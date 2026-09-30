import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenText, ChevronLeft, ChevronRight, FileUp, ImageIcon, Plus, Sparkles } from "lucide-react";
import { BankFilterBar, QuestionList, type FilterNode } from "@/components/admin/question-bank";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { bankHref, parseBankFilters, type BankFilters } from "@/lib/bank-filters";
import { BANK_PAGE_SIZE, getBankHierarchy, searchQuestions, type BankNode } from "@/server/queries/question-bank";

export const metadata: Metadata = { title: "Bank Soal" };
export const dynamic = "force-dynamic";

const LEVEL_LABEL = ["Jenjang", "Mata pelajaran", "Topik", "Subtopik"];

export default async function AdminSoalPage({ searchParams }: PageProps<"/admin/soal">) {
  const filters = parseBankFilters(await searchParams);
  const [tree, { rows, total }] = await Promise.all([getBankHierarchy(), searchQuestions(filters)]);

  // Jalur node terpilih: jenjang → mapel → topik → subtopik.
  const path: BankNode[] = [];
  let level: BankNode[] = tree;
  for (const code of [filters.jenjang, filters.mapel, filters.topik, filters.sub]) {
    const node = code ? level.find((n) => n.code === code) : undefined;
    if (!node) break;
    path.push(node);
    level = node.children;
  }
  const scope = path.at(-1);
  const children = scope ? scope.children : tree;
  const scopeKeys: (keyof BankFilters)[] = ["jenjang", "mapel", "topik", "sub"];
  const hrefFor = (depth: number, code?: string) =>
    bankHref(Object.fromEntries(scopeKeys.map((k, i) => [k, i < depth ? path[i].code : i === depth ? code : undefined])));

  const page = filters.hal ?? 1;
  const pages = Math.max(1, Math.ceil(total / BANK_PAGE_SIZE));
  const filterTree = tree.map(function strip(n): FilterNode {
    return { code: n.code, name: n.name, children: n.children.map(strip) };
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Bank Soal"
        description="Semua soal per Jenjang → Mata pelajaran → Topik → Subtopik. Soal baru & soal AI baru tampil ke siswa setelah diterbitkan."
        actions={
          <>
            <Button variant="outline" nativeButton={false} render={<Link href="/admin/soal/gambar" />}>
              <ImageIcon aria-hidden /> Gambar soal
            </Button>
            <Button variant="outline" nativeButton={false} render={<Link href="/admin/soal/import" />}>
              <FileUp aria-hidden /> Import Excel
            </Button>
            <Button variant="outline" nativeButton={false} render={<Link href="/admin/soal/generate-ai" />}>
              <Sparkles aria-hidden /> Generate AI
            </Button>
            <Button nativeButton={false} render={<Link href="/admin/soal/baru" />}>
              <Plus aria-hidden /> Tambah Soal
            </Button>
          </>
        }
      />

      <BankFilterBar tree={filterTree} filters={filters} />

      {/* Lingkup + turun ke level berikutnya (setiap level punya bank soalnya sendiri) */}
      <section aria-label="Lingkup bank soal" className="flex flex-col gap-3">
        <nav aria-label="Lingkup" className="flex flex-wrap items-center gap-1.5 text-sm">
          <Link href={bankHref({})} className={scope ? "text-muted-foreground hover:text-foreground" : "font-semibold"}>
            Semua jenjang
          </Link>
          {path.map((n, i) => (
            <span key={n.code} className="flex items-center gap-1.5">
              <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
              <Link href={hrefFor(i + 1)} className={i === path.length - 1 ? "font-semibold" : "text-muted-foreground hover:text-foreground"}>
                {n.name.length > 50 ? `${n.name.slice(0, 50)}…` : n.name}
              </Link>
            </span>
          ))}
          {scope && (
            <span className="ml-2 text-xs text-muted-foreground tabular-nums">
              {scope.count.total} soal · {scope.count.published} tayang
              {scope.count.pending > 0 && ` · ${scope.count.pending} menunggu review`}
            </span>
          )}
        </nav>
        {children.length > 0 && (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {children.map((c) => (
              <li key={c.code}>
                <Link
                  href={hrefFor(path.length, c.code)}
                  className="surface-card flex h-full flex-col gap-2 p-4 transition-colors hover:border-primary/40"
                >
                  <span className="text-xs font-medium text-muted-foreground">{LEVEL_LABEL[path.length]}</span>
                  <span className="line-clamp-2 text-sm font-semibold">{c.name}</span>
                  <span className="mt-auto flex flex-wrap items-baseline gap-x-2 text-xs text-muted-foreground tabular-nums">
                    <span className={c.count.total ? "text-lg font-bold text-foreground" : "text-lg font-bold text-muted-foreground"}>
                      {c.count.total}
                    </span>
                    soal · {c.count.published} tayang
                    {c.count.pending > 0 && <span className="font-semibold text-warning-strong">· {c.count.pending} review</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="daftar-heading" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="daftar-heading" className="font-bold">
            {total} soal{scope ? ` di ${scope.name.length > 40 ? `${scope.name.slice(0, 40)}…` : scope.name}` : ""}
          </h2>
          {pages > 1 && (
            <span className="text-sm text-muted-foreground tabular-nums">
              Halaman {page} dari {pages}
            </span>
          )}
        </div>
        {rows.length === 0 ? (
          <div className="surface-card flex flex-col items-center gap-4 px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">Belum ada soal yang cocok dengan filter ini.</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button nativeButton={false} render={<Link href="/admin/soal/baru" />}>
                <Plus aria-hidden /> Tambah Soal
              </Button>
              <Button variant="outline" nativeButton={false} render={<Link href="/admin/soal/generate-ai" />}>
                <Sparkles aria-hidden /> Generate AI
              </Button>
              <Button variant="outline" nativeButton={false} render={<Link href="/admin/soal/import" />}>
                <FileUp aria-hidden /> Import Excel
              </Button>
            </div>
          </div>
        ) : (
          <QuestionList questions={rows} />
        )}
        {pages > 1 && (
          <nav aria-label="Halaman" className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} nativeButton={false} render={<Link href={bankHref({ ...filters, hal: page - 1 })} />}>
              <ChevronLeft aria-hidden /> Sebelumnya
            </Button>
            <Button variant="outline" size="sm" disabled={page >= pages} nativeButton={false} render={<Link href={bankHref({ ...filters, hal: page + 1 })} />}>
              Berikutnya <ChevronRight aria-hidden />
            </Button>
          </nav>
        )}
      </section>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <BookOpenText className="size-3.5" aria-hidden />
        Soal grup berbasis bacaan dikelola di{" "}
        <Link href="/admin/soal/stimulus" className="font-semibold text-primary hover:underline">
          Stimulus
        </Link>
        .
      </p>
    </div>
  );
}
