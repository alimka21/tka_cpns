// Bagian murni integrasi Mayar Headless API V2 (tanpa jaringan/DB) supaya bisa dites.

import { timingSafeEqual } from "node:crypto";
import type { OrderStatus } from "@/server/db/schema";

/** Detail payment request Mayar (GET /hl/v2/payments/{id}) — field yang kita pakai saja. */
export type MayarPayment = {
  id: string;
  amount: number;
  status: string;
  transactions?: { id?: string; status?: string; paymentMethod?: string | null; updatedAt?: number | string | null }[];
};

const PAID = new Set(["paid", "success", "settled", "settlement"]);

/**
 * Status payment request → status order kita. Lunas bila status request "paid" atau ada
 * transaksi lunas (request yang lunas bisa berstatus "closed"); "closed"/"expired" tanpa
 * transaksi lunas = kedaluwarsa; lainnya (unpaid/created/…) belum final.
 */
export function mapMayarStatus(p: Pick<MayarPayment, "status" | "transactions">): OrderStatus {
  const s = (p.status ?? "").toLowerCase();
  if (PAID.has(s) || (p.transactions ?? []).some((t) => PAID.has((t.status ?? "").toLowerCase()))) return "paid";
  if (s === "closed" || s === "expired") return "expired";
  return "pending";
}

/** Channel bayar dari transaksi lunas (mis. "QRIS"), bila ada. */
export function mayarPaidChannel(p: Pick<MayarPayment, "transactions">): string | null {
  const t = (p.transactions ?? []).find((x) => PAID.has((x.status ?? "").toLowerCase()));
  return t?.paymentMethod ? String(t.paymentMethod).slice(0, 40) : null;
}

/**
 * ID yang mungkin merujuk payment request kita di payload webhook. Mayar tidak
 * mendokumentasikan payload `payment.received` lengkap, jadi semua kandidat dicoba
 * (productId = payment request pada payload reminder; id/transactionId sebagai cadangan).
 */
export function webhookCandidateIds(data: Record<string, unknown> | null | undefined): string[] {
  if (!data) return [];
  const ids = [data.productId, data.paymentLinkId, data.id, data.transactionId, data.paymentLinkTransactionId];
  return [...new Set(ids.filter((v): v is string => typeof v === "string" && v.length > 0 && v.length <= 80))];
}

/** Kode order kita yang ikut di extraData (bila Mayar meneruskannya ke webhook). */
export function webhookOrderCode(data: Record<string, unknown> | null | undefined): string | null {
  const extra = data?.extraData;
  const code = extra && typeof extra === "object" ? (extra as Record<string, unknown>).orderCode : null;
  return typeof code === "string" && code.length <= 64 ? code : null;
}

/**
 * Webhook Mayar tidak bertanda tangan; URL webhook membawa `?token=` rahasia kita
 * (env MAYAR_WEBHOOK_TOKEN). Status tetap diambil ulang dari API Mayar sebelum diterapkan.
 */
export function verifyMayarWebhookToken(given: string | null | undefined, expected: string) {
  if (!given || !expected) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
