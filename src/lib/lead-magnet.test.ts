import { describe, expect, it } from "vitest";
import { ByteLru } from "./lru";
import { downloadFileName, leadMagnetInput, sniffFormat } from "./validation/lead-magnet";

const bytes = (...b: number[]) => new Uint8Array(b);
const text = (s: string) => new TextEncoder().encode(s);

describe("sniffFormat", () => {
  it("kenali PDF/PNG/JPG/WebP dari isi", () => {
    expect(sniffFormat(text("%PDF-1.7\n..."))).toBe("pdf");
    expect(sniffFormat(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0))).toBe("png");
    expect(sniffFormat(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("jpeg");
    expect(sniffFormat(text("RIFF\0\0\0\0WEBPVP8 "))).toBe("webp");
  });
  it("tolak format lain", () => {
    expect(sniffFormat(text("<svg xmlns=..."))).toBeNull();
    expect(sniffFormat(text("PK\u0003\u0004"))).toBeNull(); // zip/docx
    expect(sniffFormat(text("GIF89a"))).toBeNull();
    expect(sniffFormat(bytes())).toBeNull();
  });
});

describe("downloadFileName", () => {
  it("aman untuk header", () => {
    expect(downloadFileName("Tips Gelombang 2: \"Jurus\" Cepat!", "pdf")).toBe("Tips-Gelombang-2-Jurus-Cepat.pdf");
    expect(downloadFileName("ééé", "png")).toBe("eee.png");
    expect(downloadFileName("***", "jpeg")).toBe("materi.jpg");
  });
});

describe("leadMagnetInput", () => {
  const base = { title: "Tips Gelombang 2", requiresLogin: true, isActive: true };
  it("slug huruf kecil & tanda hubung", () => {
    expect(leadMagnetInput.parse({ ...base, slug: " Tips-Gelombang-2 " }).slug).toBe("tips-gelombang-2");
    expect(leadMagnetInput.safeParse({ ...base, slug: "tips gelombang" }).success).toBe(false);
    expect(leadMagnetInput.safeParse({ ...base, slug: "-tips" }).success).toBe(false);
    expect(leadMagnetInput.safeParse({ ...base, slug: "../x" }).success).toBe(false);
  });
  it("teks kosong → null", () => {
    expect(leadMagnetInput.parse({ ...base, slug: "abc", description: "  " }).description).toBeNull();
  });
});

describe("ByteLru", () => {
  it("buang yang paling lama dipakai saat melebihi batas byte", () => {
    const c = new ByteLru<string>(10);
    c.set("a", "A", 4);
    c.set("b", "B", 4);
    c.get("a"); // a jadi paling baru
    c.set("c", "C", 4); // total 12 > 10 → buang b
    expect(c.get("b")).toBeUndefined();
    expect(c.get("a")).toBe("A");
    expect(c.get("c")).toBe("C");
    expect(c.bytes).toBe(8);
  });
  it("entri terlalu besar tidak disimpan; deletePrefix", () => {
    const c = new ByteLru<string>(100, 10);
    c.set("big", "X", 11);
    expect(c.size).toBe(0);
    c.set("7:1", "v1", 1);
    c.set("7:2", "v2", 1);
    c.set("8:1", "w", 1);
    c.deletePrefix("7:");
    expect(c.size).toBe(1);
    expect(c.bytes).toBe(1);
  });
});
