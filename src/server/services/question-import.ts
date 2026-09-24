// Template & parser Excel untuk import soal (ARCHITECTURE §3.4).
// Validasi per baris + pencocokan kode subdomain ke kerangka asesmen
// (src/server/asesmen). Insert sebagai draft dilakukan di server action
// setelah admin konfirmasi.

import ExcelJS from "exceljs";
import { FRAMEWORKS, findSubdomain } from "@/server/asesmen";
import {
  IMPORT_COLUMNS,
  IMPORT_OPTIONAL_COLUMNS,
  validateImportRows,
  type ImportColumn,
  type ImportRow,
  type ImportRowError,
  type RawImportRow,
} from "@/lib/validation/import";

export const IMPORT_MAX_ROWS = 1000;
export const IMPORT_MAX_BYTES = 5 * 1024 * 1024;

const EXAMPLE_ROW: Record<ImportColumn, string> = {
  kode_subdomain: "SMP-MTK-D1-S1",
  pertanyaan: "Hasil dari $12 \\times 15$ adalah ...",
  opsi_a: "150",
  opsi_b: "160",
  opsi_c: "170",
  opsi_d: "180",
  opsi_e: "190",
  kunci: "D",
  pembahasan: "$12 \\times 15 = 12 \\times 10 + 12 \\times 5 = 120 + 60 = 180$",
  tingkat_kesulitan: "mudah",
  level_kognitif: "L1",
};

export async function buildImportTemplate(): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Soal");
  sheet.columns = IMPORT_COLUMNS.map((key) => ({
    header: key,
    key,
    width: key === "pertanyaan" || key === "pembahasan" ? 50 : 18,
  }));
  sheet.getRow(1).font = { bold: true };
  sheet.addRow(EXAMPLE_ROW);

  const guide = workbook.addWorksheet("Petunjuk");
  guide.getColumn(1).width = 110;
  [
    "Isi soal mulai baris 2 di sheet 'Soal'. Hapus baris contoh sebelum upload.",
    "Jangan ubah nama kolom di baris 1.",
    "kode_subdomain: salin dari sheet 'Kode Subdomain' (kerangka asesmen TKA resmi).",
    "opsi_e boleh dikosongkan (soal 4 opsi).",
    "kunci: A, B, C, D, atau E.",
    "tingkat_kesulitan: mudah, sedang, atau sulit.",
    "level_kognitif: L1/L2/L3 — hanya untuk mata uji yang punya level kognitif (lihat sheet 'Kode Subdomain'). Kosongkan untuk mata uji bahasa.",
    "Soal wajib berada dalam cakupan & batasan subdomain di kerangka asesmen.",
    "Rumus pakai KaTeX: $...$ untuk inline, $$...$$ untuk blok.",
    `Maksimal ${IMPORT_MAX_ROWS} soal per file.`,
  ].forEach((line) => guide.addRow([line]));

  const ref = workbook.addWorksheet("Kode Subdomain");
  ref.columns = [
    { header: "kode_subdomain", key: "code", width: 20 },
    { header: "jenjang", key: "jenjang", width: 9 },
    { header: "mata_uji", key: "subject", width: 30 },
    { header: "domain", key: "domain", width: 32 },
    { header: "subdomain", key: "subdomain", width: 70 },
    { header: "level_kognitif", key: "levels", width: 14 },
  ];
  ref.getRow(1).font = { bold: true };
  ref.views = [{ state: "frozen", ySplit: 1 }];
  for (const fw of Object.values(FRAMEWORKS)) {
    for (const subject of fw.subjects) {
      for (const domain of subject.domains) {
        for (const sub of domain.subdomains) {
          ref.addRow({
            code: sub.code,
            jenjang: fw.jenjang,
            subject: subject.name,
            domain: domain.name,
            subdomain: sub.name,
            levels: subject.cognitiveLevels.map((l) => l.code).join(", ") || "—",
          });
        }
      }
    }
  }
  ref.autoFilter = { from: "A1", to: "F1" };

  return workbook.xlsx.writeBuffer() as Promise<ArrayBuffer>;
}

export class ImportFileError extends Error {}

export type CheckedImportRow = ImportRow & {
  rowNumber: number;
  jenjang: string;
  subjectName: string;
  domainName: string;
  subdomainName: string;
};

export type ImportCheckResult = { valid: CheckedImportRow[]; errors: ImportRowError[] };

/** Cocokkan baris yang lolos Zod ke kerangka asesmen (kode & level kognitif). */
export function checkAgainstFramework(rows: (ImportRow & { rowNumber: number })[]): ImportCheckResult {
  const result: ImportCheckResult = { valid: [], errors: [] };
  for (const row of rows) {
    const ref = findSubdomain(row.subdomainCode);
    if (!ref) {
      result.errors.push({
        rowNumber: row.rowNumber,
        messages: [`Kode subdomain ${row.subdomainCode} tidak ada di kerangka asesmen`],
      });
      continue;
    }
    const levels = ref.subject.cognitiveLevels.map((l) => l.code);
    if (row.cognitiveLevel && levels.length === 0) {
      result.errors.push({
        rowNumber: row.rowNumber,
        messages: [`${ref.subject.name} tidak memakai level kognitif — kosongkan kolom level_kognitif`],
      });
      continue;
    }
    if (row.cognitiveLevel && !levels.includes(row.cognitiveLevel)) {
      result.errors.push({
        rowNumber: row.rowNumber,
        messages: [`Level kognitif ${ref.subject.name} hanya ${levels.join("/")}`],
      });
      continue;
    }
    result.valid.push({
      ...row,
      jenjang: ref.framework.jenjang,
      subjectName: ref.subject.name,
      domainName: ref.domain.name,
      subdomainName: ref.subdomain.name,
    });
  }
  return result;
}

export async function parseImportFile(data: ArrayBuffer): Promise<ImportCheckResult> {
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
  let legacyTemplate = false;
  sheet.getRow(1).eachCell((cell, col) => {
    const header = cell.text.trim().toLowerCase() as ImportColumn;
    if (IMPORT_COLUMNS.includes(header)) columnIndex.set(header, col);
    if ((header as string) === "topik") legacyTemplate = true;
  });
  const missing = IMPORT_COLUMNS.filter((c) => !IMPORT_OPTIONAL_COLUMNS.includes(c) && !columnIndex.has(c));
  if (missing.length > 0) {
    const hint = legacyTemplate ? " Template lama (topik/subtopik) sudah tidak dipakai — unduh template terbaru." : "";
    throw new ImportFileError(`Kolom wajib tidak ditemukan: ${missing.join(", ")}.${hint}`);
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

  const validated = validateImportRows(rows);
  const checked = checkAgainstFramework(validated.valid);
  return {
    valid: checked.valid,
    errors: [...validated.errors, ...checked.errors].sort((a, b) => a.rowNumber - b.rowNumber),
  };
}
