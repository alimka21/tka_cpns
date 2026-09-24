import { describe, expect, it } from "vitest";
import { formatDuration, remainingMs } from "./exam";

describe("exam helpers", () => {
  it("remainingMs tidak pernah negatif", () => {
    expect(remainingMs(1000, 400)).toBe(600);
    expect(remainingMs(1000, 5000)).toBe(0);
  });

  it("formatDuration", () => {
    expect(formatDuration(125_000)).toBe("02:05");
    expect(formatDuration(3_725_000)).toBe("01:02:05");
    expect(formatDuration(1)).toBe("00:01");
    expect(formatDuration(0)).toBe("00:00");
  });
});
