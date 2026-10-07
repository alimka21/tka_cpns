import type { Metadata } from "next";
import Link from "next/link";
import { CreditCard, MessageSquareQuote, UserCheck } from "lucide-react";
import { ApprovalSetting } from "@/components/admin/approval-setting";
import { TestimonialsSetting } from "@/components/admin/testimonials-setting";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { getSetting } from "@/server/services/app-settings";
import { isDokuConfigured } from "@/server/services/doku";

export const metadata: Metadata = { title: "Pengaturan Sistem" };
export const dynamic = "force-dynamic";

export default async function AdminPengaturanPage() {
  const [requireApproval, testimonials] = await Promise.all([getSetting("registration.requireApproval"), getSetting("landing.testimonials")]);
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader title="Pengaturan Sistem" description="Aturan pendaftaran, akses, dan konten halaman depan." />

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
          <CreditCard className="size-5 text-primary" aria-hidden /> Pembayaran & Premium{" "}
          <Badge variant={isDokuConfigured() ? "success" : "muted"}>{isDokuConfigured() ? "DOKU QRIS aktif" : "Belum dikonfigurasi"}</Badge>
        </h2>
        <p className="text-sm text-muted-foreground">
          Akun gratis hanya bisa mengerjakan paket tes gratis. Premium membuka semua paket premium sesuai jenjang + Latihan
          Kelemahan, aktif otomatis setelah pembayaran QRIS (DOKU) berhasil.
        </p>
        <Link href="/admin/langganan" className="w-fit text-sm font-semibold text-primary hover:underline">
          Atur paket langganan, harga & transaksi
        </Link>
      </section>

      <section className="surface-card flex flex-col gap-4 p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <MessageSquareQuote className="size-5 text-primary" aria-hidden /> Testimoni Halaman Depan
        </h2>
        <TestimonialsSetting initial={testimonials} />
      </section>
    </div>
  );
}
