import { buildImportTemplate } from "@/server/services/question-import";

// Unduh template Excel import soal.
export async function GET() {
  const buffer = await buildImportTemplate();
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="template-import-soal.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
