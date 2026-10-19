import { afterEach, describe, expect, it } from "vitest";
import { paymentMethodOptions } from "./payment-provider";

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
