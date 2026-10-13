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
      // pending, authorize, dan status lain yang belum final.
      return "pending";
  }
}
