// Template & parser Excel untuk import soal (ARCHITECTURE §3.4).
// Hanya validasi per baris; pencocokan topik/subtopik ke DB dan insert
// sebagai draft dilakukan di server action setelah admin konfirmasi.

import ExcelJS from "exceljs";
import {
  IMPORT_COLUMNS,
  validateImportRows,
  type ImportColumn,
  type ImportValidationResult,
  type RawImportRow,
} from "@/lib/validation/import";

export const IMPORT_MAX_ROWS = 1000;
export const IMPORT_MAX_BYTES = 5 * 1024 * 1024;

const EXAMPLE_ROW: Record<ImportColumn, string> = {
  topik: "Matematika",
  subtopik: "Aritmatika",
  pertanyaan: "Hasil dari $12 \\times 15$ adalah ...",
  opsi_a: "150",
  opsi_b: "160",
  opsi_c: "170",
  opsi_d: "180",
  opsi_e: "190",
  kunci: "D",
  pembahasan: "$12 \\times 15 = 12 \\times 10 + 12 \\times 5 = 120 + 60 = 180$",
  tingkat_kesulitan: "mudah",
};

export async function buildImportTemplate(): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Soal");
  sheet.columns = IMPORT_COLUMNS.map((key) => ({
    header: key,
    key,
    width: key === "pertanyaan" || key === "pembahasan" ? 50 : 16,
  }));
  sheet.getRow(1).font = { bold: true };
  sheet.addRow(EXAMPLE_ROW);

  const guide = workbook.addWorksheet("Petunjuk");
  guide.getColumn(1).width = 100;
  [
    "Isi soal mulai baris 2 di sheet 'Soal'. Hapus baris contoh sebelum upload.",
    "Jangan ubah nama/urutan kolom di baris 1.",
    "opsi_e boleh dikosongkan (soal 4 opsi).",
    "kunci: A, B, C, D, atau E.",
    "tingkat_kesulitan: mudah, sedang, atau sulit.",
    "Rumus pakai KaTeX: $...$ untuk inline, $$...$$ untuk blok.",
    "Topik & subtopik harus sudah ada di panel admin (dicocokkan berdasarkan nama).",
    `Maksimal ${IMPORT_MAX_ROWS} soal per file.`,
  ].forEach((line) => guide.addRow([line]));

  return workbook.xlsx.writeBuffer() as Promise<ArrayBuffer>;
}

export class ImportFileError extends Error {}

export async function parseImportFile(data: ArrayBuffer): Promise<ImportValidationResult> {
  if (data.byteLength > IMPORT_MAX_BYTES) {
    throw new ImportFileError("Ukuran file maksimal 5 MB.");
  }

  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(data);
  } catch {
    throw new ImportFileError("File tidak bisa dibaca. Pastikan formatnya .xlsx.");
  }

  const sheet = workbook.getWorksheet("Soal") ?? workbook.worksheets[0];
  if (!sheet) throw new ImportFileError("File tidak berisi sheet.");

  // Petakan header → nomor kolom, supaya urutan kolom tidak wajib persis.
  const columnIndex = new Map<ImportColumn, number>();
  sheet.getRow(1).eachCell((cell, col) => {
    const header = cell.text.trim().toLowerCase() as ImportColumn;
    if (IMPORT_COLUMNS.includes(header)) columnIndex.set(header, col);
  });
  const missing = IMPORT_COLUMNS.filter((c) => c !== "opsi_e" && c !== "pembahasan" && !columnIndex.has(c));
  if (missing.length > 0) {
    throw new ImportFileError(`Kolom wajib tidak ditemukan: ${missing.join(", ")}.`);
  }

  const rows: { rowNumber: number; data: RawImportRow }[] = [];
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const data: RawImportRow = {};
    for (const [key, col] of columnIndex) {
      data[key] = row.getCell(col).text;
    }
    if (Object.values(data).every((v) => !v?.trim())) return;
    rows.push({ rowNumber, data });
  });

  if (rows.length === 0) throw new ImportFileError("Tidak ada baris soal di file.");
  if (rows.length > IMPORT_MAX_ROWS) {
    throw new ImportFileError(`Maksimal ${IMPORT_MAX_ROWS} soal per file (file berisi ${rows.length}).`);
  }

  return validateImportRows(rows);
}
