// Client Midtrans (Snap redirect + Status API) — SERVER-ONLY.
// Env: MIDTRANS_SERVER_KEY (rahasia; Dashboard Midtrans → Pengaturan → Akses Key),
// MIDTRANS_IS_PRODUCTION ("true" untuk produksi; selain itu sandbox),
// MIDTRANS_ENABLED_PAYMENTS (opsional, kode dipisah koma, mis. "other_qris,gopay";
// kosong = semua metode yang aktif). MIDTRANS_API_BASE / MIDTRANS_SNAP_BASE hanya
// untuk pengujian dengan server tiruan.

import { randomUUID } from "node:crypto";
import type { MidtransPayload } from "./midtrans-core";

export class MidtransError extends Error {}

/** Path webhook kita (Pengaturan → Pembayaran → URL notifikasi di dashboard Midtrans). */
export const MIDTRANS_NOTIFICATION_PATH = "/api/midtrans/notification";

/** Nilai env bersih: tanpa spasi/baris baru & tanpa tanda kutip yang ikut tersalin di hPanel. */
function env(name: string) {
  const v = process.env[name]?.trim().replace(/^(['"])(.*)\1$/, "$2").trim();
  return v || undefined;
}

export function isMidtransConfigured() {
  return Boolean(env("MIDTRANS_SERVER_KEY"));
}

export function isMidtransProduction() {
  return env("MIDTRANS_IS_PRODUCTION")?.toLowerCase() === "true";
}

function bases() {
  const production = isMidtransProduction();
  return {
    snapBase: env("MIDTRANS_SNAP_BASE") || (production ? "https://app.midtrans.com" : "https://app.sandbox.midtrans.com"),
    apiBase: env("MIDTRANS_API_BASE") || (production ? "https://api.midtrans.com" : "https://api.sandbox.midtrans.com"),
  };
}

export function midtransServerKey() {
  const key = env("MIDTRANS_SERVER_KEY");
  if (!key) throw new MidtransError("Pembayaran belum dikonfigurasi (MIDTRANS_SERVER_KEY belum diisi).");
  return key;
}

export function midtransEnabledPayments(): string[] {
  return (env("MIDTRANS_ENABLED_PAYMENTS") ?? "")
    .split(",")
    .map((m) => m.trim().toLowerCase())
    .filter((m) => /^[a-z0-9_]{2,40}$/.test(m));
}

/** Info aman untuk ditampilkan ke admin (tanpa Server Key). */
export function midtransPublicInfo() {
  const key = env("MIDTRANS_SERVER_KEY") ?? "";
  const production = isMidtransProduction();
  return {
    production,
    ...bases(),
    // Key Sandbox diawali "SB-Mid-server-", Production "Mid-server-".
    keyKind: !key ? "kosong" : key.startsWith("SB-") ? "Sandbox" : "Production",
    keyMismatch: Boolean(key) && key.startsWith("SB-") === production,
    keyLength: key.length,
    enabledPayments: midtransEnabledPayments(),
  };
}

async function call(url: string, init: RequestInit) {
  const serverKey = midtransServerKey();
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        authorization: `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`,
      },
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
    });
  } catch {
    throw new MidtransError("Tidak bisa terhubung ke Midtrans. Coba lagi.");
  }
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { res, body };
}

function errorText(body: Record<string, unknown>, status: number) {
  if (Array.isArray(body.error_messages)) return (body.error_messages as unknown[]).map(String).join("; ");
  return typeof body.status_message === "string" ? body.status_message : `HTTP ${status}`;
}

/** Buat transaksi Snap; siswa diarahkan ke `redirectUrl` (halaman bayar Midtrans). */
export async function createSnapTransaction(input: {
  orderCode: string;
  amount: number;
  itemName: string;
  customer: { name: string; email?: string };
  finishUrl: string;
}): Promise<{ token: string; redirectUrl: string }> {
  const enabled = midtransEnabledPayments();
  const { res, body } = await call(`${bases().snapBase}/snap/v1/transactions`, {
    method: "POST",
    body: JSON.stringify({
      transaction_details: { order_id: input.orderCode, gross_amount: input.amount },
      item_details: [{ id: input.orderCode.slice(0, 50), price: input.amount, quantity: 1, name: input.itemName.slice(0, 50) }],
      customer_details: { first_name: input.customer.name.slice(0, 255), ...(input.customer.email && { email: input.customer.email }) },
      callbacks: { finish: input.finishUrl },
      expiry: { unit: "hours", duration: 24 },
      ...(enabled.length > 0 && { enabled_payments: enabled }),
    }),
  });
  if (!res.ok || typeof body.token !== "string" || typeof body.redirect_url !== "string") {
    throw new MidtransError(`Midtrans menolak transaksi: ${errorText(body, res.status)}`);
  }
  return { token: body.token, redirectUrl: body.redirect_url };
}

/** Status transaksi terkini dari Midtrans (sumber kebenaran). `null` bila belum ada transaksi. */
export async function getTransactionStatus(orderCode: string): Promise<MidtransPayload | null> {
  const { res, body } = await call(`${bases().apiBase}/v2/${encodeURIComponent(orderCode)}/status`, { method: "GET" });
  if (res.status === 404 || body.status_code === "404") return null;
  if (!res.ok || typeof body.transaction_status !== "string") throw new MidtransError(`Gagal membaca status Midtrans: ${errorText(body, res.status)}`);
  return body as unknown as MidtransPayload;
}

/**
 * Tes Server Key tanpa membuat transaksi: Status API untuk order yang pasti
 * tidak ada. Key benar → "404 Transaction doesn't exist"; salah → 401.
 */
export async function testMidtransConnection(): Promise<{ ok: boolean; message: string }> {
  const { res, body } = await call(`${bases().apiBase}/v2/TES-KONEKSI-${randomUUID().slice(0, 8)}/status`, { method: "GET" });
  const code = String(body.status_code ?? res.status);
  const text = errorText(body, res.status);
  if (code === "401" || res.status === 401) {
    return { ok: false, message: `Midtrans menolak Server Key (${text}). Pastikan key ${isMidtransProduction() ? "Production" : "Sandbox"} sesuai MIDTRANS_IS_PRODUCTION.` };
  }
  if (code === "404") return { ok: true, message: "Server Key valid ✓ — Midtrans mengenali key (transaksi uji wajar tidak ditemukan)." };
  if (res.status >= 500 || code.startsWith("5")) return { ok: false, message: `Server Midtrans bermasalah (${code}): ${text}` };
  return { ok: true, message: `Server Key diterima Midtrans (${code}).` };
}
