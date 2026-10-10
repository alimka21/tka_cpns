"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

type Option = { code: string; name: string; jenjang: string };

/** Ingat pilihan terakhir (dibaca server lewat cookie `mapel`). */
function remember(code: string) {
  document.cookie = code === "semua" ? "mapel=; path=/; max-age=0" : `mapel=${encodeURIComponent(code)}; path=/; max-age=31536000; samesite=lax`;
}

/**
 * Chip filter Mata Pelajaran ("Semua" + mapel). Pilihan disimpan di cookie
 * `mapel` supaya halaman siswa lain ikut memakai mapel yang sama.
 */
export function SubjectFilter({
  options,
  selected,
  basePath,
  params = {},
  showJenjang = false,
}: {
  options: Option[];
  selected: string | null;
  basePath: string;
  /** Query lain yang dipertahankan (mis. jenis=latihan). */
  params?: Record<string, string | undefined>;
  showJenjang?: boolean;
}) {
  if (options.length === 0) return null;
  const href = (code: string) => {
    const q = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => !!e[1]));
    q.set("mapel", code);
    return `${basePath}?${q}`;
  };
  const chip = (code: string, label: string, active: boolean) => (
    <Link
      key={code}
      href={href(code)}
      onClick={() => remember(code)}
      aria-current={active ? "page" : undefined}
      className={cn(
        "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
      )}
    >
      {label}
    </Link>
  );
  return (
    <nav aria-label="Filter mata pelajaran" className="flex flex-col gap-2">
      <span className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-muted-foreground uppercase">
        <BookOpen className="size-3.5" aria-hidden /> Mata pelajaran
      </span>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {chip("semua", "Semua", selected == null)}
        {options.map((o) => chip(o.code, showJenjang ? `${o.jenjang} · ${o.name}` : o.name, selected === o.code))}
      </div>
    </nav>
  );
}
