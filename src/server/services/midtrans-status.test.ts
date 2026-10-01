import { describe, expect, it } from "vitest";
import { mapMidtransStatus, membershipWindow, midtransSignature, nextOrderStatus, verifyMidtransSignature } from "./midtrans-status";

const KEY = "SB-Mid-server-UJI";

describe("signature", () => {
  const base = { order_id: "WTP-1-abc", status_code: "200", gross_amount: "50000.00", transaction_status: "settlement" };
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

describe("nextOrderStatus", () => {
  it("status final tidak mundur", () => {
    expect(nextOrderStatus("pending", "paid")).toBe("paid");
    expect(nextOrderStatus("paid", "pending")).toBe("paid");
    expect(nextOrderStatus("paid", "expired")).toBe("paid");
    expect(nextOrderStatus("paid", "refunded")).toBe("refunded");
    expect(nextOrderStatus("expired", "pending")).toBe("expired");
    expect(nextOrderStatus("expired", "paid")).toBe("paid");
  });
});

describe("membershipWindow", () => {
  const now = new Date("2026-10-01T00:00:00Z");
  it("baru / diperpanjang / selamanya", () => {
    expect(membershipWindow(now, null, 30).endsAt).toEqual(new Date("2026-10-31T00:00:00Z"));
    const ext = membershipWindow(now, new Date("2026-10-10T00:00:00Z"), 30);
    expect(ext.startsAt).toEqual(new Date("2026-10-10T00:00:00Z"));
    expect(ext.endsAt).toEqual(new Date("2026-11-09T00:00:00Z"));
    expect(membershipWindow(now, new Date("2026-09-01T00:00:00Z"), 30).startsAt).toEqual(now);
    expect(membershipWindow(now, null, null).endsAt).toBeNull();
  });
});
