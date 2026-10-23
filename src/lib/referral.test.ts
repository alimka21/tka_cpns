import { describe, expect, it } from "vitest";
import { commissionAmount, generateReferralCode, maskName, normalizeReferralCode, payoutAccountInput, referralCodeInput, referralLink, REFERRAL_CODE_LENGTH } from "./referral";

describe("kode referal", () => {
  it("panjang tetap & tanpa huruf yang mudah tertukar", () => {
    for (let i = 0; i < 200; i++) {
      const c = generateReferralCode();
      expect(c).toHaveLength(REFERRAL_CODE_LENGTH);
      expect(c).not.toMatch(/[01OIL]/);
    }
  });
  it("normalisasi input", () => {
    expect(normalizeReferralCode(" pkr-7q2x ")).toBe("PKR7Q2X");
    expect(normalizeReferralCode(undefined)).toBe("");
    expect(referralCodeInput.safeParse("ab").success).toBe(false);
    expect(referralCodeInput.parse("")).toBe("");
  });
  it("link daftar", () => {
    expect(referralLink("https://pakartka.com/", "AB23CD4")).toBe("https://pakartka.com/daftar?ref=AB23CD4");
  });
});

describe("komisi", () => {
  it("20% dibulatkan ke bawah", () => {
    expect(commissionAmount(27_000, 20)).toBe(5_400);
    expect(commissionAmount(27_481, 20)).toBe(5_496);
    expect(commissionAmount(1_001, 20)).toBe(200);
  });
});

describe("tampilan & rekening", () => {
  it("menyamarkan nama", () => {
    expect(maskName("Budi Santoso")).toBe("Budi S.");
    expect(maskName("Siti Nur Aisyah")).toBe("Siti N. A.");
    expect(maskName("Raka")).toBe("Raka");
  });
  it("nomor rekening dibersihkan", () => {
    expect(payoutAccountInput.parse({ bankName: "BCA", accountNumber: "123-456 7890", accountName: "Budi" }).accountNumber).toBe("1234567890");
    expect(payoutAccountInput.safeParse({ bankName: "BCA", accountNumber: "abc", accountName: "Budi" }).success).toBe(false);
  });
});
