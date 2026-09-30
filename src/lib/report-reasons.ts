// Label alasan laporan soal (siswa → admin). Nilai sama dengan enum DB.

export const REPORT_REASON_LABEL = {
  kunci_salah: "Kunci jawaban salah",
  soal_ambigu: "Soal ambigu / membingungkan",
  di_luar_materi: "Di luar materi",
  salah_ketik: "Salah ketik / rumus rusak",
  lainnya: "Lainnya",
} as const;

export type ReportReasonKey = keyof typeof REPORT_REASON_LABEL;
