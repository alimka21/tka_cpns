// Webhook "Invoices paid" Xendit. Pasang di Dashboard Xendit (mode Test & Live
// masing-masing): Settings → Webhooks → Invoices → https://<domain>/api/xendit/notification
// Alur: cek header x-callback-token (Verification Token akun) → ambil ulang
// invoice dari API Xendit (sumber kebenaran, kebal payload palsu) → terapkan
// ke order (idempoten).

import { z } from "zod";
import { applyXenditStatus } from "@/server/services/billing";
import { getInvoiceByExternalId, isXenditConfigured, xenditCallbackToken } from "@/server/services/xendit";
import { verifyXenditCallbackToken, type XenditInvoice } from "@/server/services/xendit-core";

const payloadSchema = z
  .object({
    id: z.string().min(1),
    external_id: z.string().min(1).max(64),
    status: z.string(),
    amount: z.number(),
  })
  .passthrough();

export async function POST(req: Request) {
  if (!isXenditConfigured() || !xenditCallbackToken()) return Response.json({ error: "not configured" }, { status: 503 });
  if (!verifyXenditCallbackToken(req.headers.get("x-callback-token"), xenditCallbackToken())) {
    return Response.json({ error: "invalid token" }, { status: 403 });
  }
  const parsed = payloadSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "bad payload" }, { status: 400 });
  const payload = parsed.data as XenditInvoice;

  const fresh = (await getInvoiceByExternalId(payload.external_id).catch(() => null)) ?? payload;
  const result = await applyXenditStatus({ ...fresh, external_id: payload.external_id });
  // Order tidak dikenal (mis. "Test and save" dari dashboard) tetap dijawab 200 agar tidak diulang terus.
  return Response.json({ ok: result.ok, ...(result.ok ? { status: result.status } : { note: result.error }) });
}
