import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string;
  unit?: string;
  icon: LucideIcon;
  hint?: React.ReactNode;
  tone?: "primary" | "cta" | "success" | "muted";
};

const toneClass = {
  primary: "bg-primary-soft text-primary",
  cta: "bg-warning-soft text-warning-strong",
  success: "bg-success-soft text-success",
  muted: "bg-muted text-muted-foreground",
};

export function StatCard({ label, value, unit, icon: Icon, hint, tone = "primary" }: Props) {
  return (
    <div className="surface-card flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className={cn("flex size-9 items-center justify-center rounded-lg", toneClass[tone])}>
          <Icon className="size-[18px]" aria-hidden />
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-bold tracking-tight">{value}</span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
