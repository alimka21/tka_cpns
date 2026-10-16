import { describe, expect, it } from "vitest";
import { mapXenditStatus, verifyXenditCallbackToken } from "./xendit-core";

describe("mapXenditStatus", () => {
  it("PAID & SETTLED → paid, EXPIRED → expired, lainnya pending", () => {
    expect(mapXenditStatus("PAID")).toBe("paid");
    expect(mapXenditStatus("SETTLED")).toBe("paid");
    expect(mapXenditStatus("EXPIRED")).toBe("expired");
    expect(mapXenditStatus("PENDING")).toBe("pending");
    expect(mapXenditStatus("UNKNOWN_ENUM_VALUE")).toBe("pending");
  });
});

describe("verifyXenditCallbackToken", () => {
  it("hanya token yang persis sama", () => {
    expect(verifyXenditCallbackToken("abc123", "abc123")).toBe(true);
    expect(verifyXenditCallbackToken("abc124", "abc123")).toBe(false);
    expect(verifyXenditCallbackToken("abc", "abc123")).toBe(false);
    expect(verifyXenditCallbackToken(null, "abc123")).toBe(false);
    expect(verifyXenditCallbackToken("", "")).toBe(false);
  });
});
