import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { compressImage } from "./question-images";

describe("compressImage", () => {
  it("menerima PNG dan mengubahnya ke WebP", async () => {
    const png = await sharp({ create: { width: 20, height: 10, channels: 3, background: "#1e3a8a" } }).png().toBuffer();
    const out = await compressImage(png);
    expect(out.mime).toBe("image/webp");
    expect([out.width, out.height]).toEqual([20, 10]);
  });

  it("menolak SVG walau dikirim sebagai gambar", async () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>');
    await expect(compressImage(svg)).rejects.toThrow(/tidak didukung/);
  });
});
