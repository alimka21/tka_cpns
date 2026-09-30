import { describe, expect, it } from "vitest";
import { buildAiPrompt, buildGenerationContext } from "./generation-context";

describe("buildGenerationContext", () => {
  it("menyertakan cakupan, batasan, dan level kognitif subdomain matematika", () => {
    const ctx = buildGenerationContext({ subdomainCode: "SMP-MTK-D1-S1", cognitiveLevel: "L2", difficulty: "medium", count: 5 });
    expect(ctx.ok).toBe(true);
    if (!ctx.ok) return;
    expect(ctx.prompt).toContain("Bilangan Real (SMP-MTK-D1-S1)");
    expect(ctx.prompt).toContain("Faktorisasi prima bilangan asli");
    expect(ctx.prompt).toContain("TIDAK BOLEH keluar");
    expect(ctx.prompt).toContain("Level kognitif target: L2");
    expect(ctx.prompt).toContain("Buat 5 soal");
  });

  it("mewajibkan level kognitif untuk mata uji yang memilikinya", () => {
    const ctx = buildGenerationContext({ subdomainCode: "SMP-MTK-D1-S1", difficulty: "easy", count: 1 });
    expect(ctx).toMatchObject({ ok: false });
    if (!ctx.ok) expect(ctx.error).toMatch(/L1/);
  });

  it("menolak level kognitif untuk mata uji bahasa & memakai karakteristik teks", () => {
    expect(buildGenerationContext({ subdomainCode: "SD-BIND-D1-S4", cognitiveLevel: "L1", difficulty: "easy", count: 1 }).ok).toBe(false);
    const ctx = buildGenerationContext({ subdomainCode: "SD-BIND-D1-S4", difficulty: "easy", count: 3 });
    expect(ctx.ok).toBe(true);
    if (ctx.ok) {
      expect(ctx.level).toBeNull();
      expect(ctx.prompt).toContain("Subkompetensi: Mengidentifikasi informasi tersurat dalam teks.");
      expect(ctx.prompt).toContain("karakteristik_teks");
    }
  });

  it("menolak kode yang tidak dikenal", () => {
    expect(buildGenerationContext({ subdomainCode: "SMA-XYZ-D1-S1", difficulty: "hard", count: 1 }).ok).toBe(false);
  });
});

describe("buildAiPrompt", () => {
  const base = { subdomainCode: "SMP-MTK-D1-S1", difficulty: "medium" as const, count: 3, cognitiveLevel: "L2" };

  it("mode variasi menyertakan soal asal, gaya variasi, & format JSON bentuknya", () => {
    const r = buildAiPrompt({
      ...base,
      form: "pgk_mcma",
      mode: "variasi",
      variation: "konteks",
      source: {
        type: "pgk_mcma",
        questionText: "Manakah bilangan prima?",
        categoryLabels: null,
        explanation: "23 dan 29 prima.",
        options: [
          { label: "A", optionText: "21", isCorrect: false, correctCategory: null },
          { label: "B", optionText: "23", isCorrect: true, correctCategory: null },
        ],
      },
    });
    if (!r.ok) throw new Error(r.error);
    expect(r.prompt).toContain("Manakah bilangan prima?");
    expect(r.prompt).toContain("B. 23 (KUNCI)");
    expect(r.prompt).toContain("Ganti konteks");
    expect(r.prompt).toContain("multi jawaban");
    expect(r.prompt).toContain('"isCorrect":true');
    expect(r.prompt).toContain("tepat 3");
  });

  it("mode gambar & kategori", () => {
    const r = buildAiPrompt({ ...base, form: "pgk_kategori", mode: "gambar", imageNote: "grafik batang penjualan" });
    if (!r.ok) throw new Error(r.error);
    expect(r.prompt).toContain("Gambar terlampir");
    expect(r.prompt).toContain("grafik batang penjualan");
    expect(r.prompt).toContain('"categoryLabels"');
  });

  it("tetap memvalidasi level kognitif", () => {
    expect(buildAiPrompt({ ...base, cognitiveLevel: null, form: "pg", mode: "baru" }).ok).toBe(false);
  });
});

describe("buildAiPrompt mode grup", () => {
  const base = { subdomainCode: "SMP-BIND-D1-S3", difficulty: "medium" as const, count: 4, cognitiveLevel: null };
  it("bacaan baru: minta field stimulus & type campuran", () => {
    const r = buildAiPrompt({ ...base, form: "campuran", mode: "grup" });
    if (!r.ok) throw new Error(r.error);
    expect(r.prompt).toContain("tulis bacaan/stimulus baru");
    expect(r.prompt).toContain('"stimulus"');
    expect(r.prompt).toContain('field "type"');
  });
  it("stimulus yang ada: isi bacaan disertakan", () => {
    const r = buildAiPrompt({ ...base, form: "pg", mode: "grup", stimulus: { title: "Hutan Bakau", content: "Hutan bakau melindungi pantai dari abrasi." } });
    if (!r.ok) throw new Error(r.error);
    expect(r.prompt).toContain("Hutan bakau melindungi pantai");
    expect(r.prompt).not.toContain("tulis bacaan/stimulus baru");
  });
});
