import { describe, expect, it } from "vitest";
import { FRAMEWORKS, allSubdomains } from "./index";
import { buildSeedPlan } from "./seed-plan";

describe("buildSeedPlan", () => {
  const plan = buildSeedPlan(Object.values(FRAMEWORKS));

  it("memuat seluruh hierarki kerangka", () => {
    expect(plan.categories.map((c) => c.code)).toEqual(["SD", "SMP", "SMA"]);
    expect(plan.subjects).toHaveLength(26);
    expect(plan.subtopics).toHaveLength(allSubdomains().length);
  });

  it("setiap baris merujuk induk yang ada di rencana", () => {
    const categories = new Set(plan.categories.map((c) => c.code));
    const subjects = new Set(plan.subjects.map((s) => s.code));
    const topics = new Set(plan.topics.map((t) => t.code));
    expect(plan.subjects.every((s) => categories.has(s.categoryCode))).toBe(true);
    expect(plan.topics.every((t) => subjects.has(t.subjectCode))).toBe(true);
    expect(plan.subtopics.every((s) => topics.has(s.topicCode))).toBe(true);
  });

  it("muat di batas panjang kolom database", () => {
    expect(Math.max(...plan.subjects.map((s) => s.code.length), ...plan.subtopics.map((s) => s.code.length))).toBeLessThanOrEqual(32);
    expect(Math.max(...plan.subtopics.map((s) => s.name.length))).toBeLessThanOrEqual(512);
    expect(Math.max(...plan.topics.map((t) => t.name.length), ...plan.subjects.map((s) => s.fullName.length))).toBeLessThanOrEqual(255);
  });
});
