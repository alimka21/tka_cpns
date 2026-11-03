import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { LeadMagnetList } from "@/components/admin/lead-magnet-list";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/server/auth/session";
import { listLeadMagnetsAdmin } from "@/server/services/lead-magnets";

export const metadata: Metadata = { title: "Materi (Lead Magnet)" };
export const dynamic = "force-dynamic";

export default async function AdminMateriPage() {
  await requireAdmin("/admin/materi");
  const rows = await listLeadMagnetsAdmin();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Materi (Lead Magnet)"
        description="File materi gratis di pakartka.com/materi/<slug> untuk link kampanye (DM Instagram, bio, story). Tambahkan utm_* di link, mis. ?utm_source=instagram&utm_medium=dm&utm_campaign=gel2&utm_content=file."
        actions={
          <Button nativeButton={false} render={<Link href="/admin/materi/baru" />}>
            <Plus aria-hidden /> Materi baru
          </Button>
        }
      />
      <LeadMagnetList rows={rows} />
    </div>
  );
}
