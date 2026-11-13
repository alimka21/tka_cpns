import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Clock, Download, GraduationCap, Hourglass, ShoppingBag, UserPlus } from "lucide-react";
import { AddAffiliateForm, AffiliateSettingsForm, AffiliatesTable } from "@/components/admin/affiliates-panel";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { Button } from "@/components/ui/button";
import { COMMISSION_HOLD_DAYS, MIN_PAYOUT } from "@/lib/affiliate";
import { formatRupiah } from "@/lib/format";
import { SITE_URL } from "@/lib/site";
import { requireAdmin } from "@/server/auth/session";
import { listAffiliatesAdmin } from "@/server/services/affiliates";
import { listReferrersAdmin } from "@/server/services/referrals";

export const metadata: Metadata = { title: "Afiliasi Guru" };
export const dynamic = "force-dynamic";

export default async function AdminAfiliasiPage() {
  await requireAdmin("/admin/afiliasi");
  const [{ rows, totals, defaultPercent, discount }, legacy] = await Promise.all([listAffiliatesAdmin(), listReferrersAdmin()]);
  const signupUrl = `${SITE_URL.replace(/\/$/, "")}/daftar`;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Afiliasi Guru"
        description={`Guru yang ditambahkan lewat email mendapat kode khusus dan Premium gratis. Siswa yang memakai kodenya mendapat diskon ${discount}% di pembelian pertama; guru mendapat komisi ${defaultPercent}% dari nominal yang dibayar (sekali per siswa). Komisi siap cair ${COMMISSION_HOLD_DAYS} hari setelah lunas, transfer manual minimal ${formatRupiah(MIN_PAYOUT)}.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Guru aktif" value={String(totals.affiliates)} icon={GraduationCap} />
        <StatCard label="Siswa lewat kode guru" value={String(totals.referred)} icon={UserPlus} tone="success" hint={`${totals.buyers} membeli`} />
        <StatCard label="Siap cair" value={formatRupiah(totals.available)} icon={Clock} tone="cta" hint="Perlu ditransfer" />
        <StatCard label="Masa tahan" value={formatRupiah(totals.held)} icon={Hourglass} tone="muted" />
        <StatCard label="Sudah ditransfer" value={formatRupiah(totals.paid)} icon={BadgeCheck} tone="muted" />
      </div>

      <section className="surface-card flex flex-col gap-3 p-5">
        <div>
          <h2 className="font-bold">Tambah guru</h2>
          <p className="text-sm text-muted-foreground">
            Email yang sudah punya akun langsung aktif. Email baru berstatus &ldquo;Diundang&rdquo; dan aktif otomatis saat guru mendaftar (email/Google)
            dengan email yang sama — kirim undangannya lewat tombol WA di detail guru.
          </p>
        </div>
        <AddAffiliateForm defaultPercent={defaultPercent} />
      </section>

      <AffiliatesTable rows={rows} defaultPercent={defaultPercent} signupUrl={signupUrl} />

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" nativeButton={false} render={<a href="/api/admin/afiliasi" download />}>
          <Download aria-hidden /> Unduh CSV komisi
        </Button>
        {legacy.totals.pending > 0 && (
          <p className="text-sm text-muted-foreground">
            <ShoppingBag className="mr-1 inline size-4" aria-hidden />
            Masih ada komisi referal siswa lama {formatRupiah(legacy.totals.pending)} —{" "}
            <Link href="/admin/referal" className="font-semibold text-primary hover:underline">
              lihat Referal Siswa (lama)
            </Link>
          </p>
        )}
      </div>

      <section className="surface-card flex flex-col gap-3 p-5">
        <div>
          <h2 className="font-bold">Pengaturan afiliasi</h2>
          <p className="text-sm text-muted-foreground">Berlaku untuk pembayaran berikutnya; komisi yang sudah tercatat tidak berubah. Komisi khusus per guru diatur di detail guru.</p>
        </div>
        <AffiliateSettingsForm percent={defaultPercent} discount={discount} />
      </section>
    </div>
  );
}
