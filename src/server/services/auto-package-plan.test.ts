import { describe, expect, it } from "vitest";
import { checkPackageRules, type SubjectOutline } from "@/lib/package-rules";
import type { QuestionType } from "@/lib/validation/enums";
import { batchAiSlots, chunkGroups, planAutoPackage, spread, type AutoPackagePlan, type PlanQuestion } from "./auto-package-plan";
import { validatePackageOrder } from "./package-composition";

// 3 topik, 6 subtopik (SD Matematika-ish: 30 soal).
const outline: SubjectOutline = [
  { code: "T1", name: "Bilangan", subtopics: [{ code: "S1", name: "S1" }, { code: "S2", name: "S2" }] },
  { code: "T2", name: "Geometri", subtopics: [{ code: "S3", name: "S3" }, { code: "S4", name: "S4" }] },
  { code: "T3", name: "Data", subtopics: [{ code: "S5", name: "S5" }, { code: "S6", name: "S6" }] },
];

let nextId = 1;
function q(subtopicCode: string, type: QuestionType = "pg", stimulusId: number | null = null, stimulusOrder: number | null = null): PlanQuestion {
  return { id: nextId++, type, subtopicCode, stimulusId, stimulusOrder };
}

/** Cek hasil akhir (bank + slot AI dianggap soal tunggal) terhadap aturan resmi. */
function finalReport(plan: AutoPackagePlan, available: PlanQuestion[]) {
  const byId = new Map(available.map((x) => [x.id, x]));
  const questions = [
    ...plan.bankIds.map((id) => byId.get(id)!).map((x) => ({ type: x.type, subtopicCode: x.subtopicCode, stimulusKey: x.stimulusId })),
    ...plan.aiSlots.map((s) => ({ type: s.type, subtopicCode: s.subtopicCode, stimulusKey: null })),
  ].map((x) => ({ ...x, subjectCode: "SD-MTK", hasImage: false }));
  return checkPackageRules({ jenjang: "SD", subject: { code: "SD-MTK", type: "wajib" }, durationMinutes: 75, questions, outline });
}

describe("planAutoPackage", () => {
  it("bank kosong → semua 30 soal dari AI, aturan wajib terpenuhi", () => {
    const plan = planAutoPackage({ available: [], outline, questionCount: 30 });
    expect(plan.bankIds).toEqual([]);
    expect(plan.aiSlots).toHaveLength(30);
    expect(finalReport(plan, []).publishable).toBe(true);
    // Sebaran rata: 6 subtopik × 5 soal.
    const per = new Map<string, number>();
    for (const s of plan.aiSlots) per.set(s.subtopicCode, (per.get(s.subtopicCode) ?? 0) + 1);
    expect([...per.values()]).toEqual([5, 5, 5, 5, 5, 5]);
  });

  it("bank berisi PG saja → PG dibatasi maksimum, sisanya MCMA & Kategori dari AI", () => {
    const available = Array.from({ length: 40 }, (_, i) => q(`S${(i % 6) + 1}`, "pg"));
    const plan = planAutoPackage({ available, outline, questionCount: 30 });
    expect(plan.stats.bank).toBe(18); // maks. PG 60% dari 30
    expect(plan.aiSlots.every((s) => s.type !== "pg")).toBe(true);
    expect(plan.aiSlots.some((s) => s.type === "pgk_mcma") && plan.aiSlots.some((s) => s.type === "pgk_kategori")).toBe(true);
    expect(finalReport(plan, available).publishable).toBe(true);
  });

  it("bank cukup & seimbang → tanpa AI, lolos aturan", () => {
    const types: QuestionType[] = ["pg", "pg", "pgk_mcma", "pg", "pgk_kategori", "pg"];
    const available = Array.from({ length: 36 }, (_, i) => q(`S${(i % 6) + 1}`, types[Math.floor(i / 6)]));
    const plan = planAutoPackage({ available, outline, questionCount: 30 });
    expect(plan.aiSlots).toEqual([]);
    expect(finalReport(plan, available).publishable).toBe(true);
  });

  it("topik yang belum ada di bank diisi AI lebih dulu", () => {
    const available = Array.from({ length: 30 }, (_, i) => q(i % 2 ? "S1" : "S3", i % 3 ? "pg" : "pgk_mcma"));
    const plan = planAutoPackage({ available, outline, questionCount: 30 });
    const aiSubs = new Set(plan.aiSlots.map((s) => s.subtopicCode));
    expect(aiSubs.has("S5") || aiSubs.has("S6")).toBe(true);
    expect(finalReport(plan, available).publishable).toBe(true);
  });

  it("grup stimulus utuh, berurutan, dan tidak melewati kuota", () => {
    const g1 = [q("S1", "pg", 100, 2), q("S2", "pgk_mcma", 100, 1), q("S1", "pgk_kategori", 100, 3)];
    const big = Array.from({ length: 31 }, (_, i) => q("S4", "pg", 200, i + 1));
    const singles = Array.from({ length: 10 }, (_, i) => q(`S${(i % 6) + 1}`, "pg"));
    const available = [...g1, ...big, ...singles];
    const plan = planAutoPackage({ available, outline, questionCount: 30 });
    expect(plan.bankIds).not.toContain(big[0].id);
    const i = plan.bankIds.indexOf(g1[1].id);
    expect(plan.bankIds.slice(i, i + 3)).toEqual([g1[1].id, g1[0].id, g1[2].id]);
    expect(validatePackageOrder(plan.bankIds, available)).toEqual([]);
    expect(finalReport(plan, available).publishable).toBe(true);
  });

  it("soal tunggal digabung per subtopik → satu panggilan Gemini per subtopik", () => {
    const plan = planAutoPackage({ available: [], outline, questionCount: 30 });
    const batches = batchAiSlots(plan);
    expect(batches).toHaveLength(6);
    expect(batches.every((b) => b.kind === "tunggal" && new Set(b.slots.map((s) => s.subtopicCode)).size === 1)).toBe(true);
  });

  it("bentuk & tingkat soal AI tersebar — tiap topik punya PG dan PGK, tingkat tidak seragam per subtopik", () => {
    const plan = planAutoPackage({ available: [], outline, questionCount: 30, levelled: true });
    for (const t of outline) {
      const slots = plan.aiSlots.filter((s) => t.subtopics.some((x) => x.code === s.subtopicCode));
      expect(new Set(slots.map((s) => s.type)).size).toBeGreaterThanOrEqual(2);
      expect(slots.some((s) => s.type === "pg")).toBe(true);
    }
    for (const sub of ["S1", "S2", "S3", "S4", "S5", "S6"]) {
      expect(new Set(plan.aiSlots.filter((s) => s.subtopicCode === sub).map((s) => s.tier)).size).toBeGreaterThanOrEqual(2);
    }
  });

  it("mapel bahasa (groupShare 1): semua soal AI jadi grup 3–5 soal dalam satu topik, aturan tetap lolos", () => {
    const plan = planAutoPackage({ available: [], outline, questionCount: 30, groupShare: 1 });
    expect(plan.aiGroups.flat().sort((a, b) => a - b)).toEqual(plan.aiSlots.map((_, i) => i));
    for (const g of plan.aiGroups) {
      expect(g.length).toBeGreaterThanOrEqual(3);
      expect(g.length).toBeLessThanOrEqual(5);
      const topics = new Set(g.map((i) => outline.find((t) => t.subtopics.some((s) => s.code === plan.aiSlots[i].subtopicCode))!.code));
      expect(topics.size).toBe(1);
    }
    const batches = batchAiSlots(plan);
    expect(batches.every((b) => b.kind === "grup")).toBe(true);
    expect(batches.length).toBe(plan.aiGroups.length);
    expect(finalReport(plan, []).publishable).toBe(true);
  });

  it("SMA (groupShare 0.5): sebagian grup, sisanya soal tunggal", () => {
    const plan = planAutoPackage({ available: [], outline, questionCount: 25, groupShare: 0.5 });
    const grouped = plan.aiGroups.flat().length;
    expect(grouped).toBeGreaterThan(0);
    expect(grouped).toBeLessThan(25);
    const batches = batchAiSlots(plan);
    expect(batches.filter((b) => b.kind === "tunggal").length).toBeGreaterThan(0);
    expect(batches.reduce((n, b) => n + b.slots.length, 0)).toBe(25);
  });

  it("bank kosong → tingkat AI mengikuti target 20/50/30 (tidak mudah semua)", () => {
    const plan = planAutoPackage({ available: [], outline, questionCount: 30, levelled: true });
    expect(plan.tiers).toEqual({ 1: 6, 2: 15, 3: 9 });
    const report = checkPackageRules({
      jenjang: "SD",
      subject: { code: "SD-MTK", type: "wajib" },
      durationMinutes: 75,
      outline,
      questions: plan.aiSlots.map((s) => ({ type: s.type, subjectCode: "SD-MTK", subtopicCode: s.subtopicCode, stimulusKey: null, hasImage: false, difficulty: (["easy", "medium", "hard"] as const)[s.tier - 1], cognitiveLevel: `L${s.tier}` })),
    });
    expect(report.recommended.filter((c) => /kesulitan|kognitif/.test(c.label)).every((c) => c.ok)).toBe(true);
  });

  it("bank berisi soal mudah/L1 → AI tidak menambah L1, condong ke sulit", () => {
    const available = Array.from({ length: 18 }, (_, i) => ({ ...q(`S${(i % 6) + 1}`, "pg"), difficulty: "easy" as const, cognitiveLevel: "L1" }));
    const plan = planAutoPackage({ available, outline, questionCount: 30, levelled: true });
    expect(plan.aiSlots.some((s) => s.tier === 1)).toBe(false);
    expect(plan.aiSlots.filter((s) => s.tier === 3).length).toBeGreaterThanOrEqual(4);
  });

  it("mata uji tanpa level (bahasa) memakai tingkat kesulitan soal bank", () => {
    const available = Array.from({ length: 12 }, (_, i) => ({ ...q(`S${(i % 6) + 1}`, "pg"), difficulty: "hard" as const, cognitiveLevel: null }));
    const plan = planAutoPackage({ available, outline, questionCount: 30, levelled: false });
    expect(plan.tiers[3]).toBeGreaterThanOrEqual(12);
    expect(plan.aiSlots.some((s) => s.tier === 3)).toBe(false);
  });

  it("25 soal (SMA Matematika): PG 13–15", () => {
    const plan = planAutoPackage({ available: [], outline, questionCount: 25 });
    expect(plan.stats.aiPg).toBeGreaterThanOrEqual(13);
    expect(plan.stats.aiPg).toBeLessThanOrEqual(15);
  });
});

describe("spread & chunkGroups", () => {
  it("spread menyebar merata", () => {
    expect(spread([["a", 2], ["b", 2], ["c", 1]], 5).join("")).toMatch(/^(?!.*aa)(?!.*bb)[abc]{5}$/);
    expect(spread([["pg", 3], ["x", 0]], 3)).toEqual(["pg", "pg", "pg"]);
  });

  it("chunkGroups: ukuran 3–5, < 3 tidak dikelompokkan", () => {
    expect(chunkGroups([1, 2])).toEqual([]);
    expect(chunkGroups([1, 2, 3]).map((g) => g.length)).toEqual([3]);
    expect(chunkGroups(Array.from({ length: 8 }, (_, i) => i)).map((g) => g.length)).toEqual([4, 4]);
    expect(chunkGroups(Array.from({ length: 14 }, (_, i) => i)).map((g) => g.length)).toEqual([4, 4, 3, 3]);
    for (let m = 3; m <= 40; m++) {
      const sizes = chunkGroups(Array.from({ length: m }, (_, i) => i)).map((g) => g.length);
      expect(sizes.reduce((a, b) => a + b, 0)).toBe(m);
      expect(sizes.every((n) => n >= 3 && n <= 5)).toBe(true);
    }
  });
});
