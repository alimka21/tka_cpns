import { describe, expect, it } from "vitest";
import { checkPackageRules, packageRuleFor, pgRange, ruleErrors, type RuleQuestion } from "./package-rules";

const make = (n: { pg: number; mcma: number; kat: number }, subjectCode: string, stim?: (i: number) => number | null): RuleQuestion[] => {
  const types = [...Array(n.pg).fill("pg"), ...Array(n.mcma).fill("pgk_mcma"), ...Array(n.kat).fill("pgk_kategori")];
  return types.map((type, i) => ({ type, subjectCode, stimulusKey: stim ? stim(i) : null, hasImage: false }));
};

describe("packageRuleFor", () => {
  it("SD & SMP: Matematika & Bahasa Indonesia 30 soal / 75 menit", () => {
    for (const j of ["SD", "SMP"]) {
      expect(packageRuleFor(j, { code: `${j}-MTK`, type: "wajib" })).toMatchObject({ questionCount: 30, durationMinutes: 75 });
      expect(packageRuleFor(j, { code: `${j}-BIND`, type: "wajib" })).toMatchObject({ questionCount: 30, durationMinutes: 75 });
    }
  });
  it("SMA: BIND & BING 30/75, MTK 25/75, pilihan 25/60", () => {
    expect(packageRuleFor("SMA", { code: "SMA-BIND", type: "wajib" })).toMatchObject({ questionCount: 30, durationMinutes: 75 });
    expect(packageRuleFor("SMA", { code: "SMA-BING", type: "wajib" })).toMatchObject({ questionCount: 30, durationMinutes: 75 });
    expect(packageRuleFor("SMA", { code: "SMA-MTK", type: "wajib" })).toMatchObject({ questionCount: 25, durationMinutes: 75 });
    expect(packageRuleFor("SMA", { code: "SMA-FIS", type: "pilihan" })).toMatchObject({ questionCount: 25, durationMinutes: 60 });
    expect(packageRuleFor("SMA", { code: "SMA-MTK-L", type: "pilihan" })).toMatchObject({ questionCount: 25, durationMinutes: 60 });
  });
  it("rentang PG 50–60%", () => {
    expect(pgRange(30)).toEqual({ min: 15, max: 18 });
    expect(pgRange(25)).toEqual({ min: 13, max: 15 });
  });
});

describe("checkPackageRules", () => {
  it("paket SD MTK yang sesuai → bisa diterbitkan", () => {
    const r = checkPackageRules({ jenjang: "SD", subject: { code: "SD-MTK", type: "wajib" }, durationMinutes: 75, questions: make({ pg: 17, mcma: 7, kat: 6 }, "SD-MTK") });
    expect(r.publishable).toBe(true);
    expect(ruleErrors(r)).toEqual([]);
    expect(r.recommended.every((c) => c.ok)).toBe(true);
  });

  it("jumlah, durasi, rasio PG, & mapel lain → gagal dengan pesan jelas", () => {
    const qs = [...make({ pg: 20, mcma: 5, kat: 3 }, "SD-MTK"), ...make({ pg: 0, mcma: 0, kat: 1 }, "SD-BIND")];
    const r = checkPackageRules({ jenjang: "SD", subject: { code: "SD-MTK", type: "wajib" }, durationMinutes: 60, questions: qs });
    expect(r.publishable).toBe(false);
    const msg = ruleErrors(r).join(" ");
    expect(msg).toMatch(/29 dari 30/);
    expect(msg).toMatch(/60 menit/);
    expect(msg).toMatch(/20 soal PG/);
    expect(msg).toMatch(/1 soal dari mata pelajaran lain/);
  });

  it("tanpa mapel → tidak bisa diterbitkan", () => {
    expect(checkPackageRules({ jenjang: "SMP", subject: null, durationMinutes: 75, questions: [] }).publishable).toBe(false);
  });

  it("SMA: saran mayoritas stimulus & grup 3–5 soal (tidak memblokir)", () => {
    // 25 soal pilihan: 14 PG, 6 MCMA, 5 Kategori; 15 soal dalam 3 grup berisi 5.
    const qs = make({ pg: 14, mcma: 6, kat: 5 }, "SMA-FIS", (i) => (i < 15 ? Math.floor(i / 5) + 1 : null));
    const r = checkPackageRules({ jenjang: "SMA", subject: { code: "SMA-FIS", type: "pilihan" }, durationMinutes: 60, questions: qs });
    expect(r.publishable).toBe(true);
    expect(r.recommended.map((c) => c.ok)).toEqual([true, true, true]);
    const sedikit = checkPackageRules({
      jenjang: "SMA",
      subject: { code: "SMA-FIS", type: "pilihan" },
      durationMinutes: 60,
      questions: make({ pg: 14, mcma: 6, kat: 5 }, "SMA-FIS", (i) => (i < 2 ? 9 : null)),
    });
    expect(sedikit.publishable).toBe(true);
    expect(sedikit.recommended.filter((c) => !c.ok).map((c) => c.label).join(" ")).toMatch(/Mayoritas.*3–5|3–5/);
  });
});
