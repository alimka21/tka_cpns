import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PackageForm } from "@/components/admin/package-form";
import { PageHeader } from "@/components/layout/page-header";
import { getPackageDetail, listCategories, listEntitledUsers } from "@/server/queries/packages";
import { listQuestions } from "@/server/queries/question-bank";

export const metadata: Metadata = { title: "Kelola Paket Tes" };
export const dynamic = "force-dynamic";

export default async function AdminPaketEditPage({ params }: PageProps<"/admin/paket-tes/[id]">) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [pkg, categories, allQuestions] = await Promise.all([getPackageDetail(id), listCategories(), listQuestions()]);
  if (!pkg) notFound();

  const bank = allQuestions.filter((q) => q.status === "published" || pkg.questions.some((pq) => pq.id === q.id));
  const entitledUsers = pkg.isPremium ? await listEntitledUsers(id) : [];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={pkg.title} description="Ubah metadata, susunan soal, dan akses premium paket ini." />
      <PackageForm
        categories={categories}
        bank={bank}
        entitledUsers={entitledUsers}
        initial={{
          id: pkg.id,
          title: pkg.title,
          description: pkg.description,
          categoryId: pkg.categoryId,
          durationMinutes: pkg.durationMinutes,
          isPremium: pkg.isPremium,
          status: pkg.status,
          questionIds: pkg.questions.map((q) => q.id),
          pointsOverrideByQuestion: Object.fromEntries(pkg.questions.map((q) => [q.id, q.pointsOverride])),
        }}
      />
    </div>
  );
}
