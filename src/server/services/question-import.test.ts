import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { IMPORT_COLUMNS } from "@/lib/validation/import";
import { buildImportTemplate, ImportFileError, parseImportFile } from "./question-import";

async function workbookWith(rows: (string | undefined)[][]) {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet("Soal");
  sheet.addRow([...IMPORT_COLUMNS]);
  rows.forEach((r) => sheet.addRow(r));
  return (await wb.xlsx.writeBuffer()) as ArrayBuffer;
}

const validRow = ["Matematika", "Aritmatika", "1+1?", "1", "2", "3", "4", "", "b", "", "Mudah"];

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
      topicName: "Matematika",
      difficulty: "easy",
      explanationText: null,
    });
    expect(result.valid[0].options.map((o) => o.isCorrect)).toEqual([false, true, false, false]);
  });

  it("melaporkan error per baris dengan nomor baris Excel", async () => {
    const bad = [...validRow];
    bad[2] = "";
    bad[8] = "E";
    bad[10] = "gampang";
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
    wb.addWorksheet("Soal").addRow(["topik", "pertanyaan"]);
    const buf = (await wb.xlsx.writeBuffer()) as ArrayBuffer;
    await expect(parseImportFile(buf)).rejects.toBeInstanceOf(ImportFileError);
  });

  it("menolak file bukan xlsx", async () => {
    await expect(parseImportFile(new TextEncoder().encode("bukan excel").buffer as ArrayBuffer)).rejects.toThrow(
      "File tidak bisa dibaca",
    );
  });
});
