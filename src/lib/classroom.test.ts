import { describe, expect, it } from "vitest";
import { assignmentInput, assignmentPhase, attemptCountsForAssignment, classCodeInput, generateClassCode, normalizeClassCode } from "./classroom";

const d = (s: string) => new Date(s);

describe("kode kelas", () => {
  it("6 karakter tanpa huruf mirip", () => {
    const code = generateClassCode();
    expect(code).toMatch(/^[2-9A-HJKMNP-Z]{6}$/);
  });
  it("normalisasi & validasi", () => {
    expect(normalizeClassCode(" ab-c 12x ")).toBe("ABC12X");
    expect(classCodeInput.safeParse("abc12x").success).toBe(true);
    expect(classCodeInput.safeParse("abc").success).toBe(false);
  });
});

describe("status tugas", () => {
  const start = d("2026-12-01T01:00:00Z");
  const due = d("2026-12-03T01:00:00Z");
  it("belum dibuka, terbuka, ditutup", () => {
    expect(assignmentPhase(d("2026-11-30T00:00:00Z"), start, due)).toBe("upcoming");
    expect(assignmentPhase(d("2026-12-02T00:00:00Z"), start, due)).toBe("open");
    expect(assignmentPhase(d("2026-12-04T00:00:00Z"), start, due)).toBe("closed");
    expect(assignmentPhase(d("2027-01-01T00:00:00Z"), start, null)).toBe("open");
  });
  it("attempt sebelum waktu mulai atau lewat batas tidak dihitung", () => {
    expect(attemptCountsForAssignment({ startedAt: d("2026-11-30T00:00:00Z"), submittedAt: d("2026-12-01T02:00:00Z") }, start, due)).toBe(false);
    expect(attemptCountsForAssignment({ startedAt: d("2026-12-01T02:00:00Z"), submittedAt: d("2026-12-01T03:00:00Z") }, start, due)).toBe(true);
    expect(attemptCountsForAssignment({ startedAt: d("2026-12-02T02:00:00Z"), submittedAt: d("2026-12-03T03:00:00Z") }, start, due)).toBe(false);
    expect(attemptCountsForAssignment({ startedAt: d("2026-12-02T02:00:00Z"), submittedAt: null }, start, due)).toBe(false);
  });
});

describe("input tugas", () => {
  it("batas waktu harus setelah mulai", () => {
    const base = { classId: 1, testPackageId: 2, startsAt: "2026-12-01T01:00:00.000Z" };
    expect(assignmentInput.safeParse({ ...base, dueAt: "" }).success).toBe(true);
    expect(assignmentInput.safeParse({ ...base, dueAt: "2026-11-30T01:00:00.000Z" }).success).toBe(false);
  });
});
