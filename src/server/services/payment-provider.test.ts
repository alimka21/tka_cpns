import { afterEach, describe, expect, it } from "vitest";
import { paymentMethodOptions, pickReusableCheckout } from "./payment-provider";

const ENV = ["DOKU_PAYMENT_METHODS", "PAYMENT_MANUAL_FALLBACK"] as const;
afterEach(() => ENV.forEach((k) => delete process.env[k]));

describe("paymentMethodOptions (DOKU)", () => {
  it("default: QRIS utama + satu opsi metode lain (semua channel aktif)", () => {
    const o = paymentMethodOptions("doku");
    expect(o.map((m) => m.id)).toEqual(["doku-qris", "doku-other"]);
    expect(o[0]).toMatchObject({ primary: true, channels: ["QRIS"] });
    expect(o[1].channels).toEqual([]);
  });

  it("channel terdaftar dikelompokkan; QRIS tetap utama", () => {
    process.env.DOKU_PAYMENT_METHODS = "VIRTUAL_ACCOUNT_BCA, QRIS,VIRTUAL_ACCOUNT_BRI,EMONEY_OVO,PEER_TO_PEER_KREDIVO";
    const o = paymentMethodOptions("doku");
    expect(o.map((m) => m.id)).toEqual(["doku-qris", "doku-va", "doku-ewallet", "doku-other"]);
    expect(o.find((m) => m.id === "doku-va")?.channels).toEqual(["VIRTUAL_ACCOUNT_BCA", "VIRTUAL_ACCOUNT_BRI"]);
    expect(o.filter((m) => m.primary)).toHaveLength(1);
  });

  it("tanpa QRIS: metode pertama jadi utama", () => {
    process.env.DOKU_PAYMENT_METHODS = "VIRTUAL_ACCOUNT_BCA";
    expect(paymentMethodOptions("doku")).toMatchObject([{ id: "doku-va", primary: true }]);
  });

  it("QRIS manual sebagai cadangan hanya bila diaktifkan", () => {
    expect(paymentMethodOptions("doku").some((m) => m.id === "manual")).toBe(false);
    process.env.PAYMENT_MANUAL_FALLBACK = "true";
    expect(paymentMethodOptions("doku").at(-1)?.id).toBe("manual");
  });

  it("penyedia manual: satu opsi QRIS", () => {
    expect(paymentMethodOptions("manual")).toMatchObject([{ id: "manual", primary: true }]);
  });
});

describe("pickReusableCheckout", () => {
  const now = new Date("2026-10-25T10:00:00Z");
  const base = { orderCode: "WTP-1-a", planId: 3, amount: 27_000, status: "pending", paymentType: "doku-qris", redirectUrl: "https://checkout/x", createdAt: new Date(now.getTime() - 10 * 60_000) };
  const want = { planId: 3, amount: 27_000, methodId: "doku-qris", prefix: "WTP-" };

  it("memakai checkout pending yang sama (terbaru dulu)", () => {
    const newer = { ...base, orderCode: "WTP-1-b", createdAt: new Date(now.getTime() - 2 * 60_000) };
    expect(pickReusableCheckout([base, newer], want, now)?.orderCode).toBe("WTP-1-b");
  });
  it("tidak memakai checkout yang hampir kedaluwarsa", () => {
    expect(pickReusableCheckout([{ ...base, createdAt: new Date(now.getTime() - 50 * 60_000) }], want, now)).toBeNull();
  });
  it("metode, paket, nominal, status, atau penyedia berbeda → buat baru", () => {
    expect(pickReusableCheckout([{ ...base, paymentType: "doku-other" }], want, now)).toBeNull();
    expect(pickReusableCheckout([{ ...base, planId: 4 }], want, now)).toBeNull();
    expect(pickReusableCheckout([{ ...base, amount: 30_000 }], want, now)).toBeNull();
    expect(pickReusableCheckout([{ ...base, status: "paid" }], want, now)).toBeNull();
    expect(pickReusableCheckout([{ ...base, orderCode: "PTQ-1-a" }], want, now)).toBeNull();
    expect(pickReusableCheckout([{ ...base, redirectUrl: null }], want, now)).toBeNull();
  });
});
