// Arah teks untuk soal berbahasa Arab (tanpa dependensi — aman untuk komponen client).
// Paragraf hanya dibuat kanan-ke-kiri bila hurufnya Arab SEMUA (tanpa huruf Latin); paragraf campuran
// (soal/pembahasan berbahasa Indonesia yang mengutip kata Arab) tetap kiri-ke-kanan, dan tiap potongan
// Arab dibungkus <bdi dir="rtl"> supaya urutan kata & tanda bacanya (؟ ، .) benar.

const ARABIC = "\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF\\uFB50-\\uFDFF\\uFE70-\\uFEFF";
const HAS_ARABIC = new RegExp(`[${ARABIC}]`);
const HAS_LATIN = /[A-Za-zÀ-ɏ]/;
/**
 * Potongan Arab: kata-kata Arab beserta spasi/tanda baca di antaranya (boleh melewati tag <strong>
 * kata tebal), plus tanda baca penutup.
 */
const SEP = `(?:[\\s.,!:\\u060C\\u061B\\u061F]|</?strong>)+`;
const ARABIC_RUN = new RegExp(`[${ARABIC}]+(?:${SEP}[${ARABIC}]+)*[.!:\\u060C\\u061B\\u061F]?`, "g");
const ARABIC_RUN_NO_TAGS = new RegExp(`[${ARABIC}]+(?:[\\s.,!:\\u060C\\u061B\\u061F]+[${ARABIC}]+)*[.!:\\u060C\\u061B\\u061F]?`, "g");
const wrap = (run: string) => `<bdi dir="rtl">${run}</bdi>`;
const count = (s: string, t: string) => s.split(t).length - 1;

/** Teks (tanpa tag HTML) seluruhnya Arab → tampil kanan-ke-kiri. */
export function isRtlText(text: string) {
  return HAS_ARABIC.test(text) && !HAS_LATIN.test(text);
}

/** HTML hasil render → true bila isinya Arab semua (tag & entitas diabaikan). */
export function isRtlHtml(html: string) {
  return isRtlText(html.replace(/<[^>]*>/g, " ").replace(/&[a-z#0-9]+;/gi, " "));
}

/** Bungkus potongan Arab di teks campuran (teks sudah di-escape, boleh berisi tag sederhana). */
export function isolateArabicRuns(escaped: string) {
  if (!HAS_ARABIC.test(escaped)) return escaped;
  return escaped.replace(ARABIC_RUN, (run) =>
    // Tag tebal harus berpasangan di dalam <bdi>; bila tidak, bungkus per potongan tanpa tag.
    count(run, "<strong>") === count(run, "</strong>") ? wrap(run) : run.replace(ARABIC_RUN_NO_TAGS, wrap),
  );
}
