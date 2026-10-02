// Render halaman PDF di browser admin dengan pdf.js (tanpa pustaka native di
// server). Dipakai Impor PDF: halaman → JPEG untuk Gemini, dan potongan
// gambar soal dari kotak [ymin, xmin, ymax, xmax] skala 0–1000.

import type { PDFDocumentProxy } from "pdfjs-dist";
import type { PdfCrop } from "@/lib/pdf-import-types";

export async function openPdf(file: File): Promise<PDFDocumentProxy> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  return pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
}

/** Render satu halaman (1-based) dengan lebar target piksel. */
export async function renderPage(doc: PDFDocumentProxy, pageNumber: number, width: number) {
  const page = await doc.getPage(pageNumber);
  const base = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: width / base.width });
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvas, canvasContext: ctx, viewport }).promise;
  page.cleanup();
  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: "image/jpeg" | "image/png", quality?: number) {
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Gagal membuat gambar."))), type, quality));
}

/** Potong area kotak (beri sedikit ruang tepi supaya gambar tidak terpotong mepet). */
export function cropCanvas(page: HTMLCanvasElement, crop: PdfCrop, pad = 8) {
  const [ymin, xmin, ymax, xmax] = crop.box;
  const clamp = (v: number) => Math.min(1000, Math.max(0, v));
  const x0 = Math.round((clamp(xmin - pad) / 1000) * page.width);
  const y0 = Math.round((clamp(ymin - pad) / 1000) * page.height);
  const x1 = Math.round((clamp(xmax + pad) / 1000) * page.width);
  const y1 = Math.round((clamp(ymax + pad) / 1000) * page.height);
  const out = document.createElement("canvas");
  out.width = Math.max(1, x1 - x0);
  out.height = Math.max(1, y1 - y0);
  out.getContext("2d")!.drawImage(page, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}
