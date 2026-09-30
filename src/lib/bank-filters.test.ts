import { describe, expect, it } from "vitest";
import { bankHref, parseBankFilters } from "./bank-filters";

describe("parseBankFilters", () => {
  it("menerima hierarki yang konsisten", () => {
    expect(parseBankFilters({ jenjang: "SMP", mapel: "SMP-MTK", topik: "SMP-MTK-D1", sub: "SMP-MTK-D1-S1" })).toMatchObject({
      jenjang: "SMP",
      mapel: "SMP-MTK",
      topik: "SMP-MTK-D1",
      sub: "SMP-MTK-D1-S1",
    });
  });

  it("membuang anak yang bukan milik induknya & nilai tidak sah", () => {
    const f = parseBankFilters({ jenjang: "SD", mapel: "SMP-MTK", topik: "SMP-MTK-D1", status: "x", hal: "-3" });
    expect(f).toEqual({ jenjang: "SD" });
  });

  it("jenjang diturunkan dari mapel bila kosong", () => {
    expect(parseBankFilters({ mapel: "SMA-FIS" }).jenjang).toBe("SMA");
  });

  it("bankHref membuang nilai kosong", () => {
    expect(bankHref({ jenjang: "SMP", mapel: undefined, q: "" })).toBe("/admin/soal?jenjang=SMP");
    expect(bankHref({})).toBe("/admin/soal");
  });
});
