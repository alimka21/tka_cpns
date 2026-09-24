import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description?: React.ReactNode;
  /** Tombol aksi di kanan (desktop) / bawah judul (mobile). */
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, description, actions, className }: Props) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight sm:text-[1.75rem]">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Penanda halaman yang masih memakai data contoh (belum tersambung database). */
export function DemoDataNotice({ children }: { children?: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-warning/60 bg-warning-soft px-4 py-2.5 text-sm text-warning-strong">
      {children ?? "Data di halaman ini masih contoh — belum tersambung ke database."}
    </p>
  );
}

/** Placeholder rapi untuk fitur yang belum dibangun. */
export function ComingSoon({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="surface-card flex flex-col items-center gap-4 px-6 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">{icon}</span>
      <div>
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{children}</p>
      </div>
    </div>
  );
}
