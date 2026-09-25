import { describe, expect, it } from "vitest";
import { answerResponse, saveAnswerInput } from "./attempt";
import { questionInput, stimulusInput } from "./question";

const opts = (keys: boolean[]) =>
  keys.map((isCorrect, i) => ({ label: "ABCDE"[i], optionText: `Opsi ${i + 1}`, isCorrect }));

const base = {
  type: "pg",
  subtopicId: 1,
  questionText: "Ibu kota Indonesia?",
  difficulty: "easy",
  options: opts([false, true, false, false]),
};

const issues = (input: unknown) => {
  const r = questionInput.safeParse(input);
  return r.success ? [] : r.error.issues.map((i) => i.message);
};

describe("questionInput — PG", () => {
  it("menerima soal pilihan ganda valid", () => {
    expect(questionInput.safeParse(base).success).toBe(true);
  });

  it("menolak kunci jawaban lebih dari satu", () => {
    expect(issues({ ...base, options: opts([true, true, false, false]) })).toContain("Soal PG harus punya tepat 1 kunci jawaban");
  });

  it("menolak label opsi tidak berurutan", () => {
    const q = { ...base, options: [...base.options.slice(0, 3), { ...base.options[3], label: "E" }] };
    expect(questionInput.safeParse(q).success).toBe(false);
  });

  it("menolak bentuk soal yang tidak dikenal", () => {
    expect(questionInput.safeParse({ ...base, type: "single_choice" }).success).toBe(false);
  });
});

describe("questionInput — PGK MCMA", () => {
  const mcma = { ...base, type: "pgk_mcma" };

  it("menerima 1 sampai (jumlah opsi − 1) kunci", () => {
    expect(questionInput.safeParse({ ...mcma, options: opts([true, false, false, false]) }).success).toBe(true);
    expect(questionInput.safeParse({ ...mcma, options: opts([true, true, true, false, false]) }).success).toBe(true);
  });

  it("menolak tanpa kunci atau semua opsi kunci", () => {
    expect(issues({ ...mcma, options: opts([false, false, false, false]) })).toContain("Soal PGK MCMA harus punya 1–3 kunci jawaban");
    expect(issues({ ...mcma, options: opts([true, true, true, true]) })).toContain("Soal PGK MCMA harus punya 1–3 kunci jawaban");
  });
});

describe("questionInput — PGK Kategori", () => {
  const statements = (cats: (string | null)[]) =>
    cats.map((correctCategory, i) => ({ label: "ABCDE"[i], optionText: `Pernyataan ${i + 1}`, correctCategory }));
  const kategori = {
    ...base,
    type: "pgk_kategori",
    categoryLabels: ["Benar", "Salah"],
    options: statements(["Benar", "Salah", "Benar"]),
  };

  it("menerima 3–5 pernyataan dengan kategori kunci dari pasangan", () => {
    expect(questionInput.safeParse(kategori).success).toBe(true);
    expect(questionInput.safeParse({ ...kategori, categoryLabels: ["Sesuai", "Tidak Sesuai"], options: statements(["Sesuai", "Tidak Sesuai", "Sesuai", "Sesuai"]) }).success).toBe(true);
  });

  it("menolak pasangan kategori di luar kerangka", () => {
    expect(questionInput.safeParse({ ...kategori, categoryLabels: ["Ya", "Tidak"] }).success).toBe(false);
  });

  it("menolak pernyataan tanpa kategori atau kategori asing", () => {
    expect(issues({ ...kategori, options: statements(["Benar", null, "Sesuai"]) })).toEqual([
      "Kategori kunci pernyataan B harus Benar atau Salah",
      "Kategori kunci pernyataan C harus Benar atau Salah",
    ]);
  });

  it("menolak kurang dari 3 pernyataan", () => {
    expect(issues({ ...kategori, options: statements(["Benar", "Salah"]) })).toContain("Minimal 3 pernyataan");
  });

  it("menolak kategori kunci pada soal non-kategori", () => {
    const q = { ...base, options: base.options.map((o) => ({ ...o, correctCategory: "Benar" })) };
    expect(issues(q)).toContain("Kategori kunci hanya untuk PGK Kategori");
  });
});

describe("soal grup stimulus", () => {
  it("stimulusId dan stimulusOrder harus diisi berpasangan", () => {
    expect(questionInput.safeParse({ ...base, stimulusId: 5, stimulusOrder: 1 }).success).toBe(true);
    expect(issues({ ...base, stimulusId: 5 })).toContain("Soal grup butuh stimulus dan nomor urut di dalam grup");
  });

  it("stimulusInput menormalkan kode", () => {
    const r = stimulusInput.parse({ code: " stm-smp-001 ", title: "Teks Hujan", content: "Isi bacaan" });
    expect(r).toMatchObject({ code: "STM-SMP-001", status: "draft" });
  });
});

describe("answerResponse", () => {
  it("menerima tiap bentuk jawaban", () => {
    expect(answerResponse.safeParse({ type: "pg", optionId: 1 }).success).toBe(true);
    expect(answerResponse.safeParse({ type: "pgk_mcma", optionIds: [1, 3] }).success).toBe(true);
    expect(answerResponse.safeParse({ type: "pgk_kategori", answers: [{ optionId: 1, category: "Benar" }] }).success).toBe(true);
  });

  it("menolak opsi/pernyataan ganda", () => {
    expect(answerResponse.safeParse({ type: "pgk_mcma", optionIds: [1, 1] }).success).toBe(false);
    expect(
      answerResponse.safeParse({ type: "pgk_kategori", answers: [{ optionId: 1, category: "Benar" }, { optionId: 1, category: "Salah" }] }).success,
    ).toBe(false);
  });

  it("autosave boleh mengosongkan jawaban (response null)", () => {
    expect(saveAnswerInput.parse({ attemptId: 1, questionId: 2, response: null })).toMatchObject({ isFlagged: false });
  });
});
