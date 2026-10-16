// Penyedia pembayaran aktif (Xendit Invoice, Midtrans Snap, atau DOKU Checkout) — SERVER-ONLY.
// Env PAYMENT_PROVIDER = "xendit" | "midtrans" | "doku". Kosong → Xendit bila
// XENDIT_SECRET_KEY terisi, lalu Midtrans bila MIDTRANS_SERVER_KEY terisi,
// selain itu DOKU. Order lama tetap disinkronkan ke penyedia yang membuatnya
// (dibedakan dari prefix kode order).
//
// Mode uji (Sandbox): pembayaran bukan uang sungguhan, jadi hanya admin dan
// email di PAYMENT_TEST_EMAILS (dipisah koma) yang bisa membuat order — siswa
// lain tidak bisa mendapat Premium lewat simulator.

import { isDokuConfigured, isDokuProduction } from "./doku";
import { isMidtransConfigured, isMidtransProduction } from "./midtrans";
import { isXenditConfigured, isXenditProduction } from "./xendit";

export const PAYMENT_PROVIDERS = ["xendit", "midtrans", "doku"] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export const PROVIDER_LABEL: Record<PaymentProvider, string> = { xendit: "Xendit", midtrans: "Midtrans", doku: "DOKU" };

/** Prefix kode order per penyedia; order DOKU (termasuk yang lama) memakai "WTP-". */
export const MIDTRANS_ORDER_PREFIX = "PTM-";
export const XENDIT_ORDER_PREFIX = "PTX-";
export const ORDER_PREFIX: Record<PaymentProvider, string> = { xendit: XENDIT_ORDER_PREFIX, midtrans: MIDTRANS_ORDER_PREFIX, doku: "WTP-" };

export function activeProvider(): PaymentProvider {
  const v = process.env.PAYMENT_PROVIDER?.trim().toLowerCase();
  if ((PAYMENT_PROVIDERS as readonly string[]).includes(v ?? "")) return v as PaymentProvider;
  if (isXenditConfigured()) return "xendit";
  return isMidtransConfigured() ? "midtrans" : "doku";
}

export function providerOfOrder(orderCode: string): PaymentProvider {
  if (orderCode.startsWith(XENDIT_ORDER_PREFIX)) return "xendit";
  return orderCode.startsWith(MIDTRANS_ORDER_PREFIX) ? "midtrans" : "doku";
}

export function isProviderConfigured(p: PaymentProvider) {
  return p === "xendit" ? isXenditConfigured() : p === "midtrans" ? isMidtransConfigured() : isDokuConfigured();
}

export function isProviderProduction(p: PaymentProvider) {
  return p === "xendit" ? isXenditProduction() : p === "midtrans" ? isMidtransProduction() : isDokuProduction();
}

function testEmails() {
  return new Set(
    (process.env.PAYMENT_TEST_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

/** Status pembayaran untuk user ini: siap bayar, mode uji (bukan penguji), atau belum dikonfigurasi. */
export function paymentAvailability(user: { email: string; role?: string | null }) {
  const provider = activeProvider();
  const configured = isProviderConfigured(provider);
  const production = isProviderProduction(provider);
  const tester = user.role === "admin" || testEmails().has(user.email.trim().toLowerCase());
  return { provider, label: PROVIDER_LABEL[provider], configured, production, canPay: configured && (production || tester), testMode: configured && !production };
}
