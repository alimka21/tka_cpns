import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { IMPORT_COLUMNS, STIMULUS_COLUMNS, type ImportColumn } from "@/lib/validation/import";
import { allSubdomains } from "@/server/asesmen";
import { buildImportTemplate, ImportFileError, parseImportFile } from "./question-import";

type RowInput = Partial<Record<ImportColumn, string>>;

const pgRow: RowInput = {
  kode_subdomain: "smp-mtk-d1-s1",
  pertanyaan: "1+1?",
  opsi_a: "1",
  opsi_b: "2",
  opsi_c: "3",
  opsi_d: "4",
  kunci: "b",
  tingkat_kesulitan: "Mudah",
  level_kognitif: "l2",
};

async function workbookWith(rows: RowInput[], stimuli?: Partial<Record<(typeof STIMULUS_COLUMNS)[number], string>>[]) {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet("Soal");
  sheet.addRow([...IMPORT_COLUMNS]);
  rows.forEach((r) => sheet.addRow(IMPORT_COLUMNS.map((c) => r[c] ?? "")));
  if (stimuli) {
    const st = wb.addWorksheet("Stimulus");
    st.addRow([...STIMULUS_COLUMNS]);
    stimuli.forEach((r) => st.addRow(STIMULUS_COLUMNS.map((c) => r[c] ?? "")));
  }
  return (await wb.xlsx.writeBuffer()) as ArrayBuffer;
}

const parse = async (rows: RowInput[], stimuli?: Parameters<typeof workbookWith>[1]) =>
  parseImportFile(await workbookWith(rows, stimuli));

describe("parseImportFile — umum", () => {
  it("template bawaan (semua bentuk + stimulus) lolos validasi", async () => {
    const result = await parseImportFile(await buildImportTemplate());
    expect(result.errors).toEqual([]);
    expect(result.valid.map((r) => r.type)).toEqual(["pg", "pgk_mcma", "pgk_kategori", "pg", "pgk_kategori"]);
    expect(result.stimuli).toMatchObject([{ code: "STM-CONTOH-01", questionCount: 2 }]);
  });

  it("memetakan baris PG; bentuk_soal kosong = pg", async () => {
    const result = await parse([pgRow]);
    expect(result.valid[0]).toMatchObject({
      rowNumber: 2,
      type: "pg",
      subdomainCode: "SMP-MTK-D1-S1",
      cognitiveLevel: "L2",
      jenjang: "SMP",
      subdomainName: "Bilangan Real",
      difficulty: "easy",
      explanationText: null,
      stimulusCode: null,
      stimulusOrder: null,
    });
    expect(result.valid[0].options.map((o) => o.isCorrect)).toEqual([false, true, false, false]);
  });

  it("melaporkan error per baris dengan nomor baris Excel", async () => {
    const result = await parse([pgRow, { ...pgRow, pertanyaan: "", tingkat_kesulitan: "gampang" }]);
    expect(result.valid).toHaveLength(1);
    expect(result.errors[0].rowNumber).toBe(3);
    expect(result.errors[0].messages).toEqual(
      expect.arrayContaining(["Pertanyaan wajib diisi", "Tingkat kesulitan harus mudah/sedang/sulit"]),
    );
  });

  it("menolak opsi yang loncat & kunci di luar opsi", async () => {
    const result = await parse([
      { ...pgRow, opsi_c: "" },
      { ...pgRow, kunci: "E" },
    ]);
    expect(result.errors[0].messages[0]).toMatch(/tanpa loncat/);
    expect(result.errors[1].messages[0]).toMatch(/Kunci E tidak ada/);
  });

  it("menolak file tanpa kolom wajib", async () => {
    const wb = new ExcelJS.Workbook();
    wb.addWorksheet("Soal").addRow(["pertanyaan"]);
    await expect(parseImportFile((await wb.xlsx.writeBuffer()) as ArrayBuffer)).rejects.toBeInstanceOf(ImportFileError);
  });

  it("memberi petunjuk kalau memakai template lama topik/subtopik", async () => {
    const wb = new ExcelJS.Workbook();
    wb.addWorksheet("Soal").addRow(["topik", "subtopik", "pertanyaan", "opsi_a", "opsi_b", "opsi_c", "opsi_d", "kunci", "tingkat_kesulitan"]);
    await expect(parseImportFile((await wb.xlsx.writeBuffer()) as ArrayBuffer)).rejects.toThrow(/Template lama/);
  });

  it("menolak file bukan xlsx", async () => {
    await expect(parseImportFile(new TextEncoder().encode("bukan excel").buffer as ArrayBuffer)).rejects.toThrow(
      "File tidak bisa dibaca",
    );
  });

  it("template memuat sheet referensi semua kode subdomain", async () => {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(await buildImportTemplate());
    expect(wb.getWorksheet("Kode Subdomain")!.rowCount - 1).toBe(allSubdomains().length);
  });
});

describe("parseImportFile — kerangka asesmen", () => {
  it("menolak kode subdomain yang tidak ada di kerangka", async () => {
    const result = await parse([{ ...pgRow, kode_subdomain: "SMP-MTK-D9-S9" }]);
    expect(result.errors[0].messages[0]).toMatch(/tidak ada di kerangka/);
  });

  it("menolak level kognitif untuk mata uji bahasa", async () => {
    const bind = { ...pgRow, kode_subdomain: "SMP-BIND-D1-S1" };
    expect((await parse([bind])).errors[0].messages[0]).toMatch(/tidak memakai level kognitif/);
    expect((await parse([{ ...bind, level_kognitif: "" }])).valid).toHaveLength(1);
  });
});

describe("parseImportFile — PG lebih dari satu kunci & MCMA", () => {
  it("PG dengan dua kunci ditolak dengan saran pakai MCMA", async () => {
    expect((await parse([{ ...pgRow, kunci: "A,B" }])).errors[0].messages[0]).toMatch(/pgk_mcma/);
  });

  it("MCMA menerima kunci ganda dengan pemisah koma/spasi", async () => {
    const result = await parse([{ ...pgRow, bentuk_soal: "PGK MCMA", kunci: "a, c" }]);
    expect(result.valid[0].type).toBe("pgk_mcma");
    expect(result.valid[0].options.map((o) => o.isCorrect)).toEqual([true, false, true, false]);
  });

  it("MCMA menolak semua opsi sebagai kunci", async () => {
    const result = await parse([{ ...pgRow, bentuk_soal: "mcma", kunci: "A,B,C,D" }]);
    expect(result.errors[0].messages).toContain("Soal PGK MCMA harus punya 1–3 kunci jawaban");
  });
});

describe("parseImportFile — PGK Kategori", () => {
  const kategori: RowInput = {
    ...pgRow,
    bentuk_soal: "pgk_kategori",
    opsi_d: "",
    kategori: "Benar / Salah",
    kunci: "B, S, benar",
  };

  it("memetakan kunci singkatan ke kategori per pernyataan", async () => {
    const result = await parse([kategori]);
    expect(result.errors).toEqual([]);
    expect(result.valid[0]).toMatchObject({ type: "pgk_kategori", categoryLabels: ["Benar", "Salah"] });
    expect(result.valid[0].options.map((o) => o.correctCategory)).toEqual(["Benar", "Salah", "Benar"]);
  });

  it("pasangan Sesuai/Tidak Sesuai memakai S/TS", async () => {
    const result = await parse([{ ...kategori, kategori: "Sesuai/Tidak Sesuai", kunci: "TS,S,Tidak Sesuai" }]);
    expect(result.valid[0].options.map((o) => o.correctCategory)).toEqual(["Tidak Sesuai", "Sesuai", "Tidak Sesuai"]);
  });

  it("wajib kolom kategori & jumlah kunci sama dengan jumlah pernyataan", async () => {
    const result = await parse([
      { ...kategori, kategori: "" },
      { ...kategori, kunci: "B,S" },
      { ...kategori, kunci: "B,X,S" },
    ]);
    expect(result.errors.map((e) => e.messages[0])).toEqual([
      expect.stringMatching(/Kolom kategori wajib/),
      expect.stringMatching(/harus 3 nilai/),
      expect.stringMatching(/hanya boleh/),
    ]);
  });

  it("kolom kategori ditolak untuk bentuk selain Kategori", async () => {
    expect((await parse([{ ...pgRow, kategori: "Benar/Salah" }])).errors[0].messages[0]).toMatch(/hanya untuk PGK Kategori/);
  });
});

describe("parseImportFile — soal grup stimulus", () => {
  const stimulus = { kode_stimulus: "STM-1", judul: "Bacaan", isi: "Isi bacaan" };

  it("menautkan soal ke stimulus dan memberi urutan sesuai urutan baris", async () => {
    const result = await parse(
      [
        { ...pgRow, kode_stimulus: "stm-1" },
        pgRow,
        { ...pgRow, kode_stimulus: "STM-1" },
      ],
      [stimulus],
    );
    expect(result.errors).toEqual([]);
    expect(result.valid.map((r) => [r.stimulusCode, r.stimulusOrder])).toEqual([
      ["STM-1", 1],
      [null, null],
      ["STM-1", 2],
    ]);
    expect(result.stimuli).toEqual([expect.objectContaining({ code: "STM-1", title: "Bacaan", questionCount: 2 })]);
  });

  it("soal dengan kode stimulus yang tidak ada di sheet ditolak", async () => {
    const result = await parse([{ ...pgRow, kode_stimulus: "STM-9" }], [stimulus]);
    expect(result.errors.map((e) => e.messages[0])).toEqual(
      expect.arrayContaining(["Stimulus STM-9 tidak ada di sheet 'Stimulus'", "Stimulus STM-1 tidak dipakai soal mana pun"]),
    );
    expect(result.errors.find((e) => e.sheet === "Stimulus")?.rowNumber).toBe(2);
  });

  it("stimulus tanpa isi atau kode ganda dilaporkan per baris sheet Stimulus", async () => {
    const result = await parse([{ ...pgRow, kode_stimulus: "STM-1" }], [stimulus, { ...stimulus, isi: "" }, { kode_stimulus: "STM-2", judul: "B", isi: "" }]);
    const stimulusErrors = result.errors.filter((e) => e.sheet === "Stimulus");
    expect(stimulusErrors.map((e) => e.rowNumber)).toEqual([3, 4]);
  });
});
