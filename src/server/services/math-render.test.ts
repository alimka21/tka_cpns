import { describe, expect, it } from "vitest";
import { renderMathToHtml, renderRichText, toExamQuestion } from "./math-render";

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

describe("renderRichText", () => {
  it("paragraf dipisah baris kosong; baris tunggal jadi <br>", () => {
    const html = renderRichText("Baris satu\nbaris dua\n\nParagraf kedua");
    expect(html).toBe('<div class="rich-text"><p>Baris satu<br>baris dua</p><p>Paragraf kedua</p></div>');
  });

  it("list bernomor & bullet", () => {
    const html = renderRichText("Langkah:\n1. Cari KPK\n2) Ubah ke menit\n\n- poin a\n• poin b");
    expect(html).toContain("<p>Langkah:</p><ol><li>Cari KPK</li><li>Ubah ke menit</li></ol>");
    expect(html).toContain("<ul><li>poin a</li><li>poin b</li></ul>");
  });

  it("list bernomor bisa mulai bukan dari 1", () => {
    expect(renderRichText("3. tiga\n4. empat")).toContain('<ol start="3">');
  });

  it("tabel markdown", () => {
    const html = renderRichText("| Nilai | 6 | 7 |\n|---|---|---|\n| Siswa | 3 | 5 |");
    expect(html).toContain("<table><thead><tr><th>Nilai</th><th>6</th><th>7</th></tr></thead><tbody><tr><td>Siswa</td><td>3</td><td>5</td></tr></tbody></table>");
  });

  it("baris berawalan | tanpa pemisah tetap paragraf", () => {
    expect(renderRichText("| bukan tabel |")).toContain("<p>| bukan tabel |</p>");
  });

  it("**tebal**, rumus tetap utuh, teks tetap di-escape", () => {
    const html = renderRichText("**Kunci** <b>x</b> $a|b$ dan\n$$\\frac{1}{2}$$");
    expect(html).toContain("<strong>Kunci</strong> &lt;b&gt;x&lt;/b&gt;");
    expect(html).toContain('class="katex"');
    expect(html).toContain('class="katex-display"');
    expect(html).not.toContain("\u0000");
  });

  it("angka negatif di awal baris bukan bullet", () => {
    expect(renderRichText("-5 adalah bilangan bulat")).toContain("<p>-5 adalah bilangan bulat</p>");
  });
});
