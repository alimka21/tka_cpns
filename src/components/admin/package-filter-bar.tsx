"use client";

import { useRouter } from "next/navigation";

export type PackageFilterJenjang = { code: string; name: string; subjects: { code: string; name: string }[] };

const selectClass =
  "h-10 w-full min-w-0 rounded-lg border border-input bg-card px-3 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15 focus-visible:outline-none disabled:opacity-50";

export function packagesHref(filters: { jenjang?: string; mapel?: string }) {
  const qs = new URLSearchParams();
  if (filters.jenjang) qs.set("jenjang", filters.jenjang);
  if (filters.mapel) qs.set("mapel", filters.mapel);
  const s = qs.toString();
  return s ? `/admin/paket-tes?${s}` : "/admin/paket-tes";
}

/** Filter daftar paket: jenjang → mata pelajaran (mengganti jenjang mengosongkan mapel). */
export function PackageFilterBar({ options, jenjang, mapel }: { options: PackageFilterJenjang[]; jenjang?: string; mapel?: string }) {
  const router = useRouter();
  const current = options.find((j) => j.code === jenjang);

  return (
    <div className="surface-card grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
      <select
        aria-label="Jenjang"
        className={selectClass}
        value={jenjang ?? ""}
        onChange={(e) => router.push(packagesHref({ jenjang: e.target.value || undefined }))}
      >
        <option value="">Semua jenjang</option>
        {options.map((j) => (
          <option key={j.code} value={j.code}>
            {j.name}
          </option>
        ))}
      </select>
      <select
        aria-label="Mata pelajaran"
        className={selectClass}
        disabled={!current}
        value={mapel ?? ""}
        onChange={(e) => router.push(packagesHref({ jenjang, mapel: e.target.value || undefined }))}
      >
        <option value="">{current ? "Semua mata pelajaran" : "Pilih jenjang dulu"}</option>
        {current?.subjects.map((s) => (
          <option key={s.code} value={s.code}>
            {s.name}
          </option>
        ))}
      </select>
    </div>
  );
}
