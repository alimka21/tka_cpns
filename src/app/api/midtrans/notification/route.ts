// Webhook "Payment Notification URL" Midtrans. Pasang di dashboard Midtrans:
//   Settings → Payment → Notification URL → https://<domain>/api/midtrans/notification
// Alur: verifikasi signature → ambil ulang status dari Status API (sumber
// kebenaran, kebal payload palsu) → terapkan ke order (idempoten).

import { z } from "zod";
import { applyMidtransStatus } from "@/server/services/billing";
import { getTransactionStatus, isMidtransConfigured, midtransServerKey } from "@/server/services/midtrans";
import { verifyMidtransSignature, type MidtransPayload } from "@/server/services/midtrans-status";

const payloadSchema = z
  .object({
    order_id: z.string().min(1).max(50),
    status_code: z.string(),
    gross_amount: z.string(),
    signature_key: z.string(),
    transaction_status: z.string(),
  })
  .passthrough();

export async function POST(req: Request) {
  if (!isMidtransConfigured()) return Response.json({ error: "not configured" }, { status: 503 });
  const parsed = payloadSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "bad payload" }, { status: 400 });
  const payload = parsed.data as MidtransPayload;
  if (!verifyMidtransSignature(payload, midtransServerKey())) return Response.json({ error: "invalid signature" }, { status: 403 });

  // Order uji dari tombol "Test notification" dashboard Midtrans tidak ada di DB → tetap 200.
  const fresh = (await getTransactionStatus(payload.order_id).catch(() => null)) ?? payload;
  const result = await applyMidtransStatus({ ...fresh, order_id: payload.order_id });
  return Response.json({ ok: result.ok, ...(result.ok ? { status: result.status } : { note: result.error }) });
}
