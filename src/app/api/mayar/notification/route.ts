// Webhook Mayar (event payment.received / payment.reminder). Pasang di dashboard Mayar:
// Integration → Webhook → URL Webhook = https://<domain>/api/mayar/notification?token=<MAYAR_WEBHOOK_TOKEN>
// Webhook Mayar tidak bertanda tangan, jadi: cek ?token= rahasia → cari order dari id di
// payload → ambil ulang status payment request dari API Mayar (sumber kebenaran, kebal
// payload palsu) → terapkan ke order (idempoten).

import { z } from "zod";
import { applyMayarPayment, findMayarOrder } from "@/server/services/billing";
import { getPayment, isMayarConfigured, mayarWebhookToken } from "@/server/services/mayar";
import { verifyMayarWebhookToken, webhookCandidateIds, webhookOrderCode } from "@/server/services/mayar-core";

const payloadSchema = z.object({ event: z.string().optional(), data: z.record(z.string(), z.unknown()).nullish() }).passthrough();

export async function POST(req: Request) {
  if (!isMayarConfigured() || !mayarWebhookToken()) return Response.json({ error: "not configured" }, { status: 503 });
  if (!verifyMayarWebhookToken(new URL(req.url).searchParams.get("token"), mayarWebhookToken())) {
    return Response.json({ error: "invalid token" }, { status: 403 });
  }
  const parsed = payloadSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "bad payload" }, { status: 400 });
  const data = parsed.data.data ?? null;

  const order = await findMayarOrder(webhookCandidateIds(data), webhookOrderCode(data));
  // Order tidak dikenal (mis. tes webhook dari dashboard) tetap dijawab 200 agar tidak diulang terus.
  if (!order?.transactionId) return Response.json({ ok: false, note: "order not found" });

  const fresh = await getPayment(order.transactionId).catch(() => undefined);
  if (fresh === undefined) return Response.json({ error: "mayar unreachable" }, { status: 502 });
  if (!fresh) return Response.json({ ok: false, note: "payment not found" });
  const result = await applyMayarPayment(order.orderCode, fresh);
  return Response.json({ ok: result.ok, ...(result.ok ? { status: result.status } : { note: result.error }) });
}
