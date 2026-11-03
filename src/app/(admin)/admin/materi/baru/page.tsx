import type { Metadata } from "next";
import { LeadMagnetForm } from "@/components/admin/lead-magnet-form";
import { PageHeader } from "@/components/layout/page-header";
import { SITE_URL } from "@/lib/site";
import { requireAdmin } from "@/server/auth/session";
import { listCtaPackageOptions } from "@/server/services/lead-magnets";

export const metadata: Metadata = { title: "Materi Baru" };
export const dynamic = "force-dynamic";

export default async function AdminMateriBaruPage() {
  await requireAdmin("/admin/materi/baru");
  const packages = await listCtaPackageOptions();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Materi Baru" description="Unggah file materi, atur apakah wajib daftar untuk mengunduh, dan pilih paket tes yang ditawarkan." />
      <LeadMagnetForm packages={packages} siteUrl={SITE_URL} />
    </div>
  );
}
