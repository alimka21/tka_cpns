// Webhook HTTP Notification DOKU. Pasang di DOKU Back Office:
//   Settings → Payment Settings → Notification URL → https://<domain>/api/doku/notification
// Alur: verifikasi signature (Request-Target = path ini, Digest dari body mentah)
// → ambil ulang status dari Check Status API (sumber kebenaran, kebal payload
// palsu) → terapkan ke order (idempoten). DOKU hanya butuh HTTP 2xx.

import { applyDokuStatus } from "@/server/services/billing";
import { dokuCredentials, DOKU_NOTIFICATION_PATH, getOrderStatus, isDokuConfigured } from "@/server/services/doku";
import { parseDokuStatus, verifyDokuNotification } from "@/server/services/doku-core";

export async function POST(req: Request) {
  if (!isDokuConfigured()) return Response.json({ error: "not configured" }, { status: 503 });
  const raw = await req.text();
  if (raw.length > 100_000) return Response.json({ error: "too large" }, { status: 413 });
  const ok = verifyDokuNotification(
    {
      clientId: req.headers.get("client-id"),
      requestId: req.headers.get("request-id"),
      timestamp: req.headers.get("request-timestamp"),
      signature: req.headers.get("signature"),
    },
    raw,
    DOKU_NOTIFICATION_PATH,
    dokuCredentials(),
  );
  if (!ok) return Response.json({ error: "invalid signature" }, { status: 401 });

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "bad payload" }, { status: 400 });
  }
  const payload = parseDokuStatus(body);
  if (!payload) return Response.json({ error: "bad payload" }, { status: 400 });
  // Di DOKU Checkout siswa bisa mencoba ulang setelah gagal → notifikasi FAILED diabaikan.
  if (payload.status.toUpperCase() === "FAILED") return Response.json({ ok: true, ignored: "FAILED" });

  const fresh = (await getOrderStatus(payload.invoiceNumber).catch(() => null)) ?? payload;
  const result = await applyDokuStatus({ ...fresh, invoiceNumber: payload.invoiceNumber });
  // Order tidak dikenal (mis. notifikasi uji dari dashboard) tetap dijawab 200 agar tidak diulang terus.
  return Response.json({ ok: result.ok, ...(result.ok ? { status: result.status } : { note: result.error }) });
}
