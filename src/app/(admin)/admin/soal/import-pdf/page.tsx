import type { Metadata } from "next";
import { PdfImporter, type PdfImportSubject } from "@/components/admin/pdf-importer";
import { PageHeader } from "@/components/layout/page-header";
import { listCategories, listSubjects } from "@/server/queries/packages";

export const metadata: Metadata = { title: "Impor PDF" };
export const dynamic = "force-dynamic";

export default async function AdminImportPdfPage() {
  const [categories, subjects] = await Promise.all([listCategories(), listSubjects()]);
  const options: PdfImportSubject[] = categories.flatMap((c) =>
    subjects.filter((s) => s.categoryId === c.id).map((s) => ({ code: s.code, name: s.name, jenjang: c.code, type: s.type, outline: s.outline })),
  );
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Impor PDF"
        description="Unggah PDF soal (termasuk hasil scan). Gemini menyalin bacaan, soal, opsi, dan memotong gambarnya — kamu tinjau dulu sebelum disimpan."
      />
      <PdfImporter subjects={options} />
    </div>
  );
}
