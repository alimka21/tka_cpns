import type { Metadata } from "next";
import { BadgeCheck, Clock, UserPlus, Users } from "lucide-react";
import { CommissionPercentForm, ReferrersTable } from "@/components/admin/referrers-table";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { formatRupiah } from "@/lib/format";
import { requireAdmin } from "@/server/auth/session";
import { listReferrersAdmin } from "@/server/services/referrals";

export const metadata: Metadata = { title: "Referal & Komisi" };
export const dynamic = "force-dynamic";

export default async function AdminReferalPage() {
  await requireAdmin("/admin/referal");
  const { rows, totals, percent } = await listReferrersAdmin();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Referal & Komisi"
        description={`Siapa saja yang mengajak pendaftar baru, berapa yang membeli Premium, dan komisi ${percent}% yang perlu ditransfer. Transfer dilakukan manual, lalu tekan “Catat pembayaran”.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pemberi referal" value={String(totals.referrers)} icon={Users} hint="Punya ≥1 pendaftar" />
        <StatCard label="Pendaftar lewat referal" value={String(totals.referred)} icon={UserPlus} tone="success" />
        <StatCard label="Komisi belum dibayar" value={formatRupiah(totals.pending)} icon={Clock} tone="cta" hint="Perlu ditransfer" />
        <StatCard label="Komisi sudah dibayar" value={formatRupiah(totals.paid)} icon={BadgeCheck} tone="muted" />
      </div>

      <ReferrersTable rows={rows} />

      <section className="surface-card flex flex-col gap-3 p-5">
        <div>
          <h2 className="font-bold">Pengaturan komisi</h2>
          <p className="text-sm text-muted-foreground">
            Berlaku untuk pembayaran yang lunas setelah disimpan; komisi yang sudah tercatat tidak berubah.
          </p>
        </div>
        <CommissionPercentForm percent={percent} />
      </section>
    </div>
  );
}
