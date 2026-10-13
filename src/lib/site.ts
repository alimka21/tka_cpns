export const SITE_NAME = "Pakar TKA";
/** Slogan merek — dipakai di hero, footer, metadata, & gambar pratinjau tautan. */
export const SITE_TAGLINE = "Kenali Kelemahan, Kuasai TKA.";
export const SITE_DESCRIPTION =
  "Pakar TKA — platform latihan Tes Kemampuan Akademik (TKA) SD, SMP, dan SMA sesuai Kerangka Asesmen, dengan diagnosa kelemahan per subtopik dan latihan terarah.";
/** Domain produksi — fallback bila env SITE_URL lupa diisi (canonical, sitemap, OG harus absolut & benar). */
export const PRODUCTION_URL = "https://pakartka.com";
export const SITE_URL = (process.env.SITE_URL || (process.env.NODE_ENV === "production" ? PRODUCTION_URL : "http://localhost:3000")).replace(/\/$/, "");
