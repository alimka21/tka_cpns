import { getAdminSession } from "@/server/auth/session";
import { buildImportTemplate } from "@/server/services/question-import";

// Unduh template Excel import soal (khusus admin).
export async function GET() {
  if (!(await getAdminSession())) return new Response("Tidak diizinkan", { status: 401 });
  const buffer = await buildImportTemplate();
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="template-import-soal.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
