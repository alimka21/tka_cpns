import type { Metadata } from "next";
import Link from "next/link";
import { Calculator, CreditCard, MessageSquareQuote, UserCheck } from "lucide-react";
import { ApprovalSetting } from "@/components/admin/approval-setting";
import { ConversionSettings, ThresholdSettings, type ThresholdState } from "@/components/admin/scoring-settings";
import { SupportWhatsappSetting } from "@/components/admin/support-whatsapp-setting";
import { getThresholdsByScale } from "@/server/queries/achievement-thresholds";
import { SCORE_SCALES } from "@/lib/score-scale";
import { TestimonialsSetting } from "@/components/admin/testimonials-setting";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { getSetting } from "@/server/services/app-settings";
import { activeProvider, isProviderConfigured, isProviderProduction, PROVIDER_LABEL } from "@/server/services/payment-provider";

export const metadata: Metadata = { title: "Pengaturan Sistem" };
export const dynamic = "force-dynamic";

export default async function AdminPengaturanPage() {
  const [requireApproval, testimonials, supportWhatsapp, conversion, thresholds] = await Promise.all([
    getSetting("registration.requireApproval"),
    getSetting("landing.testimonials"),
    getSetting("support.whatsapp"),
    getSetting("scoring.conversion"),
    getThresholdsByScale(),
  ]);
  const thresholdState = Object.fromEntries(
    SCORE_SCALES.map((s) => {
      const rows = thresholds[s].rows;
      const memadai = rows.find((r) => r.category === "memadai");
      const baik = rows.find((r) => r.category === "baik");
      return [s, memadai && baik ? { memadaiFrom: memadai.minScore, baikFrom: baik.minScore, official: thresholds[s].official } : null];
    }),
  ) as ThresholdState;
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader title="Pengaturan Sistem" description="Aturan pendaftaran, penskoran, akses, dan konten halaman depan." />

      <section className="surface-card flex flex-col gap-4 p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <UserCheck className="size-5 text-primary" aria-hidden /> Pendaftaran
        </h2>
        <ApprovalSetting enabled={requireApproval} />
        <SupportWhatsappSetting initial={supportWhatsapp} />
        <Link href="/admin/users" className="w-fit text-sm font-semibold text-primary hover:underline">
          Buka Manajemen User
        </Link>
      </section>

      <section className="surface-card flex flex-col gap-6 p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Calculator className="size-5 text-primary" aria-hidden /> Penskoran & Kategori Capaian
        </h2>
        <div className="flex flex-col gap-2">
          <h3 className="font-semibold">Ambang kategori Baik / Memadai / Kurang</h3>
          <ThresholdSettings initial={thresholdState} />
        </div>
        <div className="flex flex-col gap-2 border-t pt-6">
          <h3 className="font-semibold">Rumus konversi skor mentah → nilai</h3>
          <ConversionSettings version={conversion.version} scales={conversion.scales} />
        </div>
      </section>

      <section className="surface-card flex flex-col gap-3 p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <CreditCard className="size-5 text-primary" aria-hidden /> Pembayaran & Premium{" "}
          <Badge variant={isProviderConfigured(activeProvider()) ? "success" : "muted"}>
            {isProviderConfigured(activeProvider())
              ? `${PROVIDER_LABEL[activeProvider()]} ${isProviderProduction(activeProvider()) ? "aktif" : "Sandbox"}`
              : "Belum dikonfigurasi"}
          </Badge>
        </h2>
        <p className="text-sm text-muted-foreground">
          Akun gratis hanya bisa mengerjakan paket tes gratis. Premium membuka semua paket premium sesuai jenjang + Latihan
          Kelemahan, aktif otomatis setelah pembayaran online berhasil.
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
