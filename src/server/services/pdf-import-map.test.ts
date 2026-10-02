import { describe, expect, it } from "vitest";
import { FRAMEWORKS } from "@/server/asesmen";
import { buildPdfImportPrompt, mapPdfExtraction, parseCrop } from "./pdf-import-map";

const mtk = FRAMEWORKS.SMA.subjects.find((s) => s.code === "SMA-MTK")!;
const bind = FRAMEWORKS.SMA.subjects.find((s) => s.code === "SMA-BIND")!;

const pg = (over: Record<string, unknown> = {}) => ({
  number: 1,
  stimulusKey: null,
  subtopicCode: "SMA-MTK-D1-S1",
  type: "pg",
  questionText: "Bentuk sederhana dari $\\dfrac{4}{6}$ adalah ....",
  image: null,
  options: ["$\\dfrac{1}{3}$", "$\\dfrac{2}{3}$", "$1$", "$\\dfrac{3}{2}$"].map((text, i) => ({ text, isCorrect: i === 1 })),
  categoryLabels: null,
  explanation: "Bagi pembilang dan penyebut dengan 2.",
  cognitiveLevel: "L1",
  difficulty: "easy",
  keyFromDocument: false,
  ...over,
});

describe("buildPdfImportPrompt", () => {
  it("memuat semua kode subtopik mapel, level kognitif, & pasangan kategori", () => {
    const p = buildPdfImportPrompt(mtk, "SMA", 12);
    expect(p).toContain("12 halaman");
    for (const d of mtk.domains) for (const s of d.subdomains) expect(p).toContain(s.code);
    expect(p).toContain("L1");
    expect(p).toContain('"Ya"/"Tidak"');
  });
  it("mapel bahasa tanpa level kognitif", () => {
    expect(buildPdfImportPrompt(bind, "SMA", 3)).toContain("cognitiveLevel dengan null");
  });
});

describe("parseCrop", () => {
  it("kotak sah dibulatkan & dijepit, kotak rusak → null", () => {
    expect(parseCrop({ page: 2, box_2d: [100.4, -5, 500, 1200] }, 3)).toEqual({ page: 2, box: [100, 0, 500, 1000] });
    expect(parseCrop({ page: 4, box_2d: [0, 0, 500, 500] }, 3)).toBeNull();
    expect(parseCrop({ page: 1, box_2d: [100, 100, 105, 900] }, 3)).toBeNull();
    expect(parseCrop(null, 3)).toBeNull();
  });
});

describe("mapPdfExtraction", () => {
  it("soal valid → tanpa error, rumus jadi HTML KaTeX, kunci AI ditandai", () => {
    const m = mapPdfExtraction({ title: "Soal MTK", questions: [pg()] }, mtk, 5)!;
    expect(m.title).toBe("Soal MTK");
    expect(m.questions[0].errors).toEqual([]);
    expect(m.questions[0].html).toContain("katex");
    expect(m.questions[0].keySource).toBe("ai");
    expect(m.questions[0].subtopicName).toBe("Bilangan Real");
  });

  it("subtopik mapel lain, level salah, & dua kunci PG → error per soal", () => {
    const m = mapPdfExtraction(
      { questions: [pg({ subtopicCode: "SMA-BIND-D1-S1" }), pg({ number: 2, cognitiveLevel: "L9" }), pg({ number: 3, options: pg().options.map((o) => ({ ...o, isCorrect: true })) })] },
      mtk,
      5,
    )!;
    expect(m.questions[0].errors.join(" ")).toMatch(/bukan bagian Matematika/);
    expect(m.questions[1].errors.join(" ")).toMatch(/Level kognitif/);
    expect(m.questions[2].errors.join(" ")).toMatch(/tepat 1 kunci/);
  });

  it("kategori: pasangan sah dipetakan, pasangan lain → error", () => {
    const kat = (labels: string[]) =>
      pg({
        type: "pgk_kategori",
        categoryLabels: labels,
        options: [
          { text: "Pernyataan satu", category: labels[0] },
          { text: "Pernyataan dua", category: labels[1] },
          { text: "Pernyataan tiga", category: labels[0] },
        ],
      });
    const ok = mapPdfExtraction({ questions: [kat(["benar", "salah"])] }, mtk, 1)!.questions[0];
    expect(ok.errors).toEqual([]);
    expect(ok.categoryLabels).toEqual(["Benar", "Salah"]);
    expect(ok.options.map((o) => o.category)).toEqual(["Benar", "Salah", "Benar"]);
    const bad = mapPdfExtraction({ questions: [kat(["Fakta", "Opini"])] }, mtk, 1)!.questions[0];
    expect(bad.errors.join(" ")).toMatch(/Pasangan kategori/);
  });

  it("bacaan: rujukan hilang jadi soal tunggal, bacaan tak terpakai dibuang", () => {
    const m = mapPdfExtraction(
      {
        stimuli: [
          { key: "S1", title: "Teks A", content: "Isi teks A", image: { page: 1, box_2d: [0, 0, 400, 1000] } },
          { key: "S2", title: "Teks B", content: "Isi teks B" },
        ],
        questions: [pg({ stimulusKey: "S1" }), pg({ number: 2, stimulusKey: "S9" })],
      },
      mtk,
      2,
    )!;
    expect(m.stimuli.map((s) => s.key)).toEqual(["S1"]);
    expect(m.stimuli[0].image).toEqual({ page: 1, box: [0, 0, 400, 1000] });
    expect(m.questions[1].stimulusKey).toBeNull();
    expect(m.warnings.join(" ")).toMatch(/S9 tidak ditemukan/);
    expect(m.warnings.join(" ")).toMatch(/1 bacaan tidak dipakai/);
  });

  it("output bukan bentuk yang diminta → null", () => {
    expect(mapPdfExtraction({ foo: 1 }, mtk, 1)).toBeNull();
  });
});
