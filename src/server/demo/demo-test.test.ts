import { describe, expect, it } from "vitest";
import type { AnswerResponse } from "@/lib/validation/attempt";
import { DEMO_QUESTIONS, DEMO_SUBDOMAINS, demoExamQuestions, scoreDemo } from "./demo-test";

function correctAnswers(): Record<number, AnswerResponse> {
  return Object.fromEntries(
    DEMO_QUESTIONS.map((q): [number, AnswerResponse] => {
      if (q.type === "pg") return [q.id, { type: "pg", optionId: q.options.find((o) => o.isCorrect)!.id }];
      if (q.type === "pgk_mcma") return [q.id, { type: "pgk_mcma", optionIds: q.options.filter((o) => o.isCorrect).map((o) => o.id) }];
      return [q.id, { type: "pgk_kategori", answers: q.options.map((o) => ({ optionId: o.id, category: o.correctCategory! })) }];
    }),
  );
}

describe("tes demo", () => {
  it("setiap soal punya kunci yang sah & subdomain terdaftar", () => {
    for (const q of DEMO_QUESTIONS) {
      expect(DEMO_SUBDOMAINS.some((s) => s.id === q.subtopicId)).toBe(true);
      if (q.type === "pg") expect(q.options.filter((o) => o.isCorrect)).toHaveLength(1);
      if (q.type === "pgk_mcma") expect(q.options.filter((o) => o.isCorrect).length).toBeGreaterThan(0);
      if (q.type === "pgk_kategori") for (const o of q.options) expect(q.categoryLabels).toContain(o.correctCategory);
    }
    expect(new Set(DEMO_QUESTIONS.flatMap((q) => q.options.map((o) => o.id))).size).toBe(
      DEMO_QUESTIONS.reduce((n, q) => n + q.options.length, 0),
    );
  });

  it("semua benar → 100, semua subdomain 100%", () => {
    const r = scoreDemo(correctAnswers());
    expect(r.score).toBe(100);
    expect(r.correct).toBe(DEMO_QUESTIONS.length);
    expect(r.subdomains.every((s) => s.percentage === 100)).toBe(true);
    expect(r.items.every((i) => i.isCorrect && i.explanationHtml)).toBe(true);
  });

  it("kosong → 0 dan dihitung sebagai kosong", () => {
    const r = scoreDemo({});
    expect(r.score).toBe(0);
    expect(r.blank).toBe(DEMO_QUESTIONS.length);
    expect(r.wrong).toBe(0);
  });

  it("per subdomain & mata uji dihitung benar", () => {
    const answers = correctAnswers();
    delete answers[1]; // Bilangan Real 1/2
    answers[4] = { type: "pg", optionId: 41 }; // Persamaan Linier 1/2 (salah)
    const r = scoreDemo(answers);
    expect(r.subdomains.find((s) => s.id === 1)!.percentage).toBe(50);
    expect(r.subdomains.find((s) => s.id === 2)!.percentage).toBe(50);
    expect(r.subjects.find((s) => s.name === "Matematika")).toMatchObject({ correct: 4, total: 6 });
    expect(r).toMatchObject({ correct: 8, wrong: 1, blank: 1, score: 80 });
  });

  it("soal untuk halaman ujian tidak membawa kunci", () => {
    const json = JSON.stringify(demoExamQuestions());
    expect(json).not.toMatch(/isCorrect|correctCategory|explanation/);
  });
});
