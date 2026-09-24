"use client";

import { useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type BrowserSubdomain = {
  code: string;
  name: string;
  description: string | null;
  competencies: string[];
  scope: string[];
  limits: string | null;
};

export type BrowserFramework = {
  jenjang: string;
  jenjangName: string;
  regulation: string;
  electiveCount: number | null;
  subjects: {
    code: string;
    name: string;
    type: "wajib" | "pilihan";
    structure: "kompetensi_subkompetensi" | "elemen_subelemen";
    levels: string[];
    domains: { code: string; name: string; subdomains: BrowserSubdomain[] }[];
  }[];
};

export function FrameworkBrowser({ frameworks }: { frameworks: BrowserFramework[] }) {
  const [jenjang, setJenjang] = useState(frameworks[0].jenjang);
  const [query, setQuery] = useState("");
  const fw = frameworks.find((f) => f.jenjang === jenjang)!;
  const q = query.trim().toLowerCase();
  const matches = (s: BrowserSubdomain) => q === "" || s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);

  const subjects = fw.subjects
    .map((subject) => ({
      ...subject,
      domains: subject.domains
        .map((d) => ({ ...d, subdomains: d.subdomains.filter(matches) }))
        .filter((d) => d.subdomains.length > 0),
    }))
    .filter((s) => s.domains.length > 0);
  const total = subjects.reduce((n, s) => n + s.domains.reduce((m, d) => m + d.subdomains.length, 0), 0);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div role="tablist" aria-label="Jenjang" className="flex gap-1 rounded-xl bg-muted p-1">
          {frameworks.map((f) => (
            <button
              key={f.jenjang}
              role="tab"
              type="button"
              aria-selected={f.jenjang === jenjang}
              onClick={() => setJenjang(f.jenjang)}
              className={cn(
                "flex-1 rounded-lg px-5 py-2 text-sm font-semibold text-muted-foreground transition-colors md:flex-none",
                f.jenjang === jenjang && "bg-card text-primary shadow-sm",
              )}
            >
              {f.jenjang}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari kode atau nama subdomain, mis. SMP-MTK-D1 atau pecahan…"
            aria-label="Cari subdomain"
            className="pl-10"
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {fw.jenjangName} · Kerangka BSKAP No. {fw.regulation}
        {fw.electiveCount != null && ` · Peserta mengerjakan semua mata uji wajib + ${fw.electiveCount} pilihan`}
        {q && ` · ${total} subdomain cocok`}
      </p>

      {subjects.length === 0 && (
        <p className="surface-card px-6 py-12 text-center text-sm text-muted-foreground">Tidak ada subdomain yang cocok.</p>
      )}

      <div className="flex flex-col gap-3">
        {subjects.map((subject) => (
          <details key={`${jenjang}-${subject.code}`} open={q !== "" || fw.subjects.length <= 2} className="surface-card group overflow-hidden">
            <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 p-5 hover:bg-muted/40">
              <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
              <span className="font-bold">{subject.name}</span>
              <span className="font-mono text-xs text-muted-foreground">{subject.code}</span>
              <span className="ml-auto flex flex-wrap gap-1.5">
                <Badge variant={subject.type === "wajib" ? "info" : "muted"}>{subject.type === "wajib" ? "Wajib" : "Pilihan"}</Badge>
                {subject.levels.length > 0 ? (
                  <Badge variant="outline">Level {subject.levels.join(" · ")}</Badge>
                ) : (
                  <Badge variant="outline">Struktur kompetensi</Badge>
                )}
              </span>
            </summary>
            <div className="flex flex-col gap-5 border-t px-5 py-5">
              {subject.domains.map((domain) => (
                <section key={domain.code}>
                  <h3 className="flex flex-wrap items-baseline gap-2 text-sm font-bold">
                    {domain.name}
                    <span className="font-mono text-xs font-normal text-muted-foreground">{domain.code}</span>
                  </h3>
                  <ul className="mt-2 flex flex-col divide-y rounded-xl border">
                    {domain.subdomains.map((sub) => (
                      <SubdomainRow key={sub.code} sub={sub} />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

function SubdomainRow({ sub }: { sub: BrowserSubdomain }) {
  const hasDetail = sub.description || sub.competencies.length > 0 || sub.scope.length > 0 || sub.limits;
  const head = (
    <>
      <span className="w-32 shrink-0 font-mono text-xs font-semibold text-primary">{sub.code}</span>
      <span className="flex-1 text-sm">{sub.name}</span>
    </>
  );
  if (!hasDetail) return <li className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-baseline sm:gap-4">{head}</li>;
  return (
    <li>
      <details className="group/sub">
        <summary className="flex cursor-pointer list-none flex-col gap-1 px-4 py-3 hover:bg-muted/40 sm:flex-row sm:items-baseline sm:gap-4">
          {head}
          <span className="text-xs font-semibold text-primary group-open/sub:hidden">Detail</span>
        </summary>
        <div className="flex flex-col gap-3 bg-muted/30 px-4 py-3 text-sm sm:pl-40">
          {sub.description && <p className="text-muted-foreground">{sub.description}</p>}
          {sub.competencies.length > 0 && <DetailList title="Kompetensi" items={sub.competencies} />}
          {sub.scope.length > 0 && <DetailList title="Cakupan" items={sub.scope} />}
          {sub.limits && (
            <div>
              <div className="text-xs font-bold tracking-wide text-muted-foreground uppercase">Batasan</div>
              <p className="mt-1">{sub.limits}</p>
            </div>
          )}
        </div>
      </details>
    </li>
  );
}

function DetailList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="text-xs font-bold tracking-wide text-muted-foreground uppercase">{title}</div>
      <ul className="mt-1 list-disc pl-5">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
