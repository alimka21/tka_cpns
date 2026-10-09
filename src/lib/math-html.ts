// Ubah teks soal + rumus KaTeX ($...$ / $$...$$) jadi HTML aman.
// Dipakai di server (halaman ujian/pembahasan) dan di form admin (pratinjau).
// Jangan impor dari komponen siswa — library KaTeX ±270 KB.
//
// - `renderMathToHtml`: inline (pilihan jawaban, cuplikan daftar) — rumus + **tebal**.
// - `renderRichText`: blok (teks soal, stimulus, pembahasan) — paragraf (baris
//   kosong), list bernomor (`1.` / `1)`), bullet (`-` / `•` / `*`), tabel
//   (`| a | b |` + baris `|---|`), dan **tebal**. Semua teks tetap di-escape.

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

function renderMath(part: string) {
  const displayMode = part.startsWith("$$");
  const tex = part.slice(displayMode ? 2 : 1, displayMode ? -2 : -1);
  return katex.renderToString(tex, { displayMode, throwOnError: false, trust: false });
}

/** Teks biasa (sudah di-escape) → **tebal** jadi <strong>. */
function inlineMarks(escaped: string) {
  return escaped.replace(/\*\*(?=\S)(.+?)(?<=\S)\*\*/g, "<strong>$1</strong>");
}

/** Teks biasa di-escape; hanya bagian rumus yang jadi HTML KaTeX. */
export function renderMathToHtml(text: string) {
  return text
    .split(MATH_PATTERN)
    .map((part, i) => (i % 2 === 0 ? inlineMarks(escapeHtml(part)) : renderMath(part)))
    .join("");
}

export const RICH_TEXT_CLASS = "rich-text";

const OL_ITEM = /^\s*(\d{1,2})[.)]\s+(.*)$/;
const UL_ITEM = /^\s*[-•*]\s+(.*)$/;
const TABLE_ROW = /^\s*\|.*\|\s*$/;
const TABLE_SEP = /^\s*\|?(\s*:?-{3,}:?\s*\|)+\s*(:?-{3,}:?\s*)?$/;

type Run = { kind: "p" | "ol" | "ul" | "table"; lines: string[] };

function lineKind(line: string): Run["kind"] {
  if (TABLE_ROW.test(line)) return "table";
  if (OL_ITEM.test(line)) return "ol";
  if (UL_ITEM.test(line)) return "ul";
  return "p";
}

function cells(row: string) {
  return row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
}

/**
 * Teks soal / stimulus / pembahasan → HTML blok yang rapi. Rumus disimpan
 * dulu sebagai penanda supaya `$$...$$` multi-baris tidak terpotong.
 */
export function renderRichText(text: string) {
  const math: string[] = [];
  const src = text.replace(/\r\n?/g, "\n").replace(MATH_PATTERN, (m) => {
    math.push(m);
    return `\u0000${math.length - 1}\u0000`;
  });
  const inline = (s: string) => inlineMarks(escapeHtml(s)).replace(/\u0000(\d+)\u0000/g, (_, i) => renderMath(math[Number(i)]));

  const out: string[] = [];
  for (const block of src.trim().split(/\n[ \t]*\n+/)) {
    const runs: Run[] = [];
    for (const line of block.split("\n")) {
      if (!line.trim()) continue;
      const kind = lineKind(line);
      const last = runs[runs.length - 1];
      if (last && last.kind === kind) last.lines.push(line);
      else runs.push({ kind, lines: [line] });
    }
    for (const run of runs) {
      if (run.kind === "table" && run.lines.length >= 2 && TABLE_SEP.test(run.lines[1])) {
        const [head, , ...body] = run.lines;
        const rows = body.filter((r) => !TABLE_SEP.test(r));
        out.push(
          `<div class="rich-table"><table><thead><tr>${cells(head).map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead>` +
            `<tbody>${rows.map((r) => `<tr>${cells(r).map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`,
        );
      } else if (run.kind === "ol") {
        const start = Number(OL_ITEM.exec(run.lines[0])![1]);
        out.push(`<ol${start !== 1 ? ` start="${start}"` : ""}>${run.lines.map((l) => `<li>${inline(OL_ITEM.exec(l)![2])}</li>`).join("")}</ol>`);
      } else if (run.kind === "ul") {
        out.push(`<ul>${run.lines.map((l) => `<li>${inline(UL_ITEM.exec(l)![1])}</li>`).join("")}</ul>`);
      } else {
        out.push(`<p>${run.lines.map(inline).join("<br>")}</p>`);
      }
    }
  }
  return `<div class="${RICH_TEXT_CLASS}">${out.join("")}</div>`;
}
