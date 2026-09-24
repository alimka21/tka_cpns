import { describe, expect, it } from "vitest";
import { buildGenerationContext } from "./generation-context";

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
