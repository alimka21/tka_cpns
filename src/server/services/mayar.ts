// Client Mayar Headless API V2 (payment request + cek status) — SERVER-ONLY.
// Env: MAYAR_API_KEY (rahasia; web.mayar.id → Integration → API Keys, akses "Read & Write"),
// MAYAR_SANDBOX=true untuk akun sandbox (web.mayar.io / api.mayar.io; key sandbox berbeda),
// MAYAR_WEBHOOK_TOKEN (string acak panjang buatan kita; ikut di URL webhook sebagai ?token=,
// karena webhook Mayar tidak bertanda tangan). MAYAR_API_BASE hanya untuk server tiruan.
// V1 (/hl/v1) sudah dihentikan Mayar per 1 Okt 2026 — pakai V2.

import type { MayarPayment } from "./mayar-core";

export class MayarError extends Error {}

/** Path webhook kita (Mayar dashboard → Integration → Webhook → URL Webhook, + ?token=…). */
export const MAYAR_NOTIFICATION_PATH = "/api/mayar/notification";

/** Nilai env bersih: tanpa spasi/baris baru & tanpa tanda kutip yang ikut tersalin di hPanel. */
function env(name: string) {
  const v = process.env[name]?.trim().replace(/^(['"])(.*)\1$/, "$2").trim();
  return v || undefined;
}

export function isMayarConfigured() {
  return Boolean(env("MAYAR_API_KEY"));
}

export function isMayarProduction() {
  return isMayarConfigured() && env("MAYAR_SANDBOX")?.toLowerCase() !== "true";
}

export function mayarWebhookToken() {
  return env("MAYAR_WEBHOOK_TOKEN") ?? "";
}

/** URL lengkap yang ditempel di dashboard Mayar (berisi token rahasia — hanya untuk admin). */
export function mayarWebhookUrl(siteUrl: string) {
  const token = mayarWebhookToken();
  return `${siteUrl.replace(/\/$/, "")}${MAYAR_NOTIFICATION_PATH}${token ? `?token=${encodeURIComponent(token)}` : ""}`;
}

function apiBase() {
  const fallback = isMayarProduction() ? "https://api.mayar.id/hl/v2" : "https://api.mayar.io/hl/v2";
  return (env("MAYAR_API_BASE") ?? fallback).replace(/\/$/, "");
}

/** Info aman untuk admin (tanpa API key/token). */
export function mayarPublicInfo() {
  return { production: isMayarProduction(), webhookTokenSet: Boolean(mayarWebhookToken()) };
}

type Envelope = { statusCode?: number; messages?: string; message?: string; data?: unknown };

async function call(path: string, init: RequestInit) {
  const key = env("MAYAR_API_KEY");
  if (!key) throw new MayarError("Pembayaran belum dikonfigurasi (MAYAR_API_KEY belum diisi).");
  let res: Response;
  try {
    res = await fetch(`${apiBase()}${path}`, {
      ...init,
      headers: { accept: "application/json", "content-type": "application/json", authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
    });
  } catch {
    throw new MayarError("Tidak bisa terhubung ke Mayar. Coba lagi.");
  }
  const body = (await res.json().catch(() => ({}))) as Envelope;
  // Mayar kadang menjawab HTTP 200 dengan statusCode lain di body — body yang menentukan.
  const status = typeof body.statusCode === "number" ? body.statusCode : res.status;
  return { status, ok: res.ok && status >= 200 && status < 300, body };
}

function errorText(body: Envelope, status: number) {
  const m = body.messages ?? body.message;
  return typeof m === "string" && m ? `${m} (HTTP ${status})` : `HTTP ${status}`;
}

/** Buat payment request; siswa diarahkan ke `link` (halaman bayar Mayar). `id` disimpan di orders.transaction_id. */
export async function createPaymentRequest(input: {
  orderCode: string;
  amount: number;
  itemName: string;
  customer: { name: string; email?: string };
  redirectUrl: string;
  dueMinutes: number;
  paymentMethod?: string;
}): Promise<{ id: string; link: string }> {
  const payload: Record<string, unknown> = {
    name: input.customer.name.slice(0, 100) || "Siswa",
    amount: input.amount,
    ...(input.customer.email && { email: input.customer.email }),
    description: `${input.itemName} — ${input.orderCode}`.slice(0, 255),
    expiredAt: new Date(Date.now() + input.dueMinutes * 60_000).toISOString(),
    redirectUrl: input.redirectUrl,
    extraData: { orderCode: input.orderCode },
    ...(input.paymentMethod && { paymentMethod: input.paymentMethod }),
  };
  let r = await call("/payments/create", { method: "POST", body: JSON.stringify(payload) });
  // Beberapa akun menolak redirectUrl pada payment request → ulangi tanpa redirect (siswa kembali manual).
  if (!r.ok && r.status === 400 && /redirectUrl/i.test(String(r.body.messages ?? r.body.message ?? ""))) {
    delete payload.redirectUrl;
    r = await call("/payments/create", { method: "POST", body: JSON.stringify(payload) });
  }
  const data = r.body.data as { id?: unknown; link?: unknown } | undefined;
  if (!r.ok || typeof data?.id !== "string" || typeof data?.link !== "string") {
    throw new MayarError(`Mayar menolak transaksi: ${errorText(r.body, r.status)}`);
  }
  return { id: data.id, link: data.link };
}

/** Detail & status payment request; null bila tidak ditemukan. */
export async function getPayment(id: string): Promise<MayarPayment | null> {
  const r = await call(`/payments/${encodeURIComponent(id)}`, { method: "GET" });
  if (r.status === 404) return null;
  if (!r.ok) throw new MayarError(`Gagal mengecek status di Mayar: ${errorText(r.body, r.status)}`);
  const d = r.body.data as Partial<MayarPayment> | undefined;
  if (!d || typeof d.id !== "string") return null;
  return { id: d.id, amount: Number(d.amount), status: String(d.status ?? ""), transactions: Array.isArray(d.transactions) ? d.transactions : [] };
}

/** Uji API key tanpa membuat transaksi (membaca daftar payment request, maks. 1). */
export async function testMayarConnection(): Promise<{ ok: boolean; message: string }> {
  const r = await call("/payments?limit=1", { method: "GET" });
  const mode = isMayarProduction() ? "PRODUKSI" : "Sandbox";
  if (r.ok) return { ok: true, message: `Terhubung ke Mayar (mode ${mode}).${mayarWebhookToken() ? "" : " MAYAR_WEBHOOK_TOKEN belum diisi — webhook akan ditolak."}` };
  if (r.status === 401) return { ok: false, message: `API key ditolak Mayar (${errorText(r.body, r.status)}). Pastikan key ${mode} cocok dengan MAYAR_SANDBOX.` };
  return { ok: false, message: `Mayar menjawab ${errorText(r.body, r.status)}.` };
}
