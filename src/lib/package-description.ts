// Deskripsi paket tes tampil ke siswa di kartu paket — tidak boleh memuat catatan
// internal penyusunan (nama model AI, "tinjau sebelum terbit", "soal bank").

/** Nama alat/AI yang tidak boleh muncul di teks untuk siswa. */
export const INTERNAL_TOOL_PATTERN = /\b(claude|gemini|anthropic|openai|chatgpt|gpt-?\d*)\b/i;

/**
 * Bersihkan deskripsi paket menjadi kalimat untuk siswa. `questionCount` dipakai
 * bila setelah dibersihkan tidak tersisa keterangan isi paket.
 */
export function cleanPackageDescription(desc: string, questionCount: number): string {
  const attributed = /^[^:]*\b(claude|gemini|anthropic|openai|chatgpt|AI)\b[^:]*:/i.test(desc);
  let s = desc
    // Catatan tinjauan admin.
    .replace(/\s*(—\s*)?Tinjau( soal[^.]*)? sebelum terbit\.?/gi, "")
    .replace(/\s*—\s*tinjau[^.]*\.?/gi, "")
    .replace(/\s*Kunci & pembahasan disusun ulang\.?/gi, "")
    // Atribusi penyusun di depan, mis. "Disusun Claude:" / "Dibuat otomatis (Gemini, …), ditinjau & diperbaiki Claude:".
    .replace(/^[^:]*\b(claude|gemini|anthropic|openai|chatgpt|AI)\b[^:]*:\s*/i, "")
    // "15 soal variasi dari soal bank + 15 soal baru" → "30 soal".
    .replace(/(\d+) soal variasi dari soal bank \+ (\d+) soal baru/gi, (_, a, b) => `${Number(a) + Number(b)} soal`)
    .trim();
  if (attributed) s = s.replace(/\bsoal baru\b/gi, "soal");
  // Sisa yang bukan keterangan isi (mis. daftar perbaikan internal) → deskripsi umum.
  if (!s || INTERNAL_TOOL_PATTERN.test(s) || /tambahan AI/i.test(s) || (attributed && !/^\d/.test(s))) s = `${questionCount} soal lengkap dengan pembahasan.`;
  s = s.replace(/\s+/g, " ").replace(/[,;]\s*$/, "");
  if (!/[.!?)]$/.test(s)) s += ".";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Perlu dibersihkan? (dipakai skrip & validasi impor) */
export function needsDescriptionCleanup(desc: string | null | undefined) {
  return !!desc && (INTERNAL_TOOL_PATTERN.test(desc) || /tinjau|soal bank|tambahan AI/i.test(desc));
}
