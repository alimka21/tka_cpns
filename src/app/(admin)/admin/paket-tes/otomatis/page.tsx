import type { Metadata } from "next";
import { AutoPackageBuilder, type AutoJenjangOption } from "@/components/admin/auto-package-builder";
import { PageHeader } from "@/components/layout/page-header";
import { packageRuleFor } from "@/lib/package-rules";
import { listCategories, listSubjects } from "@/server/queries/packages";

export const metadata: Metadata = { title: "Buat Paket Otomatis" };
export const dynamic = "force-dynamic";

export default async function AdminPaketOtomatisPage({ searchParams }: PageProps<"/admin/paket-tes/otomatis">) {
  const { jenjang } = await searchParams;
  const [categories, subjects] = await Promise.all([listCategories(), listSubjects()]);
  // Hanya mapel yang punya aturan paket (jumlah soal & durasi).
  const options: AutoJenjangOption[] = categories.map((c) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    subjects: subjects
      .filter((s) => s.categoryId === c.id && packageRuleFor(c.code, { code: s.code, type: s.type }))
      .map((s) => ({ id: s.id, name: s.name })),
  }));
  const initial = options.find((o) => o.code === jenjang)?.id;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Buat Paket Otomatis"
        description="Ambil soal bank yang belum dipakai, lalu AI menambal kekurangan per topik & subtopik sampai aturan paket terpenuhi."
      />
      <AutoPackageBuilder options={options} initialCategoryId={initial} />
    </div>
  );
}
