import { describe, expect, it } from "vitest";
import { buildFixPrompt, parseFixSuggestion, type FixContext } from "./report-ai-fix";

const pg: FixContext["question"] = {
  type: "pg",
  questionText: "Hasil dari $2 + 3$ adalah ....",
  imageUrl: null,
  categoryLabels: null,
  explanationText: "2 + 3 = 5",
  difficulty: "easy",
  cognitiveLevel: "L1",
  options: [
    { text: "4", isCorrect: true, correctCategory: null },
    { text: "5", isCorrect: false, correctCategory: null },
    { text: "6", isCorrect: false, correctCategory: null },
    { text: "7", isCorrect: false, correctCategory: null },
  ],
};

const ai = (keyIndex: number, extra: object = {}) => ({
  reportValid: true,
  analysis: "Kunci salah, seharusnya 5.",
  changesSummary: "Kunci dipindah ke B.",
  questionText: pg.questionText,
  options: pg.options.map((o, i) => ({ text: o.text, isCorrect: i === keyIndex })),
  explanationText: "2 + 3 = 5, jadi jawabannya B.",
  ...extra,
});

describe("parseFixSuggestion", () => {
  it("menerima perubahan kunci bila soal belum dijawab", () => {
    const s = parseFixSuggestion(ai(1), { question: pg, keysLocked: false });
    expect("error" in s).toBe(false);
    if (!("error" in s)) {
      expect(s.options.map((o) => o.isCorrect)).toEqual([false, true, false, false]);
      expect(s.keyChangeIgnored).toBe(false);
    }
  });

  it("kunci terkunci: perubahan kunci diabaikan & ditandai", () => {
    const s = parseFixSuggestion(ai(1), { question: pg, keysLocked: true });
    if ("error" in s) throw new Error(s.error);
    expect(s.options.map((o) => o.isCorrect)).toEqual([true, false, false, false]);
    expect(s.keyChangeIgnored).toBe(true);
  });

  it("menolak jumlah opsi berbeda", () => {
    const s = parseFixSuggestion(ai(1, { options: [{ text: "5", isCorrect: true }, { text: "6", isCorrect: false }, { text: "7", isCorrect: false }] }), {
      question: pg,
      keysLocked: false,
    });
    expect(s).toMatchObject({ error: expect.stringContaining("jumlah opsi") });
  });

  it("menolak PG dengan dua kunci (aturan bentuk soal)", () => {
    const raw = ai(1);
    raw.options[0].isCorrect = true;
    expect(parseFixSuggestion(raw, { question: pg, keysLocked: false })).toMatchObject({ error: expect.stringContaining("aturan soal") });
  });

  it("menolak output yang bukan bentuk JSON yang diminta", () => {
    expect(parseFixSuggestion({ foo: 1 }, { question: pg, keysLocked: false })).toMatchObject({ error: expect.any(String) });
  });
});

describe("buildFixPrompt", () => {
  const ctx: FixContext = {
    question: pg,
    subject: "Matematika",
    jenjang: "SMP",
    subdomain: "Bilangan Real",
    stimulus: null,
    reports: [{ reason: "kunci_salah", note: "jawabannya 5" }],
    adminNote: "Pindahkan kunci ke opsi 5.",
    keysLocked: true,
  };
  it("memuat laporan, catatan admin, kunci saat ini, dan larangan ubah kunci", () => {
    const p = buildFixPrompt(ctx);
    expect(p).toContain("jawabannya 5");
    expect(p).toContain("Kunci jawaban salah");
    expect(p).toContain("Pindahkan kunci ke opsi 5.");
    expect(p).toContain("A. 4   [KUNCI]");
    expect(p).toContain("KUNCI JAWABAN TIDAK BOLEH DIUBAH");
  });
});
