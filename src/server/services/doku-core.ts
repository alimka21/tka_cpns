// Bagian murni integrasi DOKU Checkout (tanpa jaringan/DB) supaya bisa dites.
// Signature non-SNAP: https://developers.doku.com/get-started-with-doku-api/signature-component/non-snap

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { OrderStatus } from "@/server/db/schema";

/** Digest = base64(SHA-256(body JSON mentah)) — hanya untuk request ber-body (POST). */
export function dokuDigest(body: string) {
  return createHash("sha256").update(body, "utf8").digest("base64");
}

export type SignatureParts = { clientId: string; requestId: string; timestamp: string; target: string; body?: string };

/** "HMACSHA256=" + base64(HMAC-SHA256(secret, komponen per baris tanpa baris kosong di akhir)). */
export function dokuSignature(p: SignatureParts, secretKey: string) {
  const lines = [`Client-Id:${p.clientId}`, `Request-Id:${p.requestId}`, `Request-Timestamp:${p.timestamp}`, `Request-Target:${p.target}`];
  if (p.body !== undefined) lines.push(`Digest:${dokuDigest(p.body)}`);
  return `HMACSHA256=${createHmac("sha256", secretKey).update(lines.join("\n")).digest("base64")}`;
}

/**
 * Verifikasi HTTP Notification dari DOKU: Request-Target = path Notification URL
 * kita, Client-Id harus milik kita, timestamp tidak terlalu jauh (anti replay).
 */
export function verifyDokuNotification(
  headers: { clientId: string | null; requestId: string | null; timestamp: string | null; signature: string | null },
  rawBody: string,
  target: string,
  creds: { clientId: string; secretKey: string },
  now = new Date(),
) {
  const { clientId, requestId, timestamp, signature } = headers;
  if (!clientId || !requestId || !timestamp || !signature) return false;
  if (clientId !== creds.clientId) return false;
  const t = Date.parse(timestamp);
  if (Number.isNaN(t) || Math.abs(now.getTime() - t) > 24 * 3600_000) return false;
  const expected = Buffer.from(dokuSignature({ clientId, requestId, timestamp, target, body: rawBody }, creds.secretKey));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** ISO 8601 UTC tanpa milidetik, mis. 2026-10-07T08:45:42Z (format yang diminta DOKU). */
export function dokuTimestamp(d = new Date()) {
  return d.toISOString().replace(/\.\d{3}Z$/, "Z");
}

/** Status transaksi DOKU (Check Status / notifikasi) → status order kita. */
export function mapDokuStatus(status: string | undefined): OrderStatus {
  switch ((status ?? "").toUpperCase()) {
    case "SUCCESS":
      return "paid";
    case "EXPIRED":
    case "TIMEOUT":
      return "expired";
    case "FAILED":
      return "failed";
    case "REFUNDED":
      return "refunded";
    default:
      // PENDING, REDIRECT, dan status lain yang belum final.
      return "pending";
  }
}

/** Bentuk ringkas status dari DOKU yang kita simpan & terapkan. */
export type DokuStatus = { invoiceNumber: string; amount: number; status: string; channel: string | null; date: string | null; raw: unknown };

/** Ambil field penting dari body Check Status / notifikasi DOKU. `null` bila bentuknya tidak dikenal. */
export function parseDokuStatus(body: unknown): DokuStatus | null {
  const b = body as {
    order?: { invoice_number?: unknown; amount?: unknown };
    transaction?: { status?: unknown; date?: unknown };
    channel?: { id?: unknown };
    service?: { id?: unknown };
  } | null;
  const invoice = b?.order?.invoice_number;
  const status = b?.transaction?.status;
  const amount = Number(b?.order?.amount);
  if (typeof invoice !== "string" || typeof status !== "string" || !Number.isFinite(amount)) return null;
  const channel = typeof b?.channel?.id === "string" ? b.channel.id : typeof b?.service?.id === "string" ? b.service.id : null;
  return { invoiceNumber: invoice, amount, status, channel, date: typeof b?.transaction?.date === "string" ? b.transaction.date : null, raw: body };
}

/**
 * Status final tidak boleh mundur karena notifikasi datang tidak berurutan:
 * order `paid` hanya bisa jadi `refunded`; status gagal tidak kembali ke pending.
 * Pengecualian: `failed` → `paid` boleh (di halaman Checkout siswa bisa mencoba ulang).
 */
export function nextOrderStatus(current: OrderStatus, incoming: OrderStatus): OrderStatus {
  if (current === incoming) return current;
  if (current === "paid") return incoming === "refunded" ? "refunded" : "paid";
  if (current === "refunded") return "refunded";
  if (incoming === "paid") return "paid";
  if (incoming === "pending" && current !== "pending") return current;
  return incoming;
}

/** Masa aktif baru; diperpanjang dari akhir masa aktif yang masih berjalan (bila ada). */
export function membershipWindow(now: Date, currentEndsAt: Date | null | undefined, durationDays: number | null) {
  const start = currentEndsAt && currentEndsAt > now ? currentEndsAt : now;
  return { startsAt: start, endsAt: durationDays == null ? null : new Date(start.getTime() + durationDays * 86_400_000) };
}
