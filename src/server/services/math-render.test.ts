import { describe, expect, it } from "vitest";
import { renderMathToHtml, toExamQuestion } from "./math-render";

describe("renderMathToHtml", () => {
  it("escape teks biasa (cegah XSS dari isi soal)", () => {
    expect(renderMathToHtml('<img src=x onerror="alert(1)"> & ok')).toBe(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; ok",
    );
  });

  it("render rumus inline dan blok", () => {
    const html = renderMathToHtml("Hitung $x^2$ lalu $$\\frac{1}{2}$$");
    expect(html).toContain('class="katex"');
    expect(html).toContain('class="katex-display"');
    expect(html.startsWith("Hitung ")).toBe(true);
  });

  it("rumus rusak tidak melempar error", () => {
    expect(() => renderMathToHtml("$\\frac{1$")).not.toThrow();
  });
});

describe("toExamQuestion", () => {
  it("tidak menyertakan field selain yang aman untuk client", () => {
    const q = toExamQuestion({
      id: 1,
      type: "pg",
      text: "Soal",
      imageUrl: null,
      options: [{ id: 2, label: "A", text: "$1$", isCorrect: true } as never],
    });
    expect(q.options[0]).toEqual({ id: 2, label: "A", html: expect.stringContaining("katex") });
  });

  it("PGK Kategori: kunci kategori tidak ikut terkirim, label kategori ikut", () => {
    const q = toExamQuestion({
      id: 1,
      type: "pgk_kategori",
      text: "Soal",
      imageUrl: null,
      categoryLabels: ["Benar", "Salah"],
      stimulusId: 9,
      options: [{ id: 2, label: "A", text: "Pernyataan", correctCategory: "Benar" } as never],
    });
    expect(q.options[0]).toEqual({ id: 2, label: "A", html: "Pernyataan" });
    expect(q).toMatchObject({ categoryLabels: ["Benar", "Salah"], stimulusId: 9 });
    expect(JSON.stringify(q)).not.toContain("correctCategory");
  });

  it("label kategori dibuang untuk bentuk selain Kategori", () => {
    const q = toExamQuestion({ id: 1, type: "pg", text: "Soal", imageUrl: null, categoryLabels: ["Benar", "Salah"], options: [] });
    expect(q.categoryLabels).toBeNull();
  });
});
