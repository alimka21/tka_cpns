import { describe, expect, it } from "vitest";
import { conversionPercent, parseModel, parseRange, wibDayStart } from "./attribution-report";

const now = new Date("2026-11-03T05:00:00Z"); // 12.00 WIB

describe("rentang tanggal WIB", () => {
  it("00.00 WIB = 17.00 UTC hari sebelumnya", () => {
    expect(wibDayStart("2026-11-03")?.toISOString()).toBe("2026-11-02T17:00:00.000Z");
    expect(wibDayStart("2026-02-30")).toBeNull();
    expect(wibDayStart("03-11-2026")).toBeNull();
  });
  it("default 30 hari terakhir sampai hari ini", () => {
    const r = parseRange(undefined, undefined, now);
    expect(r.ok && r.range.from).toBe("2026-10-05");
    expect(r.ok && r.range.to).toBe("2026-11-03");
    expect(r.ok && r.range.end.toISOString()).toBe("2026-11-03T17:00:00.000Z");
  });
  it("tanggal akhir inklusif", () => {
    const r = parseRange("2026-11-01", "2026-11-01", now);
    expect(r.ok && [r.range.start.toISOString(), r.range.end.toISOString()]).toEqual(["2026-10-31T17:00:00.000Z", "2026-11-01T17:00:00.000Z"]);
  });
  it("tolak terbalik, tidak valid, atau > 366 hari", () => {
    expect(parseRange("2026-11-02", "2026-11-01", now).ok).toBe(false);
    expect(parseRange("x", "2026-11-01", now).ok).toBe(false);
    expect(parseRange("2025-01-01", "2026-11-01", now).ok).toBe(false);
  });
});

describe("lain-lain", () => {
  it("model default first", () => {
    expect(parseModel(undefined)).toBe("first");
    expect(parseModel("last")).toBe("last");
    expect(parseModel("x")).toBe("first");
  });
  it("persen konversi", () => {
    expect(conversionPercent(1, 3)).toBe(33.3);
    expect(conversionPercent(0, 0)).toBe(0);
  });
});
