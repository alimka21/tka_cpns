// Bagian murni integrasi Midtrans (tanpa jaringan/DB) supaya bisa dites.

import { createHash, timingSafeEqual } from "node:crypto";
import type { OrderStatus } from "@/server/db/schema";

export type MidtransPayload = {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key?: string;
  transaction_status: string;
  fraud_status?: string;
  payment_type?: string;
  transaction_id?: string;
  settlement_time?: string;
};

/** signature_key = SHA512(order_id + status_code + gross_amount + server_key). */
export function midtransSignature(p: Pick<MidtransPayload, "order_id" | "status_code" | "gross_amount">, serverKey: string) {
  return createHash("sha512").update(`${p.order_id}${p.status_code}${p.gross_amount}${serverKey}`).digest("hex");
}

export function verifyMidtransSignature(p: MidtransPayload, serverKey: string) {
  if (!p.signature_key || !/^[a-f0-9]{128}$/i.test(p.signature_key)) return false;
  const expected = Buffer.from(midtransSignature(p, serverKey), "hex");
  const given = Buffer.from(p.signature_key, "hex");
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/**
 * transaction_status (+ fraud_status kartu) → status order kita.
 * https://docs.midtrans.com/docs/https-notification-webhooks
 */
export function mapMidtransStatus(transactionStatus: string, fraudStatus?: string): OrderStatus {
  switch (transactionStatus) {
    case "capture":
      return fraudStatus === "accept" || !fraudStatus ? "paid" : fraudStatus === "deny" ? "failed" : "pending";
    case "settlement":
      return "paid";
    case "pending":
      return "pending";
    case "deny":
    case "failure":
      return "failed";
    case "cancel":
      return "cancelled";
    case "expire":
      return "expired";
    case "refund":
    case "partial_refund":
      return "refunded";
    default:
      return "pending";
  }
}

/**
 * Status final tidak boleh mundur karena notifikasi datang tidak berurutan:
 * order `paid` hanya bisa jadi `refunded`; status gagal tidak kembali ke pending.
 */
export function nextOrderStatus(current: OrderStatus, incoming: OrderStatus): OrderStatus {
  if (current === incoming) return current;
  if (current === "paid") return incoming === "refunded" ? "refunded" : "paid";
  if (current === "refunded") return "refunded";
  if (incoming === "pending" && current !== "pending") return current;
  return incoming;
}

/** Masa aktif baru; diperpanjang dari akhir masa aktif yang masih berjalan (bila ada). */
export function membershipWindow(now: Date, currentEndsAt: Date | null | undefined, durationDays: number | null) {
  const start = currentEndsAt && currentEndsAt > now ? currentEndsAt : now;
  return { startsAt: start, endsAt: durationDays == null ? null : new Date(start.getTime() + durationDays * 86_400_000) };
}
