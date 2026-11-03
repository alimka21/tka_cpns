// API laporan atribusi untuk agen AI:
//   curl -H "Authorization: Bearer $AGENT_API_TOKEN" "https://<domain>/api/agent/attribution?from=2026-10-01&to=2026-10-31&model=first"
// HANYA data agregat per kampanye & per materi (sama dengan /admin/atribusi) — tanpa nama,
// email, No. HP, atau id pengguna. Token hanya lewat header (bukan query string → tidak tercatat
// di log akses). AGENT_API_TOKEN kosong/pendek → endpoint mati (503).

import { createHash, timingSafeEqual } from "node:crypto";
import { parseModel, parseRange } from "@/lib/attribution-report";
import { FixedWindowLimiter } from "@/lib/rate-limit";
import { attributionReport } from "@/server/queries/attribution";

export const dynamic = "force-dynamic";

const MIN_TOKEN_LENGTH = 32;
// Route dibundel terpisah → simpan limiter di globalThis supaya satu per proses.
const shared = globalThis as typeof globalThis & { __agentApiLimiters?: { ok: FixedWindowLimiter; failed: FixedWindowLimiter } };
shared.__agentApiLimiters ??= {
  /** Permintaan sah: 30/menit per IP. */
  ok: new FixedWindowLimiter(30, 60_000),
  /** Token salah: 10 per 15 menit per IP (perlambat tebak token). */
  failed: new FixedWindowLimiter(10, 15 * 60_000),
};
const limiters = shared.__agentApiLimiters;

const digest = (value: string) => createHash("sha256").update(value).digest();

function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip")?.trim() || "unknown";
}

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return Response.json(body, { status, headers: { "cache-control": "no-store", ...headers } });
}

export async function GET(req: Request) {
  const secret = process.env.AGENT_API_TOKEN?.trim();
  if (!secret || secret.length < MIN_TOKEN_LENGTH) return json({ error: "API agen belum diaktifkan" }, 503);

  const ip = clientIp(req);
  const given = req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() ?? "";
  // Bandingkan hash (panjang selalu sama) → waktu tidak membocorkan panjang/isi token.
  if (!given || !timingSafeEqual(digest(given), digest(secret))) {
    const fail = limiters.failed.take(ip);
    if (!fail.ok) return json({ error: "too_many_requests" }, 429, { "retry-after": String(fail.retryAfter) });
    return json({ error: "unauthorized" }, 401, { "www-authenticate": "Bearer" });
  }

  const limit = limiters.ok.take(ip);
  if (!limit.ok) return json({ error: "too_many_requests" }, 429, { "retry-after": String(limit.retryAfter) });

  const url = new URL(req.url);
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  if (!from || !to) return json({ error: "Parameter from dan to wajib (YYYY-MM-DD)." }, 400);
  const parsed = parseRange(from, to);
  if (!parsed.ok) return json({ error: parsed.error }, 400);
  const model = parseModel(url.searchParams.get("model") ?? undefined);

  try {
    const report = await attributionReport(parsed.range, model);
    return json(
      {
        range: { from: parsed.range.from, to: parsed.range.to, timezone: "Asia/Jakarta" },
        model,
        totals: report.totals,
        campaigns: report.campaigns,
        leadMagnets: report.leadMagnets,
        notes: {
          cohort: "Pendaftar = akun siswa yang dibuat dalam rentang tanggal; buyers/revenue = order lunas milik pendaftar itu, kapan pun dibayar.",
          campaignNull: "campaign null = pendaftar tanpa utm_campaign.",
          downloadsByNewUsers: "Unduhan oleh akun yang dibuat ≤ 24 jam sebelum mengunduh.",
          firstLandingSignups: "Pendaftar dalam rentang yang halaman pertamanya /materi/<slug>.",
        },
      },
      200,
      { "x-ratelimit-remaining": String(limit.remaining) },
    );
  } catch (e) {
    console.error("[agent-api] gagal membuat laporan:", e instanceof Error ? e.message : e);
    return json({ error: "Gagal membuat laporan." }, 500);
  }
}
