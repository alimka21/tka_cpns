"use client";

import { GraduationCap } from "lucide-react";
import { JENJANG_OPTIONS, type Jenjang } from "@/lib/jenjang";
import { cn } from "@/lib/utils";

/** Pilihan jenjang berupa kartu radio. `name` diisi bila dipakai di dalam <form>. */
export function JenjangPicker({
  value,
  onChange,
  name,
  invalid,
}: {
  value: Jenjang | null;
  onChange: (v: Jenjang) => void;
  name?: string;
  invalid?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label="Jenjang" aria-invalid={invalid} className="grid grid-cols-3 gap-2">
      {JENJANG_OPTIONS.map((j) => (
        <button
          key={j.code}
          type="button"
          role="radio"
          aria-checked={value === j.code}
          onClick={() => onChange(j.code)}
          className={cn(
            "flex flex-col items-center gap-1 rounded-xl border bg-card px-2 py-3 text-center transition-colors hover:border-primary/40 focus-visible:ring-3 focus-visible:ring-ring/25 focus-visible:outline-none",
            value === j.code && "border-primary bg-primary-soft shadow-[0_0_0_1px_var(--primary)]",
            invalid && value == null && "border-destructive/60",
          )}
        >
          <GraduationCap className={cn("size-5 text-muted-foreground", value === j.code && "text-primary")} aria-hidden />
          <span className="text-sm font-bold">{j.code}</span>
          <span className="text-[11px] leading-tight text-muted-foreground">{j.hint}</span>
        </button>
      ))}
      {name && <input type="hidden" name={name} value={value ?? ""} />}
    </div>
  );
}
