import { describe, expect, it } from "vitest";
import { answerStatus, formatDuration, remainingMs, type ExamQuestion } from "./exam";

describe("exam helpers", () => {
  it("remainingMs tidak pernah negatif", () => {
    expect(remainingMs(1000, 400)).toBe(600);
    expect(remainingMs(1000, 5000)).toBe(0);
  });

  it("formatDuration", () => {
    expect(formatDuration(125_000)).toBe("02:05");
    expect(formatDuration(3_725_000)).toBe("01:02:05");
    expect(formatDuration(1)).toBe("00:01");
    expect(formatDuration(0)).toBe("00:00");
  });
});

const question = (type: ExamQuestion["type"], optionCount = 3): ExamQuestion => ({
  id: 1,
  type,
  html: "",
  imageUrl: null,
  options: Array.from({ length: optionCount }, (_, i) => ({ id: i + 1, label: "ABCDE"[i], html: "" })),
  categoryLabels: type === "pgk_kategori" ? ["Benar", "Salah"] : null,
  stimulusId: null,
});

describe("answerStatus", () => {
  it("kosong bila belum ada jawaban atau bentuk jawaban tidak cocok", () => {
    expect(answerStatus(question("pg"), null)).toBe("blank");
    expect(answerStatus(question("pg"), { type: "pgk_mcma", optionIds: [1] })).toBe("blank");
  });

  it("PG & MCMA lengkap begitu ada pilihan", () => {
    expect(answerStatus(question("pg"), { type: "pg", optionId: 1 })).toBe("complete");
    expect(answerStatus(question("pgk_mcma"), { type: "pgk_mcma", optionIds: [1, 2] })).toBe("complete");
  });

  it("Kategori: sebagian = partial, semua pernyataan = complete", () => {
    const q = question("pgk_kategori", 3);
    const answers = (n: number) => Array.from({ length: n }, (_, i) => ({ optionId: i + 1, category: "Benar" }));
    expect(answerStatus(q, { type: "pgk_kategori", answers: answers(2) })).toBe("partial");
    expect(answerStatus(q, { type: "pgk_kategori", answers: answers(3) })).toBe("complete");
  });
});
