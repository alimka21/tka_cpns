import { describe, expect, it } from "vitest";
import { questionInput } from "./question";

const base = {
  subtopicId: 1,
  questionText: "Ibu kota Indonesia?",
  difficulty: "easy",
  options: [
    { label: "A", optionText: "Bandung", isCorrect: false },
    { label: "B", optionText: "Jakarta", isCorrect: true },
    { label: "C", optionText: "Surabaya", isCorrect: false },
    { label: "D", optionText: "Medan", isCorrect: false },
  ],
};

describe("questionInput", () => {
  it("menerima soal pilihan ganda valid", () => {
    expect(questionInput.safeParse(base).success).toBe(true);
  });

  it("menolak kunci jawaban lebih dari satu", () => {
    const q = { ...base, options: base.options.map((o) => ({ ...o, isCorrect: true })) };
    expect(questionInput.safeParse(q).success).toBe(false);
  });

  it("menolak label opsi tidak berurutan", () => {
    const q = { ...base, options: [...base.options.slice(0, 3), { ...base.options[3], label: "E" }] };
    expect(questionInput.safeParse(q).success).toBe(false);
  });
});
