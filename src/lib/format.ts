// Helper tampilan bersama (tanggal & kategori skor) — dipakai lintas halaman.

const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
});

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

export function formatDateTime(iso: string) {
  return `${dateTimeFormatter.format(new Date(iso))} WIB`;
}

export function formatDate(iso: string) {
  return dateFormatter.format(new Date(iso));
}

export type ScoreTone = { variant: "success" | "warning" | "danger"; label: string };

/**
 * Kategori penguasaan untuk skor/persentase 0–100 (docs/UI_UX.md §3):
 * ≥75 baik, 50–74 cukup, <50 perlu latihan.
 */
export function scoreTone(percentage: number): ScoreTone {
  if (percentage >= 75) return { variant: "success", label: "Baik" };
  if (percentage >= 50) return { variant: "warning", label: "Cukup" };
  return { variant: "danger", label: "Perlu latihan" };
}
