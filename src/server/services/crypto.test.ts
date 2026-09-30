import { describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret, maskSecret } from "./crypto";

const SECRET = "rahasia-uji-yang-cukup-panjang";

describe("crypto", () => {
  it("enkripsi → dekripsi kembali ke teks asli, IV acak tiap kali", () => {
    const a = encryptSecret("AIzaSyContohKey123456", SECRET);
    const b = encryptSecret("AIzaSyContohKey123456", SECRET);
    expect(a).not.toBe(b);
    expect(a).not.toContain("AIza");
    expect(decryptSecret(a, SECRET)).toBe("AIzaSyContohKey123456");
  });

  it("secret berbeda atau data diubah → gagal", () => {
    const enc = encryptSecret("rahasia", SECRET);
    expect(() => decryptSecret(enc, "secret-lain-yang-juga-panjang")).toThrow();
    const parts = enc.split(".");
    parts[3] = Buffer.from("xx").toString("base64url");
    expect(() => decryptSecret(parts.join("."), SECRET)).toThrow();
  });

  it("secret terlalu pendek ditolak", () => {
    expect(() => encryptSecret("x", "pendek")).toThrow(/ENCRYPTION_SECRET/);
  });

  it("maskSecret", () => {
    expect(maskSecret("AIzaSyContohKeyab12")).toBe("AIza…ab12");
    expect(maskSecret("abc")).toBe("••••");
  });
});
