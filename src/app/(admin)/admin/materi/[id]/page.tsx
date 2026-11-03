import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CircleCheck } from "lucide-react";
import { LeadMagnetForm } from "@/components/admin/lead-magnet-form";
import { PageHeader } from "@/components/layout/page-header";
import { SITE_URL } from "@/lib/site";
import { requireAdmin } from "@/server/auth/session";
import { getLeadMagnetAdmin, listCtaPackageOptions } from "@/server/services/lead-magnets";

export const metadata: Metadata = { title: "Ubah Materi" };
export const dynamic = "force-dynamic";

export default async function AdminMateriEditPage({ params, searchParams }: PageProps<"/admin/materi/[id]">) {
  const id = Number((await params).id);
  await requireAdmin(`/admin/materi/${id}`);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const [item, packages] = await Promise.all([getLeadMagnetAdmin(id), listCtaPackageOptions()]);
  if (!item) notFound();
  const { baru } = await searchParams;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Ubah Materi" description={`${SITE_URL}/materi/${item.slug}`} />
      {baru === "1" && (
        <p role="status" className="flex gap-2 rounded-lg border border-success/40 bg-success-soft p-3 text-sm text-success-strong">
          <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden /> Materi tersimpan. Bagikan link di atas (tambahkan utm_* untuk kampanye).
        </p>
      )}
      <LeadMagnetForm initial={item} packages={packages} siteUrl={SITE_URL} />
    </div>
  );
}
