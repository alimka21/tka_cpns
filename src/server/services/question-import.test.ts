import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { IMPORT_COLUMNS } from "@/lib/validation/import";
import { allSubdomains } from "@/server/asesmen";
import { buildImportTemplate, ImportFileError, parseImportFile } from "./question-import";

async function workbookWith(rows: (string | undefined)[][]) {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet("Soal");
  sheet.addRow([...IMPORT_COLUMNS]);
  rows.forEach((r) => sheet.addRow(r));
  return (await wb.xlsx.writeBuffer()) as ArrayBuffer;
}

// Urutan = IMPORT_COLUMNS: kode_subdomain, pertanyaan, opsi_a..e, kunci, pembahasan, tingkat_kesulitan, level_kognitif
const validRow = ["smp-mtk-d1-s1", "1+1?", "1", "2", "3", "4", "", "b", "", "Mudah", "l2"];

describe("parseImportFile", () => {
  it("template bawaan lolos validasi", async () => {
    const result = await parseImportFile(await buildImportTemplate());
    expect(result.errors).toEqual([]);
    expect(result.valid).toHaveLength(1);
    expect(result.valid[0].options).toHaveLength(5);
  });

  it("memetakan baris valid ke bentuk soal", async () => {
    const result = await parseImportFile(await workbookWith([validRow]));
    expect(result.valid[0]).toMatchObject({
      rowNumber: 2,
      subdomainCode: "SMP-MTK-D1-S1",
      cognitiveLevel: "L2",
      jenjang: "SMP",
      subjectName: "Matematika",
      subdomainName: "Bilangan Real",
      difficulty: "easy",
      explanationText: null,
    });
    expect(result.valid[0].options.map((o) => o.isCorrect)).toEqual([false, true, false, false]);
  });

  it("melaporkan error per baris dengan nomor baris Excel", async () => {
    const bad = [...validRow];
    bad[1] = "";
    bad[7] = "E";
    bad[9] = "gampang";
    const result = await parseImportFile(await workbookWith([validRow, bad]));
    expect(result.valid).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].rowNumber).toBe(3);
    expect(result.errors[0].messages).toEqual(
      expect.arrayContaining([
        "Pertanyaan wajib diisi",
        "Tingkat kesulitan harus mudah/sedang/sulit",
      ]),
    );
  });

  it("menolak file tanpa kolom wajib", async () => {
    const wb = new ExcelJS.Workbook();
    wb.addWorksheet("Soal").addRow(["pertanyaan"]);
    const buf = (await wb.xlsx.writeBuffer()) as ArrayBuffer;
    await expect(parseImportFile(buf)).rejects.toBeInstanceOf(ImportFileError);
  });

  it("memberi petunjuk kalau memakai template lama topik/subtopik", async () => {
    const wb = new ExcelJS.Workbook();
    wb.addWorksheet("Soal").addRow(["topik", "subtopik", "pertanyaan", "opsi_a", "opsi_b", "opsi_c", "opsi_d", "kunci", "tingkat_kesulitan"]);
    const buf = (await wb.xlsx.writeBuffer()) as ArrayBuffer;
    await expect(parseImportFile(buf)).rejects.toThrow(/Template lama/);
  });

  it("menolak kode subdomain yang tidak ada di kerangka", async () => {
    const row = [...validRow];
    row[0] = "SMP-MTK-D9-S9";
    const result = await parseImportFile(await workbookWith([row]));
    expect(result.valid).toHaveLength(0);
    expect(result.errors[0].messages[0]).toMatch(/tidak ada di kerangka/);
  });

  it("menolak level kognitif untuk mata uji bahasa", async () => {
    const row = [...validRow];
    row[0] = "SMP-BIND-D1-S1";
    const result = await parseImportFile(await workbookWith([row]));
    expect(result.errors[0].messages[0]).toMatch(/tidak memakai level kognitif/);
    row[10] = "";
    expect((await parseImportFile(await workbookWith([row]))).valid).toHaveLength(1);
  });

  it("template memuat sheet referensi semua kode subdomain", async () => {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(await buildImportTemplate());
    const ref = wb.getWorksheet("Kode Subdomain")!;
    expect(ref.rowCount - 1).toBe(allSubdomains().length);
  });

  it("menolak file bukan xlsx", async () => {
    await expect(parseImportFile(new TextEncoder().encode("bukan excel").buffer as ArrayBuffer)).rejects.toThrow(
      "File tidak bisa dibaca",
    );
  });
});
