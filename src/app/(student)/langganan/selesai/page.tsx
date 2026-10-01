import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { CircleCheck, Clock, XCircle } from "lucide-react";
import { SyncOrderButton } from "@/components/billing/sync-order-button";
import { Button } from "@/components/ui/button";
import { formatDate, formatRupiah, ORDER_STATUS_META } from "@/lib/format";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { orders } from "@/server/db/schema";
import { getActiveMembership, syncOrder } from "@/server/services/billing";
import { isMidtransConfigured } from "@/server/services/midtrans";

export const metadata: Metadata = { title: "Status Pembayaran" };
export const dynamic = "force-dynamic";

// Halaman "finish" Snap Midtrans. Status dicek ulang langsung ke Midtrans
// (cadangan bila webhook belum sampai), lalu ditampilkan.
export default async function LanggananSelesaiPage({ searchParams }: PageProps<"/langganan/selesai">) {
  const { user } = await requireUser("/langganan");
  const { order_id } = await searchParams;
  if (typeof order_id !== "string") notFound();
  const [owned] = await db.select().from(orders).where(eq(orders.orderCode, order_id.slice(0, 50)));
  if (!owned || owned.userId !== Number(user.id)) notFound();

  if (isMidtransConfigured() && owned.status === "pending") await syncOrder(owned.orderCode);
  const [order] = await db.select().from(orders).where(eq(orders.id, owned.id));
  const membership = order.status === "paid" ? await getActiveMembership(Number(user.id), order.jenjang) : null;
  const meta = ORDER_STATUS_META[order.status];
  const Icon = order.status === "paid" ? CircleCheck : order.status === "pending" ? Clock : XCircle;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-5 py-6 text-center">
      <span
        className={`flex size-16 items-center justify-center rounded-full ${
          order.status === "paid" ? "bg-success-soft text-success-strong" : order.status === "pending" ? "bg-warning-soft text-warning-strong" : "bg-muted text-muted-foreground"
        }`}
      >
        <Icon className="size-8" aria-hidden />
      </span>
      <div>
        <h1 className="text-2xl font-bold">
          {order.status === "paid" ? "Pembayaran berhasil — Premium aktif!" : order.status === "pending" ? "Menunggu pembayaran" : `Pembayaran ${meta.label.toLowerCase()}`}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {order.planName} · {formatRupiah(order.amount)} · {order.orderCode}
        </p>
        {membership && (
          <p className="mt-2 text-sm font-semibold text-success-strong">
            {membership.endsAt ? `Premium berlaku sampai ${formatDate(membership.endsAt.toISOString())}.` : "Premium berlaku selamanya."}
          </p>
        )}
        {order.status === "pending" && (
          <p className="mt-2 text-sm text-muted-foreground">
            Selesaikan pembayaran sesuai instruksi Midtrans. Premium aktif otomatis begitu pembayaran kami terima — halaman ini bisa
            dicek ulang.
          </p>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {order.status === "paid" ? (
          <>
            <Button nativeButton={false} render={<Link href="/latihan" />}>
              Mulai Latihan Kelemahan
            </Button>
            <Button variant="outline" nativeButton={false} render={<Link href="/dashboard" />}>
              Lihat paket tes
            </Button>
          </>
        ) : order.status === "pending" ? (
          <>
            {order.redirectUrl && (
              <Button nativeButton={false} render={<a href={order.redirectUrl} />}>
                Lanjutkan pembayaran
              </Button>
            )}
            <SyncOrderButton orderCode={order.orderCode} />
          </>
        ) : (
          <Button nativeButton={false} render={<Link href="/langganan" />}>
            Coba lagi
          </Button>
        )}
      </div>
    </div>
  );
}
