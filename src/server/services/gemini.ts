// Client Gemini (REST, tanpa SDK) — SERVER-ONLY. API key milik user
// didekripsi di pemanggil & hanya hidup di memori selama request. Jangan
// pernah menulis key atau isi prompt lengkap ke log.

// GEMINI_API_BASE hanya untuk pengujian (server tiruan lokal); produksi pakai default.
const API_BASE = process.env.GEMINI_API_BASE?.trim() || "https://generativelanguage.googleapis.com/v1beta";

/** Model dari env supaya bisa diganti tanpa ubah kode (docs/AI_GENERATION.md §2). */
export function geminiModel() {
  return process.env.GEMINI_MODEL?.trim() || "gemini-3-flash-preview";
}

export class GeminiError extends Error {
  constructor(
    message: string,
    readonly kind: "invalid_key" | "quota" | "timeout" | "blocked" | "bad_output" | "unavailable",
  ) {
    super(message);
  }
}

function errorFor(status: number, body: string): GeminiError {
  if (status === 400 && /API_KEY_INVALID|API key not valid/i.test(body)) return new GeminiError("API key Gemini tidak valid.", "invalid_key");
  if (status === 401 || status === 403) return new GeminiError("API key Gemini ditolak (tidak punya akses ke model ini).", "invalid_key");
  if (status === 429) return new GeminiError("Kuota Gemini habis atau terlalu banyak permintaan. Coba lagi nanti.", "quota");
  if (status === 404) return new GeminiError(`Model ${geminiModel()} tidak ditemukan. Periksa env GEMINI_MODEL.`, "unavailable");
  return new GeminiError(`Gemini sedang tidak tersedia (HTTP ${status}).`, "unavailable");
}

async function call(path: string, apiKey: string, init: RequestInit, timeoutMs: number) {
  try {
    return await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey, ...init.headers },
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      throw new GeminiError("Gemini terlalu lama merespons. Coba lagi dengan jumlah soal lebih sedikit.", "timeout");
    }
    throw new GeminiError("Tidak bisa terhubung ke Gemini.", "unavailable");
  }
}

/** Panggilan uji ringan saat user menyimpan key (tanpa memakai kuota generate). */
export async function verifyGeminiKey(apiKey: string): Promise<void> {
  const res = await call(`/models/${encodeURIComponent(geminiModel())}`, apiKey, { method: "GET" }, 15_000);
  if (!res.ok) throw errorFor(res.status, await res.text());
}

export type GeminiImage = { mime: string; data: Buffer };

/**
 * Minta output JSON. `images` dikirim inline (multimodal) sebelum teks prompt.
 * Mengembalikan objek hasil JSON.parse (belum divalidasi — pemanggil wajib Zod).
 */
export async function generateJson(opts: {
  apiKey: string;
  prompt: string;
  images?: GeminiImage[];
  temperature?: number;
  timeoutMs?: number;
}): Promise<unknown> {
  const parts = [
    ...(opts.images ?? []).map((img) => ({ inline_data: { mime_type: img.mime, data: img.data.toString("base64") } })),
    { text: opts.prompt },
  ];
  const res = await call(
    `/models/${encodeURIComponent(geminiModel())}:generateContent`,
    opts.apiKey,
    {
      method: "POST",
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        // Gemini 3: biarkan temperature default model kecuali diminta eksplisit.
        generationConfig: { responseMimeType: "application/json", ...(opts.temperature != null && { temperature: opts.temperature }) },
      }),
    },
    opts.timeoutMs ?? 90_000,
  );
  const body = await res.text();
  if (!res.ok) throw errorFor(res.status, body);

  let json: { candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[]; promptFeedback?: { blockReason?: string } };
  try {
    json = JSON.parse(body);
  } catch {
    throw new GeminiError("Respons Gemini tidak bisa dibaca.", "bad_output");
  }
  if (json.promptFeedback?.blockReason) throw new GeminiError("Permintaan diblokir filter keamanan Gemini.", "blocked");
  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text) throw new GeminiError("Gemini tidak mengembalikan jawaban.", "bad_output");
  try {
    return JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, ""));
  } catch {
    throw new GeminiError("Output Gemini bukan JSON yang valid.", "bad_output");
  }
}
