"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, FileQuestion, Lock, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DemoPackage } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

const ALL = "Semua";

export function PackageGrid({ packages }: { packages: DemoPackage[] }) {
  const subjects = [ALL, ...new Set(packages.map((p) => p.subject))];
  const [subject, setSubject] = useState(ALL);
  const visible = subject === ALL ? packages : packages.filter((p) => p.subject === subject);

  return (
    <div className="flex flex-col gap-5">
      <div role="group" aria-label="Filter mata pelajaran" className="flex flex-wrap gap-2">
        {subjects.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={subject === s}
            onClick={() => setSubject(s)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/25 focus-visible:outline-none",
              subject === s && "border-primary bg-primary text-primary-foreground hover:text-primary-foreground",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((pkg) => (
          <PackageCard key={pkg.id} pkg={pkg} />
        ))}
      </div>
    </div>
  );
}

function PackageCard({ pkg }: { pkg: DemoPackage }) {
  const locked = pkg.isPremium && !pkg.unlocked;
  return (
    <article className={cn("surface-card flex flex-col gap-4 p-5", locked && "bg-muted/40")}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="info">
          {pkg.jenjang} · {pkg.subject}
        </Badge>
        {pkg.isPremium ? (
          <Badge variant={locked ? "danger" : "warning"}>
            {locked && <Lock aria-hidden />}
            {locked ? "Premium terkunci" : "Premium"}
          </Badge>
        ) : (
          <Badge variant="success">Gratis</Badge>
        )}
      </div>
      <div className="flex-1">
        <h3 className="text-base leading-snug font-bold">{pkg.title}</h3>
        <p className="mt-1.5 text-sm text-muted-foreground">{pkg.description}</p>
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
        <Button variant="outline" disabled className="w-full">
          <Lock aria-hidden /> Minta akses premium ke admin
        </Button>
      ) : (
        // TODO: arahkan ke /tes/[packageId] setelah attempt tersambung database.
        <Button nativeButton={false} className="w-full" render={<Link href="/tes/demo" />}>
          <Play aria-hidden /> Mulai Tes
        </Button>
      )}
    </article>
  );
}
