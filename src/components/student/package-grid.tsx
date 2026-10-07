"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, Crown, FileQuestion, Gift, Lock, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { StudentPackageRow } from "@/server/queries/packages";
import { cn } from "@/lib/utils";

const ALL = "Semua";
type Access = "semua" | "gratis" | "premium";

const chip = (active: boolean) =>
  cn(
    "flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/25 focus-visible:outline-none",
    active && "border-primary bg-primary text-primary-foreground hover:text-primary-foreground",
  );

export function PackageGrid({ packages }: { packages: StudentPackageRow[] }) {
  const jenjangs = [ALL, ...new Set(packages.map((p) => p.categoryCode))];
  const [jenjang, setJenjang] = useState(ALL);
  const [access, setAccess] = useState<Access>("semua");
  const byJenjang = jenjang === ALL ? packages : packages.filter((p) => p.categoryCode === jenjang);
  const counts = { semua: byJenjang.length, gratis: byJenjang.filter((p) => !p.isPremium).length, premium: byJenjang.filter((p) => p.isPremium).length };
  const visible = access === "semua" ? byJenjang : byJenjang.filter((p) => (access === "premium") === p.isPremium);
  const lockedCount = byJenjang.filter((p) => p.isPremium && !p.unlocked).length;

  if (packages.length === 0) {
    return (
      <div className="surface-card px-6 py-12 text-center text-sm text-muted-foreground">
        Belum ada paket tes yang diterbitkan. Cek lagi nanti ya.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <div role="group" aria-label="Saring jenis paket" className="flex flex-wrap gap-2">
          <button type="button" aria-pressed={access === "semua"} onClick={() => setAccess("semua")} className={chip(access === "semua")}>
            Semua <span className="tabular-nums opacity-80">({counts.semua})</span>
          </button>
          <button type="button" aria-pressed={access === "gratis"} onClick={() => setAccess("gratis")} className={chip(access === "gratis")}>
            <Gift className="size-4" aria-hidden /> Gratis <span className="tabular-nums opacity-80">({counts.gratis})</span>
          </button>
          <button type="button" aria-pressed={access === "premium"} onClick={() => setAccess("premium")} className={chip(access === "premium")}>
            <Crown className="size-4" aria-hidden /> Premium <span className="tabular-nums opacity-80">({counts.premium})</span>
          </button>
        </div>
        {jenjangs.length > 2 && (
          <div role="group" aria-label="Filter jenjang" className="flex flex-wrap gap-2">
            {jenjangs.map((j) => (
              <button key={j} type="button" aria-pressed={jenjang === j} onClick={() => setJenjang(j)} className={chip(jenjang === j)}>
                {j}
              </button>
            ))}
          </div>
        )}
      </div>

      {access !== "gratis" && lockedCount > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-cta/40 bg-warning-soft p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-sm font-semibold text-warning-strong">
            <Crown className="size-4 shrink-0" aria-hidden /> {lockedCount} paket Premium masih terkunci — buka semuanya dengan langganan Premium.
          </p>
          <Button size="sm" variant="cta" nativeButton={false} render={<Link href="/langganan" />}>
            Lihat Premium
          </Button>
        </div>
      )}

      {visible.length === 0 ? (
        <p className="surface-card px-6 py-10 text-center text-sm text-muted-foreground">
          Belum ada paket {access === "premium" ? "Premium" : "Gratis"} untuk pilihan ini.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      )}
    </div>
  );
}

function PackageCard({ pkg }: { pkg: StudentPackageRow }) {
  const locked = pkg.isPremium && !pkg.unlocked;
  return (
    <article
      className={cn(
        "surface-card flex flex-col gap-4 border-t-4 p-5",
        pkg.isPremium ? "border-t-cta" : "border-t-success",
        locked && "bg-muted/40",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        {pkg.isPremium ? (
          <Badge variant="warning">
            {locked ? <Lock aria-hidden /> : <Crown aria-hidden />}
            {locked ? "Premium · terkunci" : "Premium"}
          </Badge>
        ) : (
          <Badge variant="success">
            <Gift aria-hidden /> Gratis
          </Badge>
        )}
        <Badge variant="info">{pkg.categoryCode}</Badge>
      </div>
      <div className="flex-1">
        <h3 className="text-base leading-snug font-bold">{pkg.title}</h3>
        {pkg.description && <p className="mt-1.5 text-sm text-muted-foreground">{pkg.description}</p>}
      </div>
      <dl className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <FileQuestion className="size-4" aria-hidden />
          <dt className="sr-only">Jumlah soal</dt>
          <dd>{pkg.questionCount} soal</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="size-4" aria-hidden />
          <dt className="sr-only">Durasi</dt>
          <dd>{pkg.durationMinutes} menit</dd>
        </div>
        {pkg.lastScore != null && (
          <div className="ml-auto">
            <dt className="sr-only">Skor terakhir</dt>
            <dd className="font-semibold text-foreground">Skor terakhir {pkg.lastScore}</dd>
          </div>
        )}
      </dl>
      {locked ? (
        <Button variant="cta" className="w-full" nativeButton={false} render={<Link href="/langganan" />}>
          <Crown aria-hidden /> Buka dengan Premium
        </Button>
      ) : (
        <Button nativeButton={false} className="w-full" render={<Link href={`/tes/${pkg.id}`} />}>
          <Play aria-hidden /> Mulai Tes
        </Button>
      )}
    </article>
  );
}
