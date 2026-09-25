// Template & parser Excel untuk import soal (ARCHITECTURE §3.4).
// Validasi per baris + pencocokan kode subdomain ke kerangka asesmen
// (src/server/asesmen). Insert sebagai draft dilakukan di server action
// setelah admin konfirmasi.

import ExcelJS from "exceljs";
import { FRAMEWORKS, findSubdomain } from "@/server/asesmen";
import { stimulusInput } from "@/lib/validation/question";
import {
  IMPORT_COLUMNS,
  IMPORT_OPTIONAL_COLUMNS,
  STIMULUS_COLUMNS,
  validateImportRows,
  type StimulusColumn,
  type ImportColumn,
  type ImportRow,
  type ImportRowError,
  type RawImportRow,
} from "@/lib/validation/import";

export const IMPORT_MAX_ROWS = 1000;
export const IMPORT_MAX_BYTES = 5 * 1024 * 1024;

const blank = Object.fromEntries(IMPORT_COLUMNS.map((c) => [c, ""])) as Record<ImportColumn, string>;

// Satu contoh per bentuk soal + satu soal grup stimulus.
const EXAMPLE_ROWS: Record<ImportColumn, string>[] = [
  {
    ...blank,
    kode_subdomain: "SMP-MTK-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: "Hasil dari $12 \\times 15$ adalah ...",
    opsi_a: "150",
    opsi_b: "160",
    opsi_c: "170",
    opsi_d: "180",
    opsi_e: "190",
    kunci: "D",
    pembahasan: "$12 \\times 15 = 120 + 60 = 180$",
    tingkat_kesulitan: "mudah",
    level_kognitif: "L1",
  },
  {
    ...blank,
    kode_subdomain: "SMP-MTK-D1-S1",
    bentuk_soal: "pgk_mcma",
    pertanyaan: "Manakah bilangan berikut yang merupakan bilangan prima?",
    opsi_a: "21",
    opsi_b: "23",
    opsi_c: "27",
    opsi_d: "29",
    kunci: "B,D",
    tingkat_kesulitan: "sedang",
    level_kognitif: "L1",
  },
  {
    ...blank,
    kode_subdomain: "SMP-MTK-D1-S1",
    bentuk_soal: "pgk_kategori",
    pertanyaan: "Tentukan benar atau salah setiap pernyataan tentang $\\frac{3}{4}$.",
    opsi_a: "$\\frac{3}{4} = 0{,}75$",
    opsi_b: "$\\frac{3}{4} > \\frac{4}{5}$",
    opsi_c: "$\\frac{3}{4} = 75\\%$",
    kunci: "B,S,B",
    kategori: "Benar/Salah",
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    ...blank,
    kode_subdomain: "SMP-BIND-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: "Berdasarkan teks, apa yang membuat Rara akhirnya berani tampil?",
    opsi_a: "Ia sudah hafal lagu sejak lama.",
    opsi_b: "Ibu guru memintanya menggantikan teman.",
    opsi_c: "Ia teringat pesan kakeknya.",
    opsi_d: "Teman-temannya menjanjikan hadiah.",
    kunci: "C",
    tingkat_kesulitan: "mudah",
    kode_stimulus: "STM-CONTOH-01",
  },
  {
    ...blank,
    kode_subdomain: "SMP-BIND-D1-S1",
    bentuk_soal: "pgk_kategori",
    pertanyaan: "Tentukan kesesuaian setiap pernyataan dengan isi teks.",
    opsi_a: "Rara tampil di acara perpisahan sekolah.",
    opsi_b: "Rara menyanyi bersama kakeknya.",
    opsi_c: "Tepuk tangan penonton membuat Rara tersenyum.",
    kunci: "S,TS,S",
    kategori: "Sesuai/Tidak Sesuai",
    tingkat_kesulitan: "sedang",
    kode_stimulus: "STM-CONTOH-01",
  },
];

const EXAMPLE_STIMULUS: Record<StimulusColumn, string> = {
  kode_stimulus: "STM-CONTOH-01",
  judul: "Suara Kecil di Panggung Besar",
  isi: "Rara selalu gemetar setiap kali harus berbicara di depan kelas. ... Begitu lagu selesai dan tepuk tangan memenuhi aula, Rara tersenyum lebar.",
  url_gambar: "",
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
  EXAMPLE_ROWS.forEach((row) => sheet.addRow(row));

  const stimulusSheet = workbook.addWorksheet("Stimulus");
  stimulusSheet.columns = STIMULUS_COLUMNS.map((key) => ({ header: key, key, width: key === "isi" ? 80 : 24 }));
  stimulusSheet.getRow(1).font = { bold: true };
  stimulusSheet.addRow(EXAMPLE_STIMULUS);

  const guide = workbook.addWorksheet("Petunjuk");
  guide.getColumn(1).width = 110;
  [
    "Isi soal mulai baris 2 di sheet 'Soal'. Hapus baris contoh (dan stimulus contoh) sebelum upload.",
    "Jangan ubah nama kolom di baris 1.",
    "kode_subdomain: salin dari sheet 'Kode Subdomain' (kerangka asesmen TKA resmi).",
    "bentuk_soal: pg (pilihan ganda), pgk_mcma (jawaban benar bisa lebih dari satu), atau pgk_kategori. Kosong = pg.",
    "pg: 4–5 opsi, kunci satu huruf, mis. D.",
    "pgk_mcma: 4–5 opsi, kunci beberapa huruf dipisah koma, mis. B,D (tidak boleh semua opsi).",
    "pgk_kategori: opsi_a dst. berisi 3–5 PERNYATAAN; isi kolom kategori (Benar/Salah atau Sesuai/Tidak Sesuai);",
    "   kunci satu nilai per pernyataan dipisah koma: B/S untuk Benar/Salah, S/TS untuk Sesuai/Tidak Sesuai, mis. B,S,B.",
    "Soal grup: isi kode_stimulus yang sama untuk semua soal satu bacaan, lalu tulis bacaannya di sheet 'Stimulus'.",
    "   Urutan soal di dalam grup mengikuti urutan baris di sheet 'Soal'.",
    "opsi_d dan opsi_e boleh dikosongkan sesuai jumlah opsi, tapi tidak boleh loncat.",
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
  /** Urutan di dalam grup stimulus (1-based) — null untuk soal tunggal. */
  stimulusOrder: number | null;
  jenjang: string;
  subjectName: string;
  domainName: string;
  subdomainName: string;
};

export type ImportStimulus = {
  rowNumber: number;
  code: string;
  title: string;
  content: string;
  imageUrl: string | null;
  questionCount: number;
};

export type ImportCheckResult = { valid: CheckedImportRow[]; errors: ImportRowError[]; stimuli: ImportStimulus[] };

/** Cocokkan baris yang lolos Zod ke kerangka asesmen (kode & level kognitif). */
export function checkAgainstFramework(rows: (ImportRow & { rowNumber: number })[]): {
  valid: (Omit<CheckedImportRow, "stimulusOrder">)[];
  errors: ImportRowError[];
} {
  const result: { valid: Omit<CheckedImportRow, "stimulusOrder">[]; errors: ImportRowError[] } = { valid: [], errors: [] };
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
  const stimulusSheet = parseStimulusSheet(workbook.getWorksheet("Stimulus"));
  const linked = linkStimuli(checked.valid, stimulusSheet.stimuli);
  return {
    valid: linked.valid,
    stimuli: linked.stimuli,
    errors: [...validated.errors, ...checked.errors, ...linked.errors, ...stimulusSheet.errors].sort(
      (a, b) => (a.sheet === "Stimulus" ? 1 : 0) - (b.sheet === "Stimulus" ? 1 : 0) || a.rowNumber - b.rowNumber,
    ),
  };
}

function parseStimulusSheet(sheet: ExcelJS.Worksheet | undefined) {
  const stimuli: Omit<ImportStimulus, "questionCount">[] = [];
  const errors: ImportRowError[] = [];
  if (!sheet) return { stimuli, errors };

  const columnIndex = new Map<StimulusColumn, number>();
  sheet.getRow(1).eachCell((cell, col) => {
    const header = cell.text.trim().toLowerCase() as StimulusColumn;
    if (STIMULUS_COLUMNS.includes(header)) columnIndex.set(header, col);
  });
  const missing = (["kode_stimulus", "judul", "isi"] as const).filter((c) => !columnIndex.has(c));
  if (missing.length > 0) {
    throw new ImportFileError(`Sheet 'Stimulus': kolom wajib tidak ditemukan: ${missing.join(", ")}.`);
  }

  const seen = new Set<string>();
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const get = (c: StimulusColumn) => (columnIndex.has(c) ? row.getCell(columnIndex.get(c)!).text.trim() : "");
    if (STIMULUS_COLUMNS.every((c) => !get(c))) return;
    const parsed = stimulusInput.safeParse({
      code: get("kode_stimulus"),
      title: get("judul"),
      content: get("isi"),
      imageUrl: get("url_gambar") || null,
    });
    if (!parsed.success) {
      errors.push({ sheet: "Stimulus", rowNumber, messages: parsed.error.issues.map((i) => i.message) });
      return;
    }
    if (seen.has(parsed.data.code)) {
      errors.push({ sheet: "Stimulus", rowNumber, messages: [`Kode stimulus ${parsed.data.code} ganda`] });
      return;
    }
    seen.add(parsed.data.code);
    stimuli.push({
      rowNumber,
      code: parsed.data.code,
      title: parsed.data.title,
      content: parsed.data.content,
      imageUrl: parsed.data.imageUrl ?? null,
    });
  });
  return { stimuli, errors };
}

/** Tautkan soal grup ke stimulus di file & beri urutan sesuai urutan baris. */
export function linkStimuli(
  rows: Omit<CheckedImportRow, "stimulusOrder">[],
  stimuli: Omit<ImportStimulus, "questionCount">[],
): { valid: CheckedImportRow[]; errors: ImportRowError[]; stimuli: ImportStimulus[] } {
  const byCode = new Map(stimuli.map((s) => [s.code, s]));
  const counters = new Map<string, number>();
  const valid: CheckedImportRow[] = [];
  const errors: ImportRowError[] = [];
  for (const row of rows) {
    if (!row.stimulusCode) {
      valid.push({ ...row, stimulusOrder: null });
      continue;
    }
    if (!byCode.has(row.stimulusCode)) {
      errors.push({ rowNumber: row.rowNumber, messages: [`Stimulus ${row.stimulusCode} tidak ada di sheet 'Stimulus'`] });
      continue;
    }
    const order = (counters.get(row.stimulusCode) ?? 0) + 1;
    counters.set(row.stimulusCode, order);
    valid.push({ ...row, stimulusOrder: order });
  }
  for (const s of stimuli) {
    if (!counters.has(s.code)) {
      errors.push({ sheet: "Stimulus", rowNumber: s.rowNumber, messages: [`Stimulus ${s.code} tidak dipakai soal mana pun`] });
    }
  }
  return {
    valid,
    errors,
    stimuli: stimuli.filter((s) => counters.has(s.code)).map((s) => ({ ...s, questionCount: counters.get(s.code)! })),
  };
}
