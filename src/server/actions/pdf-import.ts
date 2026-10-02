"use server";

// Impor PDF (admin). Halaman PDF dirender jadi JPEG di browser lalu dikirim
// ke sini; API key Gemini milik admin yang sedang login.

import { revalidatePath } from "next/cache";
import type { PdfExtractResult } from "@/lib/pdf-import-types";
import { getAdminSession } from "@/server/auth/session";
import { PDF_MAX_PAGES } from "@/server/services/pdf-import-map";
import { extractFromPdf, savePdfImport, type PdfSaveResult } from "@/server/services/pdf-import";

const PAGE_MAX_BYTES = 1_500_000;

export async function extractPdfAction(form: FormData): Promise<PdfExtractResult> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: "Sesi admin berakhir. Silakan masuk lagi." };
  const subjectCode = String(form.get("subjectCode") ?? "");
  const files = form.getAll("page").filter((f): f is File => f instanceof File);
  if (files.length > PDF_MAX_PAGES) return { ok: false, error: `Maksimal ${PDF_MAX_PAGES} halaman per impor.` };
  if (files.some((f) => f.type !== "image/jpeg" || f.size > PAGE_MAX_BYTES)) return { ok: false, error: "Halaman PDF gagal diproses di browser. Muat ulang lalu coba lagi." };
  const pages = await Promise.all(files.map(async (f) => ({ mime: "image/jpeg", data: Buffer.from(await f.arrayBuffer()) })));
  return extractFromPdf(Number(session.user.id), subjectCode, pages);
}

export async function savePdfImportAction(input: unknown): Promise<PdfSaveResult> {
  const session = await getAdminSession();
  if (!session) return { ok: false, errors: ["Sesi admin berakhir. Silakan masuk lagi."] };
  const result = await savePdfImport(Number(session.user.id), input);
  if (result.ok) {
    revalidatePath("/admin/soal");
    revalidatePath("/admin/paket-tes");
  }
  return result;
}
