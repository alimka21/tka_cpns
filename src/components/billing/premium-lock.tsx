// Panel fitur Premium yang terkunci: menampilkan CONTOH tampilan (placeholder,
// bukan data asli) yang diburamkan + kartu ajakan upgrade. Data asli tidak
// pernah dikirim ke browser untuk akun gratis, jadi tidak bisa dibuka lewat
// "inspect element".

import Link from "next/link";
import { Check, Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Variant = "chart" | "bars" | "text";

function Placeholder({ variant }: { variant: Variant }) {
  if (variant === "chart") {
    return (
      <div className="grid gap-6 p-6 lg:grid-cols-[3fr_2fr]">
        <svg viewBox="0 0 300 300" className="mx-auto w-full max-w-xs">
          {[120, 90, 60, 30].map((r) => (
            <polygon key={r} points={hex(r)} fill="none" stroke="var(--border)" strokeWidth="1.5" />
          ))}
          <polygon points="150,55 232,108 220,205 150,236 92,180 84,100" fill="var(--primary)" fillOpacity="0.18" stroke="var(--primary)" strokeWidth="3" />
        </svg>
        <Bars />
      </div>
    );
  }
  if (variant === "bars") return <div className="p-6"><Bars rows={6} /></div>;
  return (
    <div className="flex flex-col gap-3 p-6">
      {[92, 100, 85, 96, 70].map((w, i) => (
        <div key={i} className="h-3.5 rounded-full bg-muted-foreground/25" style={{ width: `${w}%` }} />
      ))}
    </div>
  );
}

function Bars({ rows = 4 }: { rows?: number }) {
  const widths = [38, 72, 55, 88, 46, 64].slice(0, rows);
  return (
    <div className="flex flex-col justify-center gap-4">
      {widths.map((w, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="h-3 w-2/3 rounded-full bg-muted-foreground/25" />
          <div className="h-2.5 rounded-full bg-muted">
            <div className={cn("h-2.5 rounded-full", w < 50 ? "bg-destructive/70" : "bg-primary/70")} style={{ width: `${w}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function hex(r: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return `${Math.round(150 + r * Math.cos(a))},${Math.round(150 + r * Math.sin(a))}`;
  }).join(" ");
}

export function PremiumLock({
  title,
  description,
  benefits,
  variant = "text",
  ctaLabel = "Tingkatkan ke Premium",
  className,
  compact = false,
}: {
  title: string;
  description: React.ReactNode;
  benefits?: string[];
  variant?: Variant;
  ctaLabel?: string;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("surface-card relative overflow-hidden", className)}>
      <div aria-hidden className="pointer-events-none blur-[6px] select-none">
        <Placeholder variant={variant} />
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-card/40 p-4">
        <div className={cn("flex w-full flex-col items-center gap-3 rounded-2xl border border-cta/40 bg-card/95 p-5 text-center shadow-xl", compact ? "max-w-sm" : "max-w-md sm:p-6")}>
          <span className="flex size-11 items-center justify-center rounded-full bg-warning-soft text-warning-strong">
            <Lock className="size-5" aria-hidden />
          </span>
          <div>
            <h3 className="text-base font-bold sm:text-lg">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
          {benefits && benefits.length > 0 && !compact && (
            <ul className="flex flex-col gap-1.5 text-left text-sm">
              {benefits.map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-success-strong" aria-hidden /> {b}
                </li>
              ))}
            </ul>
          )}
          <Button variant="cta" className="w-full sm:w-auto" nativeButton={false} render={<Link href="/langganan" />}>
            <Crown aria-hidden /> {ctaLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Pengganti blok pembahasan di kartu soal untuk akun gratis. */
export function LockedExplanation() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-primary/15 bg-primary-soft">
      <div aria-hidden className="pointer-events-none flex flex-col gap-2.5 p-4 blur-[5px] select-none">
        <div className="h-3 w-24 rounded-full bg-primary/40" />
        {[96, 88, 92, 60].map((w, i) => (
          <div key={i} className="h-3 rounded-full bg-primary/20" style={{ width: `${w}%` }} />
        ))}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 text-center sm:flex-row sm:gap-4">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Lock className="size-4 text-warning-strong" aria-hidden /> Pembahasan lengkap khusus Premium
        </p>
        <Button size="sm" variant="cta" nativeButton={false} render={<Link href="/langganan" />}>
          <Crown aria-hidden /> Buka pembahasan
        </Button>
      </div>
    </div>
  );
}
