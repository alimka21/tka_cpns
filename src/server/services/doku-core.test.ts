import { createHash, createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { dokuDigest, dokuSignature, dokuTimestamp, mapDokuStatus, membershipWindow, nextOrderStatus, parseDokuStatus, verifyDokuNotification } from "./doku-core";

const creds = { clientId: "BRN-0001-UJI", secretKey: "SK-rahasia-uji" };

describe("signature DOKU", () => {
  it("komponen sesuai dokumentasi: per baris, Digest = base64 SHA-256 body", () => {
    const body = JSON.stringify({ order: { amount: 20000, invoice_number: "INV-1" } });
    const component = [
      "Client-Id:BRN-0001-UJI",
      "Request-Id:req-1",
      "Request-Timestamp:2026-10-07T08:45:42Z",
      "Request-Target:/checkout/v1/payment",
      `Digest:${createHash("sha256").update(body).digest("base64")}`,
    ].join("\n");
    const expected = `HMACSHA256=${createHmac("sha256", creds.secretKey).update(component).digest("base64")}`;
    expect(dokuSignature({ clientId: creds.clientId, requestId: "req-1", timestamp: "2026-10-07T08:45:42Z", target: "/checkout/v1/payment", body }, creds.secretKey)).toBe(expected);
    expect(dokuDigest(body)).toBe(createHash("sha256").update(body).digest("base64"));
  });

  it("GET tanpa Digest", () => {
    const sig = dokuSignature({ clientId: "c", requestId: "r", timestamp: "t", target: "/orders/v1/status/INV-1" }, "k");
    const expected = `HMACSHA256=${createHmac("sha256", "k").update("Client-Id:c\nRequest-Id:r\nRequest-Timestamp:t\nRequest-Target:/orders/v1/status/INV-1").digest("base64")}`;
    expect(sig).toBe(expected);
  });

  it("timestamp ISO UTC tanpa milidetik", () => {
    expect(dokuTimestamp(new Date("2026-10-07T08:45:42.123Z"))).toBe("2026-10-07T08:45:42Z");
  });
});

describe("verifyDokuNotification", () => {
  const now = new Date("2026-10-07T09:00:00Z");
  const raw = JSON.stringify({ order: { invoice_number: "WTP-1-A", amount: 50000 }, transaction: { status: "SUCCESS" } });
  const headers = (over: Partial<Record<string, string>> = {}, body = raw) => {
    const h = { clientId: creds.clientId, requestId: "n-1", timestamp: "2026-10-07T08:59:00Z", ...over };
    return { ...h, signature: over.signature ?? dokuSignature({ ...h, target: "/api/doku/notification", body }, creds.secretKey) };
  };
  it("menerima notifikasi sah", () => {
    expect(verifyDokuNotification(headers(), raw, "/api/doku/notification", creds, now)).toBe(true);
  });
  it("menolak body diubah, target lain, client lain, kunci lain, timestamp basi, header hilang", () => {
    expect(verifyDokuNotification(headers(), raw.replace("50000", "1000"), "/api/doku/notification", creds, now)).toBe(false);
    expect(verifyDokuNotification(headers(), raw, "/api/lain", creds, now)).toBe(false);
    expect(verifyDokuNotification(headers({ clientId: "BRN-LAIN" }), raw, "/api/doku/notification", creds, now)).toBe(false);
    expect(verifyDokuNotification(headers(), raw, "/api/doku/notification", { ...creds, secretKey: "salah" }, now)).toBe(false);
    expect(verifyDokuNotification(headers({ timestamp: "2026-10-01T00:00:00Z" }), raw, "/api/doku/notification", creds, now)).toBe(false);
    expect(verifyDokuNotification({ ...headers(), signature: null }, raw, "/api/doku/notification", creds, now)).toBe(false);
  });
});

describe("status", () => {
  it("memetakan status DOKU", () => {
    expect(mapDokuStatus("SUCCESS")).toBe("paid");
    expect(mapDokuStatus("PENDING")).toBe("pending");
    expect(mapDokuStatus("REDIRECT")).toBe("pending");
    expect(mapDokuStatus("EXPIRED")).toBe("expired");
    expect(mapDokuStatus("TIMEOUT")).toBe("expired");
    expect(mapDokuStatus("FAILED")).toBe("failed");
    expect(mapDokuStatus("REFUNDED")).toBe("refunded");
    expect(mapDokuStatus(undefined)).toBe("pending");
  });

  it("parseDokuStatus membaca body Check Status / notifikasi", () => {
    expect(parseDokuStatus({ order: { invoice_number: "WTP-1", amount: "50000" }, transaction: { status: "SUCCESS", date: "2026-10-07T08:00:00Z" }, channel: { id: "QRIS" } })).toMatchObject({
      invoiceNumber: "WTP-1",
      amount: 50000,
      status: "SUCCESS",
      channel: "QRIS",
    });
    expect(parseDokuStatus({ order: { invoice_number: "WTP-1" } })).toBeNull();
    expect(parseDokuStatus(null)).toBeNull();
  });

  it("status final tidak mundur; gagal → lunas boleh (coba ulang di Checkout)", () => {
    expect(nextOrderStatus("paid", "pending")).toBe("paid");
    expect(nextOrderStatus("paid", "refunded")).toBe("refunded");
    expect(nextOrderStatus("expired", "pending")).toBe("expired");
    expect(nextOrderStatus("failed", "paid")).toBe("paid");
    expect(nextOrderStatus("pending", "paid")).toBe("paid");
  });

  it("masa aktif diperpanjang dari akhir yang masih berjalan", () => {
    const now = new Date("2026-10-07T00:00:00Z");
    const end = new Date("2026-10-17T00:00:00Z");
    expect(membershipWindow(now, end, 30).endsAt?.toISOString()).toBe("2026-11-16T00:00:00.000Z");
    expect(membershipWindow(now, null, null).endsAt).toBeNull();
  });
});
