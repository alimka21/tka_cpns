// Penyedia pembayaran aktif (Xendit Invoice, Midtrans Snap, DOKU Checkout, atau manual) — SERVER-ONLY.
// Env PAYMENT_PROVIDER = "xendit" | "midtrans" | "doku" | "manual". "manual" = QRIS statis
// + kode unik + bukti via WhatsApp, dikonfirmasi admin (lib/manual-payment.ts). Kosong →
// gateway pertama yang terkonfigurasi DAN mode Live (Xendit → Midtrans → DOKU), selain itu manual. Order lama tetap disinkronkan ke penyedia yang membuatnya
// (dibedakan dari prefix kode order).
//
// Mode uji (Sandbox): pembayaran bukan uang sungguhan, jadi hanya admin dan
// email di PAYMENT_TEST_EMAILS (dipisah koma) yang bisa membuat order — siswa
// lain tidak bisa mendapat Premium lewat simulator.

import { isDokuConfigured, isDokuProduction } from "./doku";
import { isMidtransConfigured, isMidtransProduction } from "./midtrans";
import { isXenditConfigured, isXenditProduction } from "./xendit";

export const PAYMENT_PROVIDERS = ["xendit", "midtrans", "doku", "manual"] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export const PROVIDER_LABEL: Record<PaymentProvider, string> = { xendit: "Xendit", midtrans: "Midtrans", doku: "DOKU", manual: "QRIS manual" };

/** Prefix kode order per penyedia; order DOKU (termasuk yang lama) memakai "WTP-". */
export const MIDTRANS_ORDER_PREFIX = "PTM-";
export const XENDIT_ORDER_PREFIX = "PTX-";
export const MANUAL_ORDER_PREFIX = "PTQ-";
export const ORDER_PREFIX: Record<PaymentProvider, string> = { xendit: XENDIT_ORDER_PREFIX, midtrans: MIDTRANS_ORDER_PREFIX, doku: "WTP-", manual: MANUAL_ORDER_PREFIX };

export function activeProvider(): PaymentProvider {
  const v = process.env.PAYMENT_PROVIDER?.trim().toLowerCase();
  if ((PAYMENT_PROVIDERS as readonly string[]).includes(v ?? "")) return v as PaymentProvider;
  // Tanpa env: gateway pertama yang sudah LIVE; kalau belum ada, QRIS manual
  // (siswa tetap bisa membeli Premium selama gateway masih mode uji/belum aktif).
  const live = (["xendit", "midtrans", "doku"] as const).find((p) => isProviderConfigured(p) && isProviderProduction(p));
  return live ?? "manual";
}

export function providerOfOrder(orderCode: string): PaymentProvider {
  if (orderCode.startsWith(XENDIT_ORDER_PREFIX)) return "xendit";
  if (orderCode.startsWith(MANUAL_ORDER_PREFIX)) return "manual";
  return orderCode.startsWith(MIDTRANS_ORDER_PREFIX) ? "midtrans" : "doku";
}

export function isProviderConfigured(p: PaymentProvider) {
  if (p === "manual") return true;
  return p === "xendit" ? isXenditConfigured() : p === "midtrans" ? isMidtransConfigured() : isDokuConfigured();
}

export function isProviderProduction(p: PaymentProvider) {
  if (p === "manual") return true;
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
