import { describe, expect, it } from "vitest";
import { geminiErrorFor } from "./gemini";

// Contoh respons asli Google (2026-10-01) untuk key salah / format baru salah.
const invalid400 = JSON.stringify({ error: { code: 400, status: "INVALID_ARGUMENT", message: "API key not valid. Please pass a valid API key.", details: [{ reason: "API_KEY_INVALID" }] } });
const invalid401 = JSON.stringify({ error: { code: 401, status: "UNAUTHENTICATED", details: [{ reason: "ACCESS_TOKEN_TYPE_UNSUPPORTED" }] } });
const blocked403 = JSON.stringify({ error: { code: 403, status: "PERMISSION_DENIED", details: [{ reason: "SERVICE_DISABLED" }] } });

describe("geminiErrorFor", () => {
  it("key salah (400 API_KEY_INVALID & 401) → invalid_key, pesan jelas", () => {
    for (const [s, b] of [[400, invalid400], [401, invalid401]] as const) {
      const e = geminiErrorFor(s, b);
      expect(e.kind).toBe("invalid_key");
      expect(e.message).toMatch(/ditolak Google/);
    }
  });
  it("key valid tapi API tidak aktif / dibatasi (403)", () => {
    expect(geminiErrorFor(403, blocked403).message).toMatch(/tidak diizinkan/);
  });
  it("kuota, model, & lainnya", () => {
    expect(geminiErrorFor(429, "{}").kind).toBe("quota");
    expect(geminiErrorFor(404, "{}").message).toMatch(/Model/);
    expect(geminiErrorFor(503, "bukan json").kind).toBe("unavailable");
  });
});
