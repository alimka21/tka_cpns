// Filter laporan atribusi (/admin/atribusi & API agen): rentang tanggal WIB + model
// atribusi. Satu sumber validasi supaya halaman admin dan API menghitung hal yang sama.

import { z } from "zod";

export const ATTRIBUTION_MODELS = ["first", "last"] as const;
export type AttributionModel = (typeof ATTRIBUTION_MODELS)[number];
export const MAX_RANGE_DAYS = 366;
const DEFAULT_RANGE_DAYS = 30;
const DAY_MS = 86_400_000;
const WIB_OFFSET_MS = 7 * 3_600_000;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal YYYY-MM-DD");

/** "2026-11-03" → 00.00 WIB hari itu (Date UTC). Tanggal tidak nyata (mis. 2026-02-30) → null. */
export function wibDayStart(value: string): Date | null {
  if (!isoDate.safeParse(value).success) return null;
  const [y, m, d] = value.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d));
  if (utc.getUTCFullYear() !== y || utc.getUTCMonth() !== m - 1 || utc.getUTCDate() !== d) return null;
  return new Date(utc.getTime() - WIB_OFFSET_MS);
}

/** Tanggal WIB (YYYY-MM-DD) dari sebuah waktu. */
export function wibDate(at: Date) {
  return new Date(at.getTime() + WIB_OFFSET_MS).toISOString().slice(0, 10);
}

export type AttributionRange = {
  /** YYYY-MM-DD (WIB), inklusif. */
  from: string;
  to: string;
  /** [start, end) dalam UTC — untuk query. */
  start: Date;
  end: Date;
};

/** Rentang dari input; `to` inklusif. Error = pesan Bahasa Indonesia. */
export function parseRange(from: string | undefined, to: string | undefined, now = new Date()): { ok: true; range: AttributionRange } | { ok: false; error: string } {
  const toStr = to || wibDate(now);
  const end0 = wibDayStart(toStr);
  if (!end0) return { ok: false, error: "Tanggal akhir tidak valid (YYYY-MM-DD)." };
  const fromStr = from || wibDate(new Date(end0.getTime() + WIB_OFFSET_MS - (DEFAULT_RANGE_DAYS - 1) * DAY_MS));
  const start = wibDayStart(fromStr);
  if (!start) return { ok: false, error: "Tanggal awal tidak valid (YYYY-MM-DD)." };
  const end = new Date(end0.getTime() + DAY_MS);
  if (start >= end) return { ok: false, error: "Tanggal awal harus sebelum atau sama dengan tanggal akhir." };
  if ((end.getTime() - start.getTime()) / DAY_MS > MAX_RANGE_DAYS) return { ok: false, error: `Rentang maksimal ${MAX_RANGE_DAYS} hari.` };
  return { ok: true, range: { from: fromStr, to: toStr, start, end } };
}

/** 30 hari terakhir sampai hari ini (WIB). */
export function defaultRange(now = new Date()): AttributionRange {
  const r = parseRange(undefined, undefined, now);
  if (!r.ok) throw new Error(r.error);
  return r.range;
}

/** Default first-touch: konten yang pertama kali membawa pengunjung. */
export function parseModel(value: string | undefined): AttributionModel {
  return value === "last" ? "last" : "first";
}

/** Persen pendaftar yang menjadi Premium, 1 desimal. */
export function conversionPercent(buyers: number, signups: number) {
  return signups > 0 ? Math.round((buyers / signups) * 1000) / 10 : 0;
}
