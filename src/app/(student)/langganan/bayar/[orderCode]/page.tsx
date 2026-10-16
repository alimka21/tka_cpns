import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft, Download, TriangleAlert } from "lucide-react";
import { ManualProofDialog } from "@/components/billing/manual-proof-dialog";
import { Button } from "@/components/ui/button";
import { formatDateTime, formatRupiah } from "@/lib/format";
import { PLACEHOLDER_EMAIL_DOMAIN } from "@/lib/identity";
import { MANUAL_QRIS_IMAGE, MANUAL_QRIS_MERCHANT } from "@/lib/manual-payment";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { orders, users } from "@/server/db/schema";
import { providerOfOrder } from "@/server/services/payment-provider";

export const metadata: Metadata = { title: "Bayar Premium" };
export const dynamic = "force-dynamic";

// Halaman bayar QRIS manual (PAYMENT_PROVIDER=manual): scan QRIS statis, transfer
// TEPAT sebesar harga + kode unik, lalu kirim bukti ke WhatsApp admin.
export default async function BayarManualPage({ params }: PageProps<"/langganan/bayar/[orderCode]">) {
  const { user } = await requireUser("/langganan");
  const code = decodeURIComponent((await params).orderCode).slice(0, 50);
  if (providerOfOrder(code) !== "manual") notFound();
  const [order] = await db.select().from(orders).where(eq(orders.orderCode, code));
  if (!order || order.userId !== Number(user.id)) notFound();
  if (order.status !== "pending") redirect(`/langganan/selesai?order_id=${encodeURIComponent(code)}`);

  const [profile] = await db
    .select({ name: users.name, email: users.email, username: users.username, province: users.province, schoolName: users.schoolName })
    .from(users)
    .where(eq(users.id, order.userId));
  const meta = (order.lastPayload ?? {}) as { uniqueCode?: number; basePrice?: number };
  const uniqueCode = meta.uniqueCode ?? null;
  const basePrice = meta.basePrice ?? (uniqueCode != null ? order.amount - uniqueCode : order.amount);
  const total = formatRupiah(order.amount);
  // Pisahkan 3 digit terakhir agar kode unik tampil menonjol: "Rp27.0" + "23".
  const codeDigits = uniqueCode != null ? String(uniqueCode).length : 0;
  const totalHead = codeDigits ? total.slice(0, total.length - codeDigits) : total;
  const totalTail = codeDigits ? total.slice(total.length - codeDigits) : "";
  const account = profile.email.endsWith(`@${PLACEHOLDER_EMAIL_DOMAIN}`) ? `@${profile.username}` : profile.email;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <Link href="/langganan" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> Kembali ke Langganan
      </Link>
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Selesaikan pembayaran</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {order.planName} · {order.orderCode} · dibuat {formatDateTime(order.createdAt.toISOString())}
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section className="surface-card flex flex-col items-center gap-3 p-4">
          <Image
            src={MANUAL_QRIS_IMAGE}
            alt={`QRIS ${MANUAL_QRIS_MERCHANT}`}
            width={1129}
            height={1600}
            priority
            className="h-auto w-full max-w-sm rounded-lg"
          />
          <Button variant="outline" size="sm" nativeButton={false} render={<a href={MANUAL_QRIS_IMAGE} download="QRIS-Pakar-TKA.jpg" />}>
            <Download aria-hidden /> Simpan gambar QRIS
          </Button>
        </section>

        <section className="flex flex-col gap-4">
          <div className="surface-card flex flex-col gap-3 p-5">
            <p className="text-sm font-semibold text-muted-foreground">Total yang harus ditransfer</p>
            <p className="text-4xl font-extrabold tracking-tight tabular-nums">
              {totalHead}
              <span className="rounded-md bg-cta/20 px-1 text-cta">{totalTail}</span>
            </p>
            {uniqueCode != null && (
              <dl className="grid grid-cols-[1fr_auto] gap-y-1 border-t pt-3 text-sm">
                <dt className="text-muted-foreground">Harga paket</dt>
                <dd className="text-right tabular-nums">{formatRupiah(basePrice)}</dd>
                <dt className="text-muted-foreground">Kode unik</dt>
                <dd className="text-right font-semibold text-cta tabular-nums">{uniqueCode}</dd>
              </dl>
            )}
            <p className="flex gap-2 rounded-lg border border-warning/50 bg-warning-soft p-3 text-sm text-warning-strong">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                Transfer <strong>tepat {total}</strong> (jangan dibulatkan). Kode unik dipakai admin untuk mencocokkan pembayaranmu.
              </span>
            </p>
          </div>

          <ol className="surface-card flex list-decimal flex-col gap-2 p-5 pl-10 text-sm">
            <li>Buka GoPay, OVO, DANA, ShopeePay, atau m-banking lalu pilih bayar/scan QRIS.</li>
            <li>
              Scan QRIS di samping (atas nama <strong>{MANUAL_QRIS_MERCHANT}</strong>). Di HP? Simpan gambar QRIS lalu unggah dari galeri di aplikasi
              pembayaranmu.
            </li>
            <li>
              Masukkan nominal <strong>{total}</strong>, selesaikan pembayaran, lalu screenshot bukti transfer.
            </li>
            <li>Tekan &ldquo;Saya sudah transfer&rdquo; dan kirim bukti ke WhatsApp admin. Premium diaktifkan setelah diverifikasi.</li>
          </ol>

          <ManualProofDialog
            info={{
              name: profile.name,
              province: profile.province ?? "",
              school: profile.schoolName ?? "",
              account,
              planName: order.planName,
              orderCode: order.orderCode,
              amount: total,
            }}
          />
        </section>
      </div>
    </div>
  );
}
