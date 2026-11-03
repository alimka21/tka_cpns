import { describe, expect, it } from "vitest";
import { FixedWindowLimiter } from "./rate-limit";

describe("FixedWindowLimiter", () => {
  it("tolak setelah batas, buka lagi di jendela berikutnya", () => {
    const l = new FixedWindowLimiter(2, 60_000);
    expect(l.take("a", 0).ok).toBe(true);
    expect(l.take("a", 1000).ok).toBe(true);
    const third = l.take("a", 2000);
    expect(third.ok).toBe(false);
    expect(third.retryAfter).toBe(58);
    expect(l.take("b", 2000).ok).toBe(true); // kunci lain terpisah
    expect(l.take("a", 60_000).ok).toBe(true);
  });
  it("jumlah kunci dibatasi", () => {
    const l = new FixedWindowLimiter(1, 60_000, 3);
    for (const k of ["a", "b", "c", "d", "e"]) expect(l.take(k, 0).ok).toBe(true);
  });
});
