import { describe, expect, it } from "vitest";
import { mergeAttribution, parseAttribution, sanitizeUtmValue, serializeAttribution, touchFromSearchParams, withUtm } from "./attribution";

const at = new Date("2026-11-03T00:00:00Z");

describe("sanitasi UTM", () => {
  it("huruf kecil, hanya [a-z0-9-_], maks. 64", () => {
    expect(sanitizeUtmValue(" Instagram ")).toBe("instagram");
    expect(sanitizeUtmValue("gel_2-a")).toBe("gel_2-a");
    expect(sanitizeUtmValue("a".repeat(64))).toBe("a".repeat(64));
    expect(sanitizeUtmValue("a".repeat(65))).toBeNull();
    expect(sanitizeUtmValue("ig dm")).toBeNull();
    expect(sanitizeUtmValue("<script>")).toBeNull();
    expect(sanitizeUtmValue("")).toBeNull();
    expect(sanitizeUtmValue(null)).toBeNull();
  });
});

describe("touch dari query", () => {
  it("ambil hanya nilai yang valid", () => {
    const p = new URLSearchParams("utm_source=Instagram&utm_medium=dm&utm_campaign=gel2&utm_content=file&utm_term=x%20y&foo=1");
    expect(touchFromSearchParams(p, "/materi/tips-gelombang-2", at)).toEqual({
      source: "instagram",
      medium: "dm",
      campaign: "gel2",
      content: "file",
      path: "/materi/tips-gelombang-2",
      at: Math.floor(at.getTime() / 1000),
    });
  });
  it("tanpa utm valid → null", () => {
    expect(touchFromSearchParams(new URLSearchParams("utm_source=%%%"), "/", at)).toBeNull();
    expect(touchFromSearchParams(new URLSearchParams("ref=AB"), "/", at)).toBeNull();
  });
});

describe("cookie atribusi", () => {
  const a = touchFromSearchParams(new URLSearchParams("utm_campaign=gel2"), "/materi/a", at)!;
  const b = touchFromSearchParams(new URLSearchParams("utm_campaign=buket"), "/daftar", at)!;

  it("first tidak ditimpa, last diperbarui", () => {
    const one = mergeAttribution(null, a);
    const two = mergeAttribution(one, b);
    expect(two.first.campaign).toBe("gel2");
    expect(two.last.campaign).toBe("buket");
  });
  it("serialize ↔ parse, termasuk bentuk ter-encode", () => {
    const c = mergeAttribution(null, a);
    expect(parseAttribution(serializeAttribution(c))).toEqual(c);
    expect(parseAttribution(encodeURIComponent(serializeAttribution(c)))).toEqual(c);
  });
  it("cookie rusak → null, tidak melempar", () => {
    expect(parseAttribution("{bukan json")).toBeNull();
    expect(parseAttribution('{"first":{"campaign":"DROP TABLE"}}')).toBeNull();
    expect(parseAttribution("%E0%A4%A")).toBeNull();
    expect(parseAttribution(undefined)).toBeNull();
  });
});

describe("withUtm", () => {
  const q = "utm_source=instagram&utm_campaign=gel2&next=/x";
  it("tambahkan utm_* ke link internal", () => {
    expect(withUtm("/daftar?next=%2Fmateri%2Fa", q)).toBe("/daftar?next=%2Fmateri%2Fa&utm_source=instagram&utm_campaign=gel2");
    expect(withUtm("/masuk", q)).toBe("/masuk?utm_source=instagram&utm_campaign=gel2");
  });
  it("tanpa utm / link eksternal → apa adanya", () => {
    expect(withUtm("/masuk", "next=/x")).toBe("/masuk");
    expect(withUtm("https://example.com", q)).toBe("https://example.com");
    expect(withUtm("//evil.com", q)).toBe("//evil.com");
  });
  it("tidak menimpa utm yang sudah ada di href", () => {
    expect(withUtm("/daftar?utm_campaign=jurus", q)).toBe("/daftar?utm_campaign=jurus&utm_source=instagram");
  });
});
