import type { Metadata } from "next";
import { BadgeCheck, Clock, UserPlus, Users } from "lucide-react";
import { ReferrersTable } from "@/components/admin/referrers-table";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { formatRupiah } from "@/lib/format";
import { requireAdmin } from "@/server/auth/session";
import { listReferrersAdmin } from "@/server/services/referrals";

export const metadata: Metadata = { title: "Referal Siswa (lama)" };
export const dynamic = "force-dynamic";

export default async function AdminReferalPage() {
  await requireAdmin("/admin/referal");
  const { rows, totals } = await listReferrersAdmin();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Referal Siswa (lama)"
        description="Program referal siswa → siswa sudah dihentikan (2026-11-13) dan diganti Afiliasi Guru. Halaman ini hanya untuk mentransfer komisi lama yang masih tercatat."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pemberi referal" value={String(totals.referrers)} icon={Users} hint="Punya ≥1 pendaftar" />
        <StatCard label="Pendaftar lewat referal" value={String(totals.referred)} icon={UserPlus} tone="success" />
        <StatCard label="Komisi belum dibayar" value={formatRupiah(totals.pending)} icon={Clock} tone="cta" hint="Perlu ditransfer" />
        <StatCard label="Komisi sudah dibayar" value={formatRupiah(totals.paid)} icon={BadgeCheck} tone="muted" />
      </div>

      <ReferrersTable rows={rows} />

    </div>
  );
}
