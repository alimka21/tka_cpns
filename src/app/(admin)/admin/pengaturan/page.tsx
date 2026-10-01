import type { Metadata } from "next";
import Link from "next/link";
import { CreditCard, UserCheck } from "lucide-react";
import { ApprovalSetting } from "@/components/admin/approval-setting";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { getSetting } from "@/server/services/app-settings";

export const metadata: Metadata = { title: "Pengaturan Sistem" };
export const dynamic = "force-dynamic";

export default async function AdminPengaturanPage() {
  const requireApproval = await getSetting("registration.requireApproval");
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader title="Pengaturan Sistem" description="Aturan pendaftaran dan akses untuk seluruh pengguna." />

      <section className="surface-card flex flex-col gap-4 p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <UserCheck className="size-5 text-primary" aria-hidden /> Pendaftaran
        </h2>
        <ApprovalSetting enabled={requireApproval} />
        <Link href="/admin/users" className="w-fit text-sm font-semibold text-primary hover:underline">
          Buka Manajemen User
        </Link>
      </section>

      <section className="surface-card flex flex-col gap-3 p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <CreditCard className="size-5 text-primary" aria-hidden /> Pembayaran otomatis <Badge variant="muted">Belum aktif</Badge>
        </h2>
        <p className="text-sm text-muted-foreground">
          Saat ini akses paket premium diberikan manual per paket di halaman{" "}
          <Link href="/admin/paket-tes" className="font-semibold text-primary hover:underline">
            Paket Tes
          </Link>
          . Struktur data sudah siap untuk payment gateway: setelah pembayaran berhasil, sistem akan membuat akses paket
          (entitlement “purchase”) secara otomatis — siswa langsung bisa mengerjakan paket tanpa menunggu admin.
        </p>
        <p className="text-sm text-muted-foreground">Butuh akun merchant payment gateway (mis. Midtrans) sebelum diaktifkan.</p>
      </section>
    </div>
  );
}
