"use client";

import Link from "next/link";
import {
  Atom,
  BookOpen,
  BookOpenText,
  Calculator,
  Crown,
  FlaskConical,
  Gift,
  Globe2,
  Landmark,
  LayoutGrid,
  Languages,
  Leaf,
  Scale,
  Sigma,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Option = { code: string; name: string; jenjang: string; packageCount: number; doneCount: number };
export type PackageAccess = "semua" | "gratis" | "premium";

/** Ingat pilihan terakhir (dibaca server lewat cookie `mapel`). */
function remember(code: string) {
  document.cookie = code === "semua" ? "mapel=; path=/; max-age=0" : `mapel=${encodeURIComponent(code)}; path=/; max-age=31536000; samesite=lax`;
}

/** Ikon per mapel dari kode (mis. SMA-FIS, SMP-MTK-L). */
function subjectIcon(code: string): LucideIcon {
  const key = code.split("-")[1] ?? "";
  const icons: Record<string, LucideIcon> = {
    MTK: Sigma,
    BIND: BookOpenText,
    BING: Languages,
    FIS: Atom,
    KIM: FlaskConical,
    BIO: Leaf,
    EKO: TrendingUp,
    GEO: Globe2,
    SEJ: Landmark,
    SOS: Users,
    ANT: Users,
    PPKN: Scale,
    PKK: Calculator,
  };
  return icons[key] ?? (key.startsWith("B") ? Languages : BookOpen);
}

/** "Pendidikan Pancasila dan Kewarganegaraan/Pendidikan Pancasila" → nama terakhir. */
const shortName = (name: string) => name.split("/").pop()!.trim();

const ACCESS: { key: PackageAccess; label: string; icon?: LucideIcon }[] = [
  { key: "semua", label: "Semua paket" },
  { key: "gratis", label: "Gratis", icon: Gift },
  { key: "premium", label: "Premium", icon: Crown },
];

/**
 * Filter paket siswa: kartu Mata Pelajaran ("Semua" + mapel, dengan jumlah paket & tes
 * selesai) dan — bila `access` diberikan — jenis paket Gratis/Premium dalam satu panel.
 * Mapel disimpan di cookie `mapel` supaya halaman siswa lain ikut memakai mapel yang sama.
 */
export function SubjectFilter({
  options,
  selected,
  basePath,
  params = {},
  showJenjang = false,
  access,
}: {
  options: Option[];
  selected: string | null;
  basePath: string;
  /** Query lain yang dipertahankan (mis. jenis=latihan). */
  params?: Record<string, string | undefined>;
  showJenjang?: boolean;
  /** Filter Gratis/Premium (dashboard): nilai aktif + jumlah paket per jenis untuk mapel terpilih. */
  access?: { value: PackageAccess; counts: Record<PackageAccess, number> };
}) {
  if (options.length === 0) return null;
  const href = (patch: Record<string, string | undefined>) => {
    const q = new URLSearchParams(Object.entries({ ...params, ...patch }).filter((e): e is [string, string] => !!e[1]));
    return `${basePath}?${q}`;
  };
  const accessParam = access && access.value !== "semua" ? access.value : undefined;
  const total = { packages: options.reduce((n, o) => n + o.packageCount, 0), done: options.reduce((n, o) => n + o.doneCount, 0) };

  const card = (code: string, label: string, Icon: LucideIcon, packages: number, done: number, active: boolean) => (
    <Link
      key={code}
      href={href({ mapel: code, akses: accessParam })}
      onClick={() => remember(code)}
      aria-current={active ? "page" : undefined}
      scroll={false}
      className={cn(
        "flex w-40 shrink-0 snap-start flex-col gap-2 rounded-xl border bg-card p-3 text-left transition-colors hover:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/25 focus-visible:outline-none sm:w-auto",
        active && "border-primary bg-primary-soft ring-1 ring-primary",
      )}
    >
      <span className="flex items-center gap-2">
        <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
          <Icon className="size-4" aria-hidden />
        </span>
        <span className={cn("line-clamp-2 text-sm leading-tight font-semibold", active && "text-primary")}>{label}</span>
      </span>
      <span className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="tabular-nums">{packages} paket</span>
        {done > 0 && <span className="font-medium text-success-strong tabular-nums">{done} tes selesai</span>}
      </span>
    </Link>
  );

  return (
    <nav aria-label="Filter paket" className="surface-card flex flex-col gap-4 p-4 sm:p-5">
      <div className="flex flex-col gap-2.5">
        <span className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-muted-foreground uppercase">
          <BookOpen className="size-3.5" aria-hidden /> Mata pelajaran
        </span>
        <div className="-mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4 xl:grid-cols-5">
          {card("semua", "Semua mapel", LayoutGrid, total.packages, total.done, selected == null)}
          {options.map((o) =>
            card(o.code, showJenjang ? `${o.jenjang} · ${shortName(o.name)}` : shortName(o.name), subjectIcon(o.code), o.packageCount, o.doneCount, selected === o.code),
          )}
        </div>
      </div>
      {access && (
        <div className="flex flex-col gap-2.5 border-t pt-4 sm:flex-row sm:items-center sm:gap-4">
          <span className="text-xs font-bold tracking-wide text-muted-foreground uppercase">Jenis paket</span>
          <div role="group" aria-label="Jenis paket" className="inline-flex w-full rounded-lg bg-muted p-1 sm:w-auto">
            {ACCESS.map(({ key, label, icon: Icon }) => {
              const active = access.value === key;
              return (
                <Link
                  key={key}
                  href={href({ mapel: selected ?? "semua", akses: key === "semua" ? undefined : key })}
                  aria-current={active ? "page" : undefined}
                  scroll={false}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground sm:flex-none",
                    active && "bg-card text-foreground shadow-sm",
                  )}
                >
                  {Icon && <Icon className={cn("size-4", key === "premium" ? "text-cta" : "text-success-strong")} aria-hidden />}
                  {label} <span className="tabular-nums opacity-70">({access.counts[key]})</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
