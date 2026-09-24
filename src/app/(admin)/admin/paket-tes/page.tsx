import type { Metadata } from "next";
import { Package } from "lucide-react";
import { ComingSoon, PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Paket Tes" };

export default function AdminPaketTesPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Paket Tes" description="Susun paket, atur durasi, dan tandai paket gratis atau premium." />
      <ComingSoon icon={<Package className="size-7" aria-hidden />} title="Segera hadir (Fase 1)">
        Penyusunan paket tes dari bank soal. Aktif setelah koneksi database siap.
      </ComingSoon>
    </div>
  );
}
