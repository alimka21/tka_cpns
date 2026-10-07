import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenCheck, Clock, Eye, FileQuestion, Package, Plus, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { parseBankFilters } from "@/lib/bank-filters";
import { listCategories, listPackagesAdmin, listSubjects } from "@/server/queries/packages";
import { PackageAccessToggle, PackageStatusButton, DeletePackageButton } from "@/components/admin/package-list-actions";
import { cn } from "@/lib/utils";
import { PackageFilterBar, type PackageFilterJenjang } from "@/components/admin/package-filter-bar";

export const metadata: Metadata = { title: "Paket Tes" };
export const dynamic = "force-dynamic";

export default async function AdminPaketTesPage({ searchParams }: PageProps<"/admin/paket-tes">) {
  // Aturan konsistensi jenjang ⊃ mapel sama dengan filter Bank Soal.
  const sp = await searchParams;
  const { jenjang, mapel } = parseBankFilters(sp);
  const akses = sp.akses === "gratis" || sp.akses === "premium" ? sp.akses : null;
  const [all, categories, subjects] = await Promise.all([listPackagesAdmin({ jenjang, mapel }), listCategories(), listSubjects()]);
  const counts = { semua: all.length, gratis: all.filter((p) => !p.isPremium).length, premium: all.filter((p) => p.isPremium).length };
  const packages = akses ? all.filter((p) => (akses === "premium") === p.isPremium) : all;
  const tabHref = (a: string | null) => {
    const q = new URLSearchParams();
    if (jenjang) q.set("jenjang", jenjang);
    if (mapel) q.set("mapel", mapel);
    if (a) q.set("akses", a);
    const s = q.toString();
    return s ? `/admin/paket-tes?${s}` : "/admin/paket-tes";
  };
  const filterOptions: PackageFilterJenjang[] = categories.map((c) => ({
    code: c.code,
    name: c.name,
    subjects: subjects.filter((s) => s.categoryId === c.id).map((s) => ({ code: s.code, name: s.name })),
  }));
  const filtered = Boolean(jenjang || mapel || akses);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Paket Tes"
        description="Susun paket dari soal yang sudah tayang, atur durasi, dan tandai gratis atau premium."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" nativeButton={false} render={<Link href={jenjang ? `/admin/paket-tes/otomatis?jenjang=${jenjang}` : "/admin/paket-tes/otomatis"} />}>
              <Sparkles aria-hidden /> Buat Paket Otomatis
            </Button>
            <Button nativeButton={false} render={<Link href="/admin/paket-tes/baru" />}>
              <Plus aria-hidden /> Buat Paket
            </Button>
          </div>
        }
      />

      <PackageFilterBar options={filterOptions} jenjang={jenjang} mapel={mapel} />

      <nav aria-label="Saring akses paket" className="-mt-4 flex flex-wrap items-center gap-2">
        {([
          [null, "Semua", counts.semua],
          ["gratis", "Gratis", counts.gratis],
          ["premium", "Premium", counts.premium],
        ] as const).map(([key, label, n]) => (
          <Link
            key={label}
            href={tabHref(key)}
            aria-current={akses === key ? "page" : undefined}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
              akses === key ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label} <span className="tabular-nums opacity-80">({n})</span>
          </Link>
        ))}
        <span className="text-xs text-muted-foreground">Ubah akses langsung lewat tombol Gratis | Premium di tiap paket.</span>
      </nav>

      {packages.length === 0 && filtered ? (
        <div className="surface-card flex flex-col items-center gap-3 px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">Tidak ada paket untuk filter ini.</p>
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/admin/paket-tes" />}>
            Tampilkan semua paket
          </Button>
        </div>
      ) : packages.length === 0 ? (
        <div className="surface-card flex flex-col items-center gap-4 px-6 py-16 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <Package className="size-7" aria-hidden />
          </span>
          <div>
            <h2 className="text-lg font-bold">Belum ada paket tes</h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Buat paket pertama dari soal-soal yang sudah tayang di Bank Soal.
            </p>
          </div>
          <Button nativeButton={false} render={<Link href="/admin/paket-tes/baru" />}>
            <Plus aria-hidden /> Buat Paket
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {packages.map((pkg) => (
            <li key={pkg.id} className="surface-card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="info">{pkg.categoryCode}</Badge>
                  {pkg.subjectName && <Badge variant="muted">{pkg.subjectName}</Badge>}
                  <Badge variant={pkg.status === "published" ? "success" : "muted"}>{pkg.status === "published" ? "Tayang" : "Draft"}</Badge>
                </div>
                <Link href={`/admin/paket-tes/${pkg.id}`} className="mt-1 block text-base font-bold hover:underline">
                  {pkg.title}
                </Link>
                <dl className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <FileQuestion className="size-4" aria-hidden /> {pkg.questionCount} soal
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-4" aria-hidden /> {pkg.durationMinutes} menit
                  </span>
                </dl>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <PackageAccessToggle id={pkg.id} isPremium={pkg.isPremium} title={pkg.title} />
                <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/admin/paket-tes/${pkg.id}/pratinjau`} />}>
                  <Eye aria-hidden /> Pratinjau
                </Button>
                <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/admin/paket-tes/${pkg.id}`} />}>
                  <BookOpenCheck aria-hidden /> Kelola
                </Button>
                <PackageStatusButton id={pkg.id} status={pkg.status} />
                <DeletePackageButton id={pkg.id} title={pkg.title} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
