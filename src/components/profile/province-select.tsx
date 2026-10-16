import { ChevronDown, MapPin } from "lucide-react";
import { PROVINCES } from "@/lib/provinces";
import { cn } from "@/lib/utils";

/**
 * Dropdown provinsi (select native — nyaman di HP untuk 38 pilihan & langsung
 * terbaca FormData). Gaya mengikuti komponen Input.
 */
export function ProvinceSelect({
  id,
  name,
  value,
  defaultValue,
  onChange,
  invalid,
  describedBy,
  allowEmpty = false,
}: {
  id: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  invalid?: boolean;
  describedBy?: string;
  /** Isian opsional: "Pilih provinsi" bisa dipilih lagi untuk mengosongkan. */
  allowEmpty?: boolean;
}) {
  return (
    <div className="relative">
      <MapPin
        className={cn("pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground", invalid && "text-destructive")}
        aria-hidden
      />
      <select
        id={id}
        name={name}
        value={value}
        defaultValue={value === undefined ? (defaultValue ?? "") : undefined}
        onChange={(e) => onChange?.(e.target.value)}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className="h-10 w-full appearance-none rounded-lg border border-input bg-card pr-10 pl-10 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30"
      >
        <option value="" disabled={!allowEmpty}>
          {allowEmpty ? "— Tidak diisi —" : "Pilih provinsi"}
        </option>
        {PROVINCES.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
    </div>
  );
}
