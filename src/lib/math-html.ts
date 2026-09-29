// Ubah teks soal + rumus KaTeX ($...$ / $$...$$) jadi HTML aman.
// Dipakai di server (halaman ujian/pembahasan) dan di form admin (pratinjau).
// Jangan impor dari komponen siswa — library KaTeX ±270 KB.

import katex from "katex";

// $$...$$ (blok) atau $...$ (inline).
const MATH_PATTERN = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
}

/** Teks biasa di-escape; hanya bagian rumus yang jadi HTML KaTeX. */
export function renderMathToHtml(text: string) {
  return text
    .split(MATH_PATTERN)
    .map((part, i) => {
      if (i % 2 === 0) return escapeHtml(part);
      const displayMode = part.startsWith("$$");
      const tex = part.slice(displayMode ? 2 : 1, displayMode ? -2 : -1);
      return katex.renderToString(tex, { displayMode, throwOnError: false, trust: false });
    })
    .join("");
}
