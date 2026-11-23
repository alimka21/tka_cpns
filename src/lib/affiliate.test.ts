import { describe, expect, it } from "vitest";
import { addAffiliateInput, affiliateCodeInput, commissionAvailableAt, discountedPrice } from "./affiliate";
import { commissionAmount } from "./referral";

describe("discountedPrice & komisi", () => {
  it("diskon 5% lalu komisi 30% dari nominal dibayar", () => {
    const paid = discountedPrice(100_000, 5);
    expect(paid).toBe(95_000);
    expect(commissionAmount(paid, 30)).toBe(28_500);
  });
  it("potongan dibulatkan ke bawah; 0% = harga tetap", () => {
    expect(discountedPrice(49_999, 5)).toBe(47_500);
    expect(discountedPrice(49_000, 0)).toBe(49_000);
  });
});

describe("commissionAvailableAt", () => {
  it("7 hari setelah lunas", () => {
    expect(commissionAvailableAt(new Date("2026-11-01T00:00:00Z")).toISOString()).toBe("2026-11-08T00:00:00.000Z");
  });
});

describe("input", () => {
  it("kode dinormalisasi", () => {
    expect(affiliateCodeInput.parse("bu siti")).toBe("BUSITI");
    expect(affiliateCodeInput.safeParse("ab").success).toBe(false);
  });
  it("email huruf kecil, kolom kosong → null", () => {
    const r = addAffiliateInput.parse({ email: " Guru@Sekolah.ID ", name: "Bu Siti", school: "", phone: "0812-3456 789" });
    expect(r).toMatchObject({ email: "guru@sekolah.id", school: null, phone: "08123456789" });
  });
});
