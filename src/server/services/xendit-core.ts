// Bagian murni integrasi Xendit Invoice (tanpa jaringan/DB) supaya bisa dites.

import { timingSafeEqual } from "node:crypto";
import type { OrderStatus } from "@/server/db/schema";

/** Invoice Xendit (REST, snake_case) — field yang kita pakai saja. */
export type XenditInvoice = {
  id: string;
  external_id: string;
  status: string;
  amount: number;
  paid_amount?: number;
  paid_at?: string;
  payment_method?: string;
  payment_channel?: string;
  invoice_url?: string;
};

/**
 * Status invoice → status order kita. PAID/SETTLED = lunas (SETTLED = dana
 * sudah masuk saldo), EXPIRED = kedaluwarsa, PENDING & lainnya = belum final.
 */
export function mapXenditStatus(status: string): OrderStatus {
  switch (status.toUpperCase()) {
    case "PAID":
    case "SETTLED":
      return "paid";
    case "EXPIRED":
      return "expired";
    default:
      return "pending";
  }
}

/**
 * Webhook Xendit membawa header `x-callback-token` = Verification Token
 * akun (Dashboard → Settings → Webhooks; berbeda untuk mode Test & Live).
 */
export function verifyXenditCallbackToken(given: string | null | undefined, expected: string) {
  if (!given || !expected) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
