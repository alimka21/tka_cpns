import type { Metadata } from "next";
import { PackageForm } from "@/components/admin/package-form";
import { PageHeader } from "@/components/layout/page-header";
import { listCategories } from "@/server/queries/packages";
import { listQuestions } from "@/server/queries/question-bank";

export const metadata: Metadata = { title: "Buat Paket Tes" };
export const dynamic = "force-dynamic";

export default async function AdminPaketBaruPage() {
  const [categories, allQuestions] = await Promise.all([listCategories(), listQuestions()]);
  const bank = allQuestions.filter((q) => q.status === "published");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Buat Paket Tes" description="Pilih soal yang sudah tayang, atur urutan, lalu terbitkan." />
      <PackageForm categories={categories} bank={bank} />
    </div>
  );
}
