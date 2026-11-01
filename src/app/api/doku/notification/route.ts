// Webhook HTTP Notification DOKU. Wajib dipasang di DOKU dashboard: Settings → Payment
// Settings → QR Payment (& metode lain) → CONFIGURE → Notification URL. Kode juga mengirim
// additional_info.override_notification_url (hanya berlaku bila URL dashboard sudah terpasang).
// Alur: verifikasi signature (Request-Target = path ini, Digest dari body mentah)
// → ambil ulang status dari Check Status API (sumber kebenaran, kebal payload
// palsu) → terapkan ke order (idempoten). DOKU hanya butuh HTTP 2xx.

import { applyDokuStatus } from "@/server/services/billing";
import { dokuCredentials, DOKU_NOTIFICATION_PATH, getOrderStatus, isDokuConfigured } from "@/server/services/doku";
import { dokuInvoiceOf, parseDokuStatus, verifyDokuNotification } from "@/server/services/doku-core";

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
  const invoiceNumber = payload?.invoiceNumber ?? dokuInvoiceOf(body);
  if (!invoiceNumber) {
    console.error("[doku] notifikasi tanpa invoice_number:", raw.slice(0, 2000));
    return Response.json({ error: "bad payload" }, { status: 400 });
  }
  // Di DOKU Checkout siswa bisa mencoba ulang setelah gagal → notifikasi FAILED diabaikan.
  if (payload?.status.toUpperCase() === "FAILED") return Response.json({ ok: true, ignored: "FAILED" });

  // Status diambil ulang dari Check Status API. Body yang bentuknya tidak dikenal (signature sah,
  // tetapi tanpa status/amount) tidak lagi ditolak 400 — DOKU 2026-11-01 melaporkan notifikasi gagal
  // HTTP 400 untuk order QRIS yang sebenarnya lunas.
  if (!payload) console.warn("[doku] bentuk notifikasi tidak dikenal, pakai Check Status:", raw.slice(0, 2000));
  let checked: Awaited<ReturnType<typeof getOrderStatus>> | undefined;
  try {
    checked = await getOrderStatus(invoiceNumber);
  } catch {
    checked = undefined; // API DOKU error/timeout
  }
  const fresh = checked ?? payload;
  if (!fresh) {
    // API error & body tidak bisa dipakai → 503 agar DOKU mengulang. Invoice tidak dikenal /
    // belum dibayar (Check Status null) → 200 agar tidak diulang terus.
    return checked === undefined
      ? Response.json({ error: "status unavailable" }, { status: 503 })
      : Response.json({ ok: false, note: "status belum tersedia" });
  }
  const result = await applyDokuStatus({ ...fresh, invoiceNumber });
  // Order tidak dikenal (mis. notifikasi uji dari dashboard) tetap dijawab 200 agar tidak diulang terus.
  return Response.json({ ok: result.ok, ...(result.ok ? { status: result.status } : { note: result.error }) });
}
