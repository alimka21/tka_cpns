import { describe, expect, it } from "vitest";
import { cleanPackageDescription, needsDescriptionCleanup } from "./package-description";

describe("cleanPackageDescription", () => {
  it("membuang atribusi & catatan tinjauan", () => {
    expect(cleanPackageDescription("Disusun Claude: 30 soal baru, 6 bacaan × 5 soal (3 teks informasi, 2 cerita, 1 puisi). Tinjau sebelum terbit.", 30)).toBe(
      "30 soal, 6 bacaan × 5 soal (3 teks informasi, 2 cerita, 1 puisi).",
    );
  });
  it("menjumlahkan soal variasi + soal baru", () => {
    expect(cleanPackageDescription("Disusun Claude: 15 soal variasi dari soal bank + 15 soal baru, 6 bacaan. Tinjau sebelum terbit.", 30)).toBe("30 soal, 6 bacaan.");
  });
  it("catatan perbaikan internal → deskripsi umum", () => {
    const d = "Dibuat otomatis (Gemini, 7 grup bacaan), ditinjau & diperbaiki Claude: fakta spesies, hubungan tokoh, kunci kata serapan, +1 soal Kategori. Tinjau sebelum terbit.";
    expect(cleanPackageDescription(d, 30)).toBe("30 soal lengkap dengan pembahasan.");
  });
  it("teks bawaan builder otomatis", () => {
    const d = "Disusun otomatis dari bank soal + tambahan AI — tinjau soal berstatus menunggu tinjauan sebelum terbit.";
    expect(needsDescriptionCleanup(d)).toBe(true);
    expect(cleanPackageDescription(d, 25)).toBe("25 soal lengkap dengan pembahasan.");
  });
  it("tanpa nama AI: hanya catatan tinjauan yang dibuang", () => {
    expect(cleanPackageDescription("Dari soal TKA Biologi (Pilihan) SMA 2025 + 3 soal MCMA/Kategori tambahan. Kunci & pembahasan disusun ulang — tinjau sebelum terbit.", 25)).toBe(
      "Dari soal TKA Biologi (Pilihan) SMA 2025 + 3 soal MCMA/Kategori tambahan.",
    );
    expect(cleanPackageDescription("Dari soal TKA Fisika (Pilihan) SMA + 6 soal MCMA/Kategori tambahan (1 grup stimulus baru). Tinjau soal tambahan sebelum terbit.", 25)).toBe(
      "Dari soal TKA Fisika (Pilihan) SMA + 6 soal MCMA/Kategori tambahan (1 grup stimulus baru).",
    );
  });
  it("deskripsi bersih tidak ditandai", () => {
    expect(needsDescriptionCleanup("30 soal, 6 bacaan.")).toBe(false);
  });
});
