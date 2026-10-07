// Client DOKU Checkout (non-SNAP) — SERVER-ONLY.
// Env: DOKU_CLIENT_ID, DOKU_SECRET_KEY (rahasia; dari DOKU Back Office →
// Integration → API Keys), DOKU_IS_PRODUCTION ("true" untuk produksi; selain
// itu sandbox). DOKU_API_BASE hanya untuk pengujian dengan server tiruan.

import { randomUUID } from "node:crypto";
import { dokuSignature, dokuTimestamp, parseDokuStatus, type DokuStatus } from "./doku-core";

export class DokuError extends Error {}

/** Path webhook kita — juga Request-Target saat memverifikasi notifikasi. */
export const DOKU_NOTIFICATION_PATH = "/api/doku/notification";

/** Nilai env bersih: tanpa spasi/baris baru & tanpa tanda kutip yang ikut tersalin di hPanel. */
function env(name: string) {
  const v = process.env[name]?.trim().replace(/^(['"])(.*)\1$/, "$2").trim();
  return v || undefined;
}

function config() {
  const clientId = env("DOKU_CLIENT_ID");
  const secretKey = env("DOKU_SECRET_KEY");
  if (!clientId || !secretKey) throw new DokuError("Pembayaran belum dikonfigurasi (DOKU_CLIENT_ID / DOKU_SECRET_KEY belum diisi).");
  const production = isDokuProduction();
  return {
    clientId,
    secretKey,
    production,
    apiBase: process.env.DOKU_API_BASE?.trim() || (production ? "https://api.doku.com" : "https://api-sandbox.doku.com"),
  };
}

export function dokuCredentials() {
  const { clientId, secretKey } = config();
  return { clientId, secretKey };
}

export function isDokuConfigured() {
  return Boolean(env("DOKU_CLIENT_ID") && env("DOKU_SECRET_KEY"));
}

export function isDokuProduction() {
  return env("DOKU_IS_PRODUCTION")?.toLowerCase() === "true";
}

/** Info aman untuk ditampilkan ke admin (tanpa Secret Key). */
export function dokuPublicInfo() {
  const id = env("DOKU_CLIENT_ID") ?? "";
  return {
    production: isDokuProduction(),
    apiBase: process.env.DOKU_API_BASE?.trim() || (isDokuProduction() ? "https://api.doku.com" : "https://api-sandbox.doku.com"),
    clientIdMasked: id ? `${id.slice(0, 8)}…${id.slice(-4)} (${id.length} karakter)` : "(kosong)",
    secretKeyLength: env("DOKU_SECRET_KEY")?.length ?? 0,
  };
}

/**
 * Tes kredensial tanpa membuat transaksi: Check Status untuk invoice yang
 * pasti tidak ada. Kredensial benar → DOKU menjawab "tidak ditemukan";
 * salah → 401 dengan pesan seperti "Invalid Client-Id" / "Invalid Signature".
 */
export async function testDokuConnection(): Promise<{ ok: boolean; message: string }> {
  const { res, json } = await call(`/orders/v1/status/TES-KONEKSI-${randomUUID().slice(0, 8)}`, "GET");
  const text = errorText(json, res.status);
  if (res.status === 401 || res.status === 403 || /invalid/i.test(text)) return { ok: false, message: `DOKU menolak kredensial: ${text}` };
  if (res.status >= 500) return { ok: false, message: `Server DOKU bermasalah (HTTP ${res.status}): ${text}` };
  return { ok: true, message: `Kredensial diterima DOKU (HTTP ${res.status}).` };
}

async function call(target: string, method: "GET" | "POST", payload?: unknown) {
  const { clientId, secretKey, apiBase } = config();
  const requestId = randomUUID();
  const timestamp = dokuTimestamp();
  const body = payload === undefined ? undefined : JSON.stringify(payload);
  let res: Response;
  try {
    res = await fetch(`${apiBase}${target}`, {
      method,
      body,
      headers: {
        accept: "application/json",
        ...(body !== undefined && { "content-type": "application/json" }),
        "Client-Id": clientId,
        "Request-Id": requestId,
        "Request-Timestamp": timestamp,
        Signature: dokuSignature({ clientId, requestId, timestamp, target, body }, secretKey),
      },
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
    });
  } catch {
    throw new DokuError("Tidak bisa terhubung ke DOKU. Coba lagi.");
  }
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { res, json };
}

function errorText(json: Record<string, unknown>, status: number) {
  const msg = json.message ?? (json.error as { message?: unknown } | undefined)?.message;
  return Array.isArray(msg) ? msg.join("; ") : typeof msg === "string" ? msg : `HTTP ${status}`;
}

/** Buat halaman bayar DOKU Checkout (QRIS); siswa diarahkan ke `url`. */
export async function createCheckout(input: {
  invoiceNumber: string;
  amount: number;
  itemName: string;
  customer: { id: string; name: string; email: string };
  callbackUrl: string;
  dueMinutes?: number;
}): Promise<{ url: string; tokenId: string | null }> {
  const { res, json } = await call("/checkout/v1/payment", "POST", {
    order: {
      amount: input.amount,
      invoice_number: input.invoiceNumber,
      currency: "IDR",
      callback_url: input.callbackUrl,
      callback_url_result: input.callbackUrl,
      auto_redirect: true,
      line_items: [{ id: input.invoiceNumber.slice(0, 50), name: input.itemName.slice(0, 255), quantity: 1, price: input.amount }],
    },
    payment: { payment_due_date: input.dueMinutes ?? 60, payment_method_types: ["QRIS"] },
    customer: { id: input.customer.id, name: input.customer.name.slice(0, 255), email: input.customer.email },
  });
  const payment = (json.response as { payment?: { url?: unknown; token_id?: unknown } } | undefined)?.payment;
  if (!res.ok || typeof payment?.url !== "string") throw new DokuError(`DOKU menolak transaksi: ${errorText(json, res.status)}`);
  return { url: payment.url, tokenId: typeof payment.token_id === "string" ? payment.token_id : null };
}

/** Status terkini dari Check Status API (sumber kebenaran). `null` bila belum ada transaksi. */
export async function getOrderStatus(invoiceNumber: string): Promise<DokuStatus | null> {
  const { res, json } = await call(`/orders/v1/status/${encodeURIComponent(invoiceNumber)}`, "GET");
  if (res.status === 404) return null;
  const parsed = parseDokuStatus(json);
  if (!res.ok || !parsed) {
    // Belum dibayar sama sekali: sebagian respons DOKU tidak membawa blok transaction.
    if (res.ok) return null;
    throw new DokuError(`Gagal membaca status DOKU: ${errorText(json, res.status)}`);
  }
  return parsed;
}
