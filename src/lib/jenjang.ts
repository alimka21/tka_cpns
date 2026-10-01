// Jenjang siswa (SD/SMP/SMA) — menentukan paket tes, soal & kerangka asesmen.

export const JENJANG_OPTIONS = [
  { code: "SD", label: "SD / MI", hint: "Kelas 6 — TKA SD" },
  { code: "SMP", label: "SMP / MTs", hint: "Kelas 9 — TKA SMP" },
  { code: "SMA", label: "SMA / MA / SMK", hint: "Kelas 12 — TKA SMA" },
] as const;

export type Jenjang = (typeof JENJANG_OPTIONS)[number]["code"];

export const JENJANG_LABEL: Record<Jenjang, string> = Object.fromEntries(JENJANG_OPTIONS.map((j) => [j.code, j.label])) as Record<Jenjang, string>;
