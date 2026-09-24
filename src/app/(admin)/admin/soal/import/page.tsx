import type { Metadata } from "next";
import { ImportUploader } from "@/components/admin/import-uploader";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Import Soal" };

export default function AdminImportPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Import Soal"
        description="Tambah banyak soal sekaligus dari Excel. File divalidasi per baris di server sebelum disimpan."
      />
      <ImportUploader />
    </div>
  );
}
