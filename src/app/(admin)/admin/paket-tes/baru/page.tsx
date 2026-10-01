import type { Metadata } from "next";
import { PackageForm } from "@/components/admin/package-form";
import { PageHeader } from "@/components/layout/page-header";
import { listCategories, listSubjects } from "@/server/queries/packages";
import { listQuestions } from "@/server/queries/question-bank";

export const metadata: Metadata = { title: "Buat Paket Tes" };
export const dynamic = "force-dynamic";

export default async function AdminPaketBaruPage() {
  const [categories, subjects, allQuestions] = await Promise.all([listCategories(), listSubjects(), listQuestions()]);
  const bank = allQuestions.filter((q) => q.status === "published");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Buat Paket Tes" description="Pilih jenjang & mata pelajaran — jumlah soal, durasi, dan komposisi bentuk soal mengikuti aturan TKA. Paket hanya bisa diterbitkan bila aturan wajib terpenuhi." />
      <PackageForm categories={categories} subjects={subjects} bank={bank} />
    </div>
  );
}
