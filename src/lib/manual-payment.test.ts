import { describe, expect, it } from "vitest";
import { formatWaNumber, manualProofMessage, pickUniqueCode, waLink } from "./manual-payment";

describe("pickUniqueCode", () => {
  it("menghindari nominal order yang masih menunggu", () => {
    const taken = Array.from({ length: 998 }, (_, i) => 27_000 + i + 1); // kode 1..998 terpakai
    expect(pickUniqueCode(27_000, taken, () => 0)).toBe(999);
  });
  it("null bila semua kode terpakai", () => {
    expect(pickUniqueCode(1000, Array.from({ length: 999 }, (_, i) => 1001 + i))).toBeNull();
  });
  it("selalu 1..999", () => {
    expect(pickUniqueCode(5000, [], () => 0)).toBe(1);
    expect(pickUniqueCode(5000, [], () => 0.99999)).toBe(999);
  });
});

describe("pesan WhatsApp", () => {
  it("berisi data wajib & tautan wa.me ter-encode", () => {
    const msg = manualProofMessage({ name: "Budi", province: "Jawa Barat", school: "SMPN 1 Bandung", account: "budi@x.id", planName: "Premium SMP", orderCode: "PTQ-1", amount: "Rp27.023" });
    expect(msg).toContain("Asal Provinsi: Jawa Barat");
    expect(msg).toContain("Nama Sekolah: SMPN 1 Bandung");
    expect(waLink(msg, "6285191537712")).toMatch(/^https:\/\/wa\.me\/6285191537712\?text=Yth\.%20Admin/);
  });
  it("format nomor lokal", () => {
    expect(formatWaNumber("6285191537712")).toBe("0851-9153-7712");
  });
});
