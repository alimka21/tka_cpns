import { describe, expect, it } from "vitest";
import { DEFAULT_SCORING_CONVERSION, conversionIssues, conversionVersion, scoringConversionSchema } from "@/lib/scoring-config";
import { achievementCategory, isIstimewa, toScaledScore, type ThresholdRow } from "./scoring";

const sma = DEFAULT_SCORING_CONVERSION.scales["200_800"];
const sd = DEFAULT_SCORING_CONVERSION.scales["0_100"];

describe("toScaledScore — rumus default (linear)", () => {
  it("SMA/SMK: 0 benar tetap 200, semua benar 800", () => {
    expect(toScaledScore(0, 25, sma)).toBe("200.00");
    expect(toScaledScore(25, 25, sma)).toBe("800.00");
  });

  it("SD/SMP: skala 0–100", () => {
    expect(toScaledScore(0, 30, sd)).toBe("0.00");
    expect(toScaledScore(30, 30, sd)).toBe("100.00");
    expect(toScaledScore(15, 30, sd)).toBe("50.00");
  });

  it("dua skala tidak tertukar untuk skor mentah yang sama", () => {
    expect(toScaledScore(18, 25, sd)).toBe("72.00");
    expect(toScaledScore(18, 25, sma)).toBe("632.00");
  });

  it("dibulatkan tepat 2 desimal (setengah ke atas) tanpa galat float", () => {
    // 1/3 × 100 = 33,333… → 33.33 ; 2/3 × 100 = 66,666… → 66.67
    expect(toScaledScore(1, 3, sd)).toBe("33.33");
    expect(toScaledScore(2, 3, sd)).toBe("66.67");
    // 200 + 7/30 × 600 = 340 tepat; 200 + 1/7 × 600 = 285,714… → 285.71
    expect(toScaledScore(7, 30, sma)).toBe("340.00");
    expect(toScaledScore(1, 7, sma)).toBe("285.71");
    // 1/8 × 100 = 12,5 → "12.50"
    expect(toScaledScore(1, 8, sd)).toBe("12.50");
  });

  it("paket tanpa soal → batas bawah; skor di luar rentang dijepit", () => {
    expect(toScaledScore(0, 0, sma)).toBe("200.00");
    expect(toScaledScore(40, 25, sma)).toBe("800.00");
  });
});

describe("toScaledScore — kurva jangkar", () => {
  const curve = { anchors: [{ raw: 0, scaled: "200.00" }, { raw: 50, scaled: "400.00" }, { raw: 100, scaled: "800.00" }] };
  it("interpolasi di tiap ruas", () => {
    expect(toScaledScore(5, 20, curve)).toBe("300.00"); // 25% → tengah ruas 200–400
    expect(toScaledScore(10, 20, curve)).toBe("400.00"); // tepat di jangkar
    expect(toScaledScore(15, 20, curve)).toBe("600.00"); // 75% → tengah ruas 400–800
  });
});

describe("validasi rumus konversi", () => {
  it("default lolos skema", () => {
    expect(scoringConversionSchema.safeParse(DEFAULT_SCORING_CONVERSION).success).toBe(true);
  });
  it("menolak titik awal bukan batas bawah, urutan turun, dan nilai di luar rentang", () => {
    expect(conversionIssues("200_800", { anchors: [{ raw: 0, scaled: "0.00" }, { raw: 100, scaled: "800.00" }] })).not.toHaveLength(0);
    expect(conversionIssues("0_100", { anchors: [{ raw: 0, scaled: "0" }, { raw: 50, scaled: "60" }, { raw: 40, scaled: "70" }, { raw: 100, scaled: "100" }] })).not.toHaveLength(0);
    expect(conversionIssues("0_100", { anchors: [{ raw: 0, scaled: "0" }, { raw: 50, scaled: "40" }, { raw: 70, scaled: "30" }, { raw: 100, scaled: "100" }] })).not.toHaveLength(0);
  });
  it("versi rumus berubah bila kurva berubah", () => {
    const a = conversionVersion({ version: 1 }, "200_800", sma);
    const b = conversionVersion({ version: 1 }, "200_800", { anchors: [{ raw: 0, scaled: "200" }, { raw: 50, scaled: "450" }, { raw: 100, scaled: "800" }] });
    expect(a).toMatch(/^v1-200_800-[0-9a-f]{8}$/);
    expect(a).not.toBe(b);
    expect(conversionVersion({ version: 1 }, "200_800", sma)).toBe(a);
  });
});

describe("achievementCategory", () => {
  const thresholds: ThresholdRow[] = [
    { category: "kurang", minScore: "200.00", maxScore: "449.99" },
    { category: "memadai", minScore: "450.00", maxScore: "599.99" },
    { category: "baik", minScore: "600.00", maxScore: "800.00" },
  ];
  it("tanpa ambang → null (tidak menebak)", () => {
    expect(achievementCategory("632.00", [])).toBeNull();
  });
  it("batas inklusif", () => {
    expect(achievementCategory("450.00", thresholds)).toBe("memadai");
    expect(achievementCategory("449.99", thresholds)).toBe("kurang");
    expect(achievementCategory("800.00", thresholds)).toBe("baik");
  });
  it("nilai yang jatuh di celah ambang → null", () => {
    expect(achievementCategory("50.00", thresholds)).toBeNull();
  });
});

describe("isIstimewa (per mata uji)", () => {
  it("SMA ≥ 725,00", () => {
    expect(isIstimewa("725.00", "200_800")).toBe(true);
    expect(isIstimewa("724.99", "200_800")).toBe(false);
  });
  it("SD/SMP ≥ 95,00 — ambang skala lain tidak berlaku", () => {
    expect(isIstimewa("95.00", "0_100")).toBe(true);
    expect(isIstimewa("94.99", "0_100")).toBe(false);
    expect(isIstimewa("100.00", "200_800")).toBe(false);
  });
});
