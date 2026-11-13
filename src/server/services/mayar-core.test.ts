import { describe, expect, it } from "vitest";
import { mapMayarStatus, mayarPaidChannel, verifyMayarWebhookToken, webhookCandidateIds, webhookOrderCode } from "./mayar-core";

describe("mapMayarStatus", () => {
  it("paid → paid; closed dengan transaksi lunas → paid", () => {
    expect(mapMayarStatus({ status: "paid" })).toBe("paid");
    expect(mapMayarStatus({ status: "closed", transactions: [{ status: "paid" }] })).toBe("paid");
    expect(mapMayarStatus({ status: "unpaid", transactions: [{ status: "SUCCESS" }] })).toBe("paid");
  });
  it("closed/expired tanpa lunas → expired; lainnya pending", () => {
    expect(mapMayarStatus({ status: "closed" })).toBe("expired");
    expect(mapMayarStatus({ status: "expired", transactions: [{ status: "created" }] })).toBe("expired");
    expect(mapMayarStatus({ status: "unpaid" })).toBe("pending");
    expect(mapMayarStatus({ status: "???" })).toBe("pending");
  });
});

describe("mayarPaidChannel", () => {
  it("ambil metode transaksi lunas", () => {
    expect(mayarPaidChannel({ transactions: [{ status: "created", paymentMethod: "VA" }, { status: "paid", paymentMethod: "QRIS" }] })).toBe("QRIS");
    expect(mayarPaidChannel({ transactions: [] })).toBeNull();
  });
});

describe("webhook helpers", () => {
  it("kandidat id unik & berurutan", () => {
    expect(webhookCandidateIds({ id: "t1", productId: "p1", transactionId: "t1" })).toEqual(["p1", "t1"]);
    expect(webhookCandidateIds(null)).toEqual([]);
  });
  it("orderCode dari extraData", () => {
    expect(webhookOrderCode({ extraData: { orderCode: "PTY-1-A" } })).toBe("PTY-1-A");
    expect(webhookOrderCode({ extraData: null })).toBeNull();
  });
  it("token harus persis sama", () => {
    expect(verifyMayarWebhookToken("abc123", "abc123")).toBe(true);
    expect(verifyMayarWebhookToken("abc124", "abc123")).toBe(false);
    expect(verifyMayarWebhookToken(null, "abc123")).toBe(false);
    expect(verifyMayarWebhookToken("", "")).toBe(false);
  });
});
