import { describe, expect, it } from "vitest";
import { parseAmountQuery, parseTransactionFilters, periodStart, startOfDayWib, startOfMonthWib } from "./transaction-filters";

describe("parseAmountQuery", () => {
  it("mengenali nominal dalam berbagai format", () => {
    expect(parseAmountQuery("Rp27.023")).toBe(27023);
    expect(parseAmountQuery("rp 27.023")).toBe(27023);
    expect(parseAmountQuery("27023")).toBe(27023);
  });
  it("bukan nominal", () => {
    expect(parseAmountQuery("budi")).toBeNull();
    expect(parseAmountQuery("PTQ-12")).toBeNull();
    expect(parseAmountQuery("12")).toBeNull();
  });
});

describe("periode WIB", () => {
  // 16 Okt 2026 20.00 UTC = 17 Okt 03.00 WIB
  const now = new Date("2026-10-16T20:00:00Z");
  it("awal hari & bulan mengikuti WIB", () => {
    expect(startOfDayWib(now).toISOString()).toBe("2026-10-16T17:00:00.000Z");
    expect(startOfMonthWib(now).toISOString()).toBe("2026-09-30T17:00:00.000Z");
  });
  it("7 hari = hari ini + 6 hari sebelumnya", () => {
    expect(periodStart("7d", now)?.toISOString()).toBe("2026-10-10T17:00:00.000Z");
    expect(periodStart(undefined, now)).toBeNull();
  });
});

it("filter tidak valid diabaikan", () => {
  expect(parseTransactionFilters({ status: "x", periode: "7d", hal: "2" })).toEqual({ status: undefined, periode: "7d", q: undefined, hal: 2 });
});
