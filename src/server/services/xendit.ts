// Client Xendit Invoice (halaman bayar hosted + cek status) — SERVER-ONLY.
// Env: XENDIT_SECRET_KEY (rahasia; Dashboard → Settings → API Keys, buat
// "Secret Key" dengan izin Write untuk Money-in/Invoices), XENDIT_CALLBACK_TOKEN
// (Dashboard → Settings → Webhooks → Verification Token), XENDIT_PAYMENT_METHODS
// (opsional, kode dipisah koma, mis. "QRIS,BCA,BNI,OVO"; kosong = semua metode
// yang aktif di akun). Mode Test/Live ditentukan oleh key (xnd_development_… /
// xnd_production_…). XENDIT_API_BASE hanya untuk pengujian dengan server tiruan.

import type { XenditInvoice } from "./xendit-core";

export class XenditError extends Error {}

/** Path webhook kita (Dashboard Xendit → Settings → Webhooks → Invoices paid). */
export const XENDIT_NOTIFICATION_PATH = "/api/xendit/notification";

/** Nilai env bersih: tanpa spasi/baris baru & tanpa tanda kutip yang ikut tersalin di hPanel. */
function env(name: string) {
  const v = process.env[name]?.trim().replace(/^(['"])(.*)\1$/, "$2").trim();
  return v || undefined;
}

export function isXenditConfigured() {
  return Boolean(env("XENDIT_SECRET_KEY"));
}

/** Key Live diawali "xnd_production_", Test "xnd_development_". */
export function isXenditProduction() {
  return env("XENDIT_SECRET_KEY")?.startsWith("xnd_production_") ?? false;
}

export function xenditCallbackToken() {
  return env("XENDIT_CALLBACK_TOKEN") ?? "";
}

export function xenditPaymentMethods(): string[] {
  return (env("XENDIT_PAYMENT_METHODS") ?? "")
    .split(",")
    .map((m) => m.trim().toUpperCase())
    .filter((m) => /^[A-Z0-9_]{2,40}$/.test(m));
}

function apiBase() {
  return (env("XENDIT_API_BASE") ?? "https://api.xendit.co").replace(/\/$/, "");
}

/** Info aman untuk ditampilkan ke admin (tanpa Secret Key). */
export function xenditPublicInfo() {
  const key = env("XENDIT_SECRET_KEY") ?? "";
  return {
    production: isXenditProduction(),
    keyKind: !key ? "kosong" : key.startsWith("xnd_production_") ? "Live" : key.startsWith("xnd_development_") ? "Test" : "tidak dikenal",
    callbackTokenSet: Boolean(env("XENDIT_CALLBACK_TOKEN")),
    paymentMethods: xenditPaymentMethods(),
  };
}

async function call(path: string, init: RequestInit) {
  const key = env("XENDIT_SECRET_KEY");
  if (!key) throw new XenditError("Pembayaran belum dikonfigurasi (XENDIT_SECRET_KEY belum diisi).");
  let res: Response;
  try {
    res = await fetch(`${apiBase()}${path}`, {
      ...init,
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        // Basic auth: Secret Key sebagai username, password kosong.
        authorization: `Basic ${Buffer.from(`${key}:`).toString("base64")}`,
      },
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
    });
  } catch {
    throw new XenditError("Tidak bisa terhubung ke Xendit. Coba lagi.");
  }
  const body = (await res.json().catch(() => ({}))) as unknown;
  return { res, body };
}

function errorText(body: unknown, status: number) {
  const b = body as { message?: unknown; error_code?: unknown };
  return typeof b?.message === "string" ? `${b.message}${typeof b.error_code === "string" ? ` (${b.error_code})` : ""}` : `HTTP ${status}`;
}

/** Buat invoice; siswa diarahkan ke `invoiceUrl` (halaman bayar Xendit). */
export async function createInvoice(input: {
  orderCode: string;
  amount: number;
  itemName: string;
  customer: { name: string; email?: string };
  successUrl: string;
  failureUrl: string;
}): Promise<{ id: string; invoiceUrl: string }> {
  const methods = xenditPaymentMethods();
  const { res, body } = await call("/v2/invoices", {
    method: "POST",
    body: JSON.stringify({
      external_id: input.orderCode,
      amount: input.amount,
      currency: "IDR",
      description: input.itemName.slice(0, 255),
      invoice_duration: 24 * 60 * 60,
      customer: { given_names: input.customer.name.slice(0, 50), ...(input.customer.email && { email: input.customer.email }) },
      items: [{ name: input.itemName.slice(0, 255), quantity: 1, price: input.amount }],
      success_redirect_url: input.successUrl,
      failure_redirect_url: input.failureUrl,
      ...(methods.length > 0 && { payment_methods: methods }),
    }),
  });
  const inv = body as Partial<XenditInvoice>;
  if (!res.ok || typeof inv.invoice_url !== "string" || typeof inv.id !== "string") {
    throw new XenditError(`Xendit menolak transaksi: ${errorText(body, res.status)}`);
  }
  return { id: inv.id, invoiceUrl: inv.invoice_url };
}

/** Status terbaru invoice untuk kode order kita; null bila belum ada invoice. */
export async function getInvoiceByExternalId(orderCode: string): Promise<XenditInvoice | null> {
  const { res, body } = await call(`/v2/invoices?external_id=${encodeURIComponent(orderCode)}`, { method: "GET" });
  if (res.status === 404) return null;
  if (!res.ok) throw new XenditError(`Gagal mengecek status di Xendit: ${errorText(body, res.status)}`);
  const list = Array.isArray(body) ? (body as XenditInvoice[]) : [];
  // Satu order = satu invoice; bila ada lebih dari satu, pakai yang terakhir dibuat.
  return list.filter((i) => i.external_id === orderCode).at(-1) ?? null;
}

/** Uji Secret Key tanpa membuat transaksi (membaca daftar invoice, maks. 1). */
export async function testXenditConnection(): Promise<{ ok: boolean; message: string }> {
  const { res, body } = await call("/v2/invoices?limit=1", { method: "GET" });
  if (res.ok) {
    return { ok: true, message: `Terhubung ke Xendit (mode ${isXenditProduction() ? "LIVE" : "Test"}). Key bisa membaca invoice.` };
  }
  if (res.status === 401) return { ok: false, message: `Secret Key ditolak Xendit (${errorText(body, res.status)}). Salin ulang key dari Settings → API Keys.` };
  if (res.status === 403) {
    return { ok: false, message: `Key tidak punya izin Invoice (${errorText(body, res.status)}). Beri izin Write untuk Money-in/Invoices pada key ini.` };
  }
  return { ok: false, message: `Xendit menjawab ${errorText(body, res.status)}.` };
}
