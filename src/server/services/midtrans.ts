// Client Midtrans (Snap redirect + Status API) — SERVER-ONLY.
// Env: MIDTRANS_SERVER_KEY (rahasia), MIDTRANS_IS_PRODUCTION ("true" untuk
// produksi; selain itu sandbox). MIDTRANS_API_BASE / MIDTRANS_SNAP_BASE hanya
// untuk pengujian dengan server tiruan.

import type { MidtransPayload } from "./midtrans-status";

export class MidtransError extends Error {}

function config() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY?.trim();
  if (!serverKey) throw new MidtransError("Pembayaran belum dikonfigurasi (MIDTRANS_SERVER_KEY belum diisi).");
  const production = process.env.MIDTRANS_IS_PRODUCTION === "true";
  return {
    serverKey,
    production,
    snapBase: process.env.MIDTRANS_SNAP_BASE?.trim() || (production ? "https://app.midtrans.com" : "https://app.sandbox.midtrans.com"),
    apiBase: process.env.MIDTRANS_API_BASE?.trim() || (production ? "https://api.midtrans.com" : "https://api.sandbox.midtrans.com"),
  };
}

export function midtransServerKey() {
  return config().serverKey;
}

export function isMidtransConfigured() {
  return Boolean(process.env.MIDTRANS_SERVER_KEY?.trim());
}

async function call(url: string, init: RequestInit) {
  const { serverKey } = config();
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
  const body = await res.json().catch(() => ({}));
  return { res, body: body as Record<string, unknown> };
}

/** Buat transaksi Snap; siswa diarahkan ke `redirectUrl` (halaman bayar Midtrans). */
export async function createSnapTransaction(input: {
  orderCode: string;
  amount: number;
  itemName: string;
  customer: { name: string; email: string };
  finishUrl: string;
}): Promise<{ token: string; redirectUrl: string }> {
  const { snapBase } = config();
  const { res, body } = await call(`${snapBase}/snap/v1/transactions`, {
    method: "POST",
    body: JSON.stringify({
      transaction_details: { order_id: input.orderCode, gross_amount: input.amount },
      item_details: [{ id: input.orderCode.slice(0, 50), price: input.amount, quantity: 1, name: input.itemName.slice(0, 50) }],
      customer_details: { first_name: input.customer.name.slice(0, 255), email: input.customer.email },
      callbacks: { finish: input.finishUrl },
      expiry: { unit: "hours", duration: 24 },
    }),
  });
  if (!res.ok || typeof body.token !== "string" || typeof body.redirect_url !== "string") {
    const messages = Array.isArray(body.error_messages) ? (body.error_messages as string[]).join("; ") : `HTTP ${res.status}`;
    throw new MidtransError(`Midtrans menolak transaksi: ${messages}`);
  }
  return { token: body.token, redirectUrl: body.redirect_url };
}

/** Status transaksi terkini dari Midtrans (sumber kebenaran). `null` bila belum ada transaksi. */
export async function getTransactionStatus(orderCode: string): Promise<MidtransPayload | null> {
  const { apiBase } = config();
  const { res, body } = await call(`${apiBase}/v2/${encodeURIComponent(orderCode)}/status`, { method: "GET" });
  if (res.status === 404 || body.status_code === "404") return null;
  if (!res.ok || typeof body.transaction_status !== "string") throw new MidtransError(`Gagal membaca status Midtrans (HTTP ${res.status}).`);
  return body as unknown as MidtransPayload;
}
