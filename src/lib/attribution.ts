import { z } from "zod";

// Atribusi kampanye (UTM) — tanpa data pribadi: hanya parameter utm_*, path
// halaman pertama, dan waktunya. Cookie `pk_attr` diisi src/proxy.ts, dibaca
// saat pendaftaran (server/services/attribution). Aman dipakai di client.

export const ATTRIBUTION_COOKIE = "pk_attr";
export const ATTRIBUTION_MAX_AGE = 60 * 60 * 24 * 30; // 30 hari

export const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
type UtmKey = (typeof UTM_KEYS)[number];
type UtmField = UtmKey extends `utm_${infer F}` ? F : never;

const UTM_VALUE = /^[a-z0-9_-]{1,64}$/;
const PATH_MAX = 255;

/** Huruf kecil, hanya [a-z0-9-_], maks. 64 karakter. Tidak memenuhi → null (diabaikan, tidak dipotong). */
export function sanitizeUtmValue(value: string | null | undefined): string | null {
  const v = value?.trim().toLowerCase();
  return v && UTM_VALUE.test(v) ? v : null;
}

const utmValue = z.string().regex(UTM_VALUE).optional();
const touchSchema = z.object({
  source: utmValue,
  medium: utmValue,
  campaign: utmValue,
  content: utmValue,
  term: utmValue,
  /** Path halaman yang dibuka saat UTM ini datang (tanpa query string). */
  path: z.string().startsWith("/").max(PATH_MAX),
  /** Detik epoch. */
  at: z.number().int().positive(),
});
export type AttributionTouch = z.infer<typeof touchSchema>;

const cookieSchema = z.object({ first: touchSchema, last: touchSchema });
export type AttributionCookie = z.infer<typeof cookieSchema>;

/** utm_* valid dari query → satu "touch". Tidak ada satu pun yang valid → null. */
export function touchFromSearchParams(params: URLSearchParams, pathname: string, now = new Date()): AttributionTouch | null {
  const touch: Partial<Record<UtmField, string>> = {};
  for (const key of UTM_KEYS) {
    const v = sanitizeUtmValue(params.get(key));
    if (v) touch[key.slice(4) as UtmField] = v;
  }
  if (Object.keys(touch).length === 0) return null;
  const path = pathname.startsWith("/") ? pathname.slice(0, PATH_MAX) : "/";
  return { ...touch, path, at: Math.floor(now.getTime() / 1000) };
}

/** `first` diisi sekali dan tidak pernah ditimpa; `last` selalu touch terbaru. */
export function mergeAttribution(existing: AttributionCookie | null, touch: AttributionTouch): AttributionCookie {
  return { first: existing?.first ?? touch, last: touch };
}

export function serializeAttribution(value: AttributionCookie) {
  return JSON.stringify(value);
}

/** Cookie rusak/tidak dikenal → null (tidak pernah melempar error). */
export function parseAttribution(raw: string | null | undefined): AttributionCookie | null {
  if (!raw) return null;
  for (const candidate of [raw, safeDecode(raw)]) {
    if (!candidate) continue;
    try {
      const parsed = cookieSchema.safeParse(JSON.parse(candidate));
      if (parsed.success) return parsed.data;
    } catch {
      // coba bentuk berikutnya
    }
  }
  return null;
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

/**
 * Bawa utm_* dari halaman sekarang ke link internal (mis. /materi → /daftar),
 * supaya atribusi tetap tercatat bila link dibuka di browser lain (cookie tidak ikut).
 * Parameter yang sudah ada di `href` tidak ditimpa.
 */
export function withUtm(href: string, current: URLSearchParams | string): string {
  const source = typeof current === "string" ? new URLSearchParams(current) : current;
  const utm: [string, string][] = [];
  for (const key of UTM_KEYS) {
    const v = sanitizeUtmValue(source.get(key));
    if (v) utm.push([key, v]);
  }
  if (utm.length === 0 || !href.startsWith("/") || href.startsWith("//")) return href;
  const [beforeHash, hash = ""] = href.split("#", 2);
  const [path, query = ""] = beforeHash.split("?", 2);
  const params = new URLSearchParams(query);
  for (const [k, v] of utm) if (!params.has(k)) params.set(k, v);
  return `${path}?${params.toString()}${hash ? `#${hash}` : ""}`;
}
