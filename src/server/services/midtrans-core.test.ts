import { describe, expect, it } from "vitest";
import { mapMidtransStatus, midtransSignature, verifyMidtransSignature } from "./midtrans-core";

const KEY = "SB-Mid-server-UJI";

describe("signature Midtrans", () => {
  const base = { order_id: "PTM-1-abc", status_code: "200", gross_amount: "50000.00", transaction_status: "settlement" };
  it("cocok dengan formula Midtrans & menolak yang diubah", () => {
    const sig = midtransSignature(base, KEY);
    expect(verifyMidtransSignature({ ...base, signature_key: sig }, KEY)).toBe(true);
    expect(verifyMidtransSignature({ ...base, gross_amount: "1.00", signature_key: sig }, KEY)).toBe(false);
    expect(verifyMidtransSignature({ ...base, signature_key: sig }, "kunci-lain")).toBe(false);
    expect(verifyMidtransSignature({ ...base }, KEY)).toBe(false);
    expect(verifyMidtransSignature({ ...base, signature_key: "zz" }, KEY)).toBe(false);
  });
});

describe("mapMidtransStatus", () => {
  it("memetakan status Midtrans", () => {
    expect(mapMidtransStatus("settlement")).toBe("paid");
    expect(mapMidtransStatus("capture", "accept")).toBe("paid");
    expect(mapMidtransStatus("capture", "challenge")).toBe("pending");
    expect(mapMidtransStatus("capture", "deny")).toBe("failed");
    expect(mapMidtransStatus("pending")).toBe("pending");
    expect(mapMidtransStatus("expire")).toBe("expired");
    expect(mapMidtransStatus("cancel")).toBe("cancelled");
    expect(mapMidtransStatus("deny")).toBe("failed");
    expect(mapMidtransStatus("refund")).toBe("refunded");
  });
});
