import { describe, expect, it } from "vitest";
import type { QuestionInput } from "@/lib/validation/question";
import { editLockViolation } from "./question-edit-rules";

const current = {
  type: "pg" as const,
  subdomainCode: "SMP.MAT.1.1",
  categoryLabels: null,
  stimulusId: 7,
  stimulusOrder: 1,
  options: [
    { text: "1", isCorrect: false, correctCategory: null },
    { text: "2", isCorrect: true, correctCategory: null },
    { text: "3", isCorrect: false, correctCategory: null },
    { text: "4", isCorrect: false, correctCategory: null },
  ],
  usage: { packages: 0, answers: 0, practiceItems: 0 },
};

function next(patch: Partial<Record<string, unknown>> = {}): QuestionInput {
  return {
    type: "pg",
    subtopicId: 1,
    questionText: "Soal",
    difficulty: "easy",
    status: "draft",
    stimulusId: 7,
    stimulusOrder: 1,
    options: current.options.map((o, i) => ({ label: "ABCD"[i], optionText: o.text, isCorrect: o.isCorrect, correctCategory: null })),
    ...patch,
  } as QuestionInput;
}

const wrongKey = next({
  options: current.options.map((o, i) => ({ label: "ABCD"[i], optionText: o.text, isCorrect: i === 0, correctCategory: null })),
});

describe("editLockViolation", () => {
  it("soal belum dipakai: semua boleh diubah", () => {
    expect(editLockViolation(current, wrongKey, "SMP.MAT.2.1")).toBeNull();
    expect(editLockViolation(current, next({ stimulusId: null, stimulusOrder: null }), current.subdomainCode)).toBeNull();
  });

  it("sudah dijawab: teks boleh, kunci/subdomain/stimulus tidak", () => {
    const used = { ...current, usage: { packages: 1, answers: 3, practiceItems: 0 } };
    expect(editLockViolation(used, next({ questionText: "Soal diperbaiki" }), used.subdomainCode)).toBeNull();
    expect(editLockViolation(used, wrongKey, used.subdomainCode)).toMatch(/sudah dijawab/);
    expect(editLockViolation(used, next(), "SMP.MAT.2.1")).toMatch(/sudah dijawab/);
    expect(editLockViolation(used, next({ stimulusOrder: 2 }), used.subdomainCode)).toMatch(/stimulus/);
  });

  it("hanya masuk paket: kunci boleh, stimulus tidak", () => {
    const inPackage = { ...current, usage: { packages: 2, answers: 0, practiceItems: 0 } };
    expect(editLockViolation(inPackage, wrongKey, inPackage.subdomainCode)).toBeNull();
    expect(editLockViolation(inPackage, next({ stimulusId: null, stimulusOrder: null }), inPackage.subdomainCode)).toMatch(/stimulus/);
  });
});
