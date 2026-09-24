import type { Metadata } from "next";
import { FolderTree } from "lucide-react";
import { ComingSoon, PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Topik & Subtopik" };

export default function AdminTopikPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Topik & Subtopik" description="Struktur Jenjang → Mata Pelajaran → Subtopik untuk bank soal." />
      <ComingSoon icon={<FolderTree className="size-7" aria-hidden />} title="Segera hadir (Fase 1)">
        CRUD jenjang, mata pelajaran, dan subtopik. Aktif setelah koneksi database siap.
      </ComingSoon>
    </div>
  );
}
