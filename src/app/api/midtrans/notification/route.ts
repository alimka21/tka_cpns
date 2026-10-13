// Webhook "URL notifikasi pembayaran" Midtrans. Pasang di dashboard Midtrans
// (Sandbox & Production masing-masing):
//   Pengaturan → Pembayaran → URL notifikasi → https://<domain>/api/midtrans/notification
// Alur: verifikasi signature → ambil ulang status dari Status API (sumber
// kebenaran, kebal payload palsu) → terapkan ke order (idempoten).

import { z } from "zod";
import { applyMidtransStatus } from "@/server/services/billing";
import { getTransactionStatus, isMidtransConfigured, midtransServerKey } from "@/server/services/midtrans";
import { verifyMidtransSignature, type MidtransPayload } from "@/server/services/midtrans-core";

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

  const fresh = (await getTransactionStatus(payload.order_id).catch(() => null)) ?? payload;
  const result = await applyMidtransStatus({ ...fresh, order_id: payload.order_id });
  // Order tidak dikenal (mis. "Test notification" dari dashboard) tetap dijawab 200 agar tidak diulang terus.
  return Response.json({ ok: result.ok, ...(result.ok ? { status: result.status } : { note: result.error }) });
}
