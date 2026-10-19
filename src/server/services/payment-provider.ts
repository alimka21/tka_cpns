// Penyedia pembayaran aktif (Xendit Invoice, Midtrans Snap, DOKU Checkout, atau manual) — SERVER-ONLY.
// Env PAYMENT_PROVIDER = "xendit" | "midtrans" | "doku" | "manual". "manual" = QRIS statis
// + kode unik + bukti via WhatsApp, dikonfirmasi admin (lib/manual-payment.ts). Kosong →
// gateway pertama yang terkonfigurasi DAN mode Live (Xendit → Midtrans → DOKU), selain itu manual. Order lama tetap disinkronkan ke penyedia yang membuatnya
// (dibedakan dari prefix kode order).
//
// Mode uji (Sandbox): pembayaran bukan uang sungguhan, jadi hanya admin dan
// email di PAYMENT_TEST_EMAILS (dipisah koma) yang bisa membuat order — siswa
// lain tidak bisa mendapat Premium lewat simulator.

import { dokuPaymentMethods, isDokuConfigured, isDokuProduction } from "./doku";
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

/** Pilihan cara bayar yang ditampilkan ke siswa saat membeli Premium. */
export type PaymentMethodOption = {
  id: string;
  label: string;
  hint: string;
  /** Metode utama (ditampilkan paling atas & disorot). */
  primary?: boolean;
  /** Kode channel DOKU yang dibuka di halaman DOKU Checkout; [] = semua channel aktif di akun DOKU. */
  channels?: string[];
};

const DOKU_GROUPS: { prefix: string; id: string; label: string; hint: string }[] = [
  { prefix: "VIRTUAL_ACCOUNT_", id: "doku-va", label: "Transfer bank (Virtual Account)", hint: "BCA, Mandiri, BRI, BNI, dan bank lain — bayar lewat m-banking/ATM." },
  { prefix: "EMONEY_", id: "doku-ewallet", label: "E-wallet", hint: "Bayar langsung dari aplikasi dompet digital." },
  { prefix: "ONLINE_TO_OFFLINE_", id: "doku-retail", label: "Gerai retail", hint: "Bayar tunai di Alfamart/Indomaret." },
  { prefix: "CREDIT_CARD", id: "doku-card", label: "Kartu kredit/debit", hint: "Visa, Mastercard, JCB." },
];

/** QRIS manual (transfer + bukti WhatsApp) sebagai cadangan di samping gateway: env PAYMENT_MANUAL_FALLBACK=true. */
export function isManualFallbackEnabled() {
  return process.env.PAYMENT_MANUAL_FALLBACK?.trim().toLowerCase() === "true";
}

const MANUAL_OPTION: PaymentMethodOption = {
  id: "manual",
  label: "QRIS manual (konfirmasi admin)",
  hint: "Scan QRIS, transfer tepat sesuai nominal + kode unik, lalu kirim bukti ke WhatsApp admin. Premium aktif setelah diverifikasi.",
};

/**
 * Cara bayar untuk penyedia aktif. DOKU: QRIS selalu jadi metode utama; metode lain
 * dikelompokkan dari env DOKU_PAYMENT_METHODS (kosong/"ALL" → satu opsi "metode lain" yang
 * membuka semua channel aktif di akun DOKU).
 */
export function paymentMethodOptions(provider: PaymentProvider = activeProvider()): PaymentMethodOption[] {
  if (provider === "manual") return [{ ...MANUAL_OPTION, label: "QRIS", primary: true }];
  const options: PaymentMethodOption[] = [];
  if (provider === "doku") {
    const listed = dokuPaymentMethods();
    const all = listed.length === 0;
    if (all || listed.includes("QRIS")) {
      options.push({ id: "doku-qris", label: "QRIS", hint: "Scan dari GoPay, OVO, DANA, ShopeePay, LinkAja, atau m-banking. Paling cepat, Premium aktif otomatis.", primary: true, channels: ["QRIS"] });
    }
    if (all) {
      options.push({ id: "doku-other", label: "Metode lain", hint: "Virtual Account bank, e-wallet, dan metode lain yang tersedia di halaman pembayaran DOKU.", channels: [] });
    } else {
      for (const g of DOKU_GROUPS) {
        const channels = listed.filter((c) => c.startsWith(g.prefix));
        if (channels.length) options.push({ id: g.id, label: g.label, hint: g.hint, channels });
      }
      const rest = listed.filter((c) => c !== "QRIS" && !DOKU_GROUPS.some((g) => c.startsWith(g.prefix)));
      if (rest.length) options.push({ id: "doku-other", label: "Metode lain", hint: "Metode lain yang tersedia di halaman pembayaran DOKU.", channels: rest });
    }
    if (options.length && !options.some((o) => o.primary)) options[0].primary = true;
  } else {
    options.push({ id: provider, label: `Bayar online (${PROVIDER_LABEL[provider]})`, hint: "QRIS, transfer bank (Virtual Account), atau e-wallet.", primary: true });
  }
  if (isManualFallbackEnabled()) options.push(MANUAL_OPTION);
  return options;
}
