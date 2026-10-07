import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenCheck, Check, Crown, Dumbbell, Lock, Sparkles, TrendingUp } from "lucide-react";
import { BuyPlanButton } from "@/components/billing/buy-plan-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatDateTime, formatRupiah, ORDER_STATUS_META } from "@/lib/format";
import { requireUser } from "@/server/auth/session";
import { getActiveMembership, listPlans, listUserOrders } from "@/server/services/billing";
import { isDokuConfigured } from "@/server/services/doku";

export const metadata: Metadata = { title: "Langganan Premium" };
export const dynamic = "force-dynamic";

const BENEFITS = [
  { icon: BookOpenCheck, text: "Semua paket tes premium sesuai jenjangmu" },
  { icon: Dumbbell, text: "Latihan Kelemahan — soal khusus subtopik yang paling lemah, lengkap dengan pembahasan langsung" },
  { icon: Sparkles, text: "Latihan AI saat bank soal kurang (pakai key Gemini-mu)" },
  { icon: TrendingUp, text: "Diagnosa & progres kemampuan yang terus diperbarui" },
];

export default async function LanggananPage() {
  const { user } = await requireUser("/langganan");
  const userId = Number(user.id);
  const jenjang = user.role === "admin" ? null : (user.jenjang ?? null);
  const [membership, plans, orders] = await Promise.all([
    getActiveMembership(userId, jenjang),
    listPlans({ activeOnly: true, jenjang }),
    listUserOrders(userId),
  ]);
  const configured = isDokuConfigured();
  const pendingOrder = orders.find((o) => o.status === "pending" && o.redirectUrl);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <header className="text-center">
        <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-cta/15 text-cta">
          <Crown className="size-6" aria-hidden />
        </span>
        <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-[1.75rem]">Premium {jenjang ?? ""}</h1>
        <p className="mx-auto mt-1 max-w-2xl text-muted-foreground">
          Akun gratis bisa mengerjakan paket tes gratis. Premium membuka semua paket tes & latihan berbasis kelemahanmu —
          aktif otomatis begitu pembayaran berhasil.
        </p>
      </header>

      {membership ? (
        <section className="surface-card flex flex-col items-center gap-2 border-success/40 p-6 text-center">
          <Badge variant="success">
            <Check aria-hidden /> Premium aktif
          </Badge>
          <p className="text-lg font-bold">
            {membership.endsAt ? `Berlaku sampai ${formatDate(membership.endsAt.toISOString())}` : "Berlaku selamanya"}
          </p>
          <p className="text-sm text-muted-foreground">Membeli lagi akan memperpanjang masa aktifmu.</p>
          <Button nativeButton={false} render={<Link href="/latihan" />}>
            <Dumbbell aria-hidden /> Mulai Latihan Kelemahan
          </Button>
        </section>
      ) : (
        <section className="surface-card grid gap-3 p-6 sm:grid-cols-2">
          {BENEFITS.map(({ icon: Icon, text }) => (
            <p key={text} className="flex gap-3 text-sm">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="pt-1.5">{text}</span>
            </p>
          ))}
        </section>
      )}

      {pendingOrder && (
        <section className="flex flex-col items-start gap-3 rounded-xl border border-warning/40 bg-warning-soft p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-warning-strong">
            Ada pembayaran <strong>{pendingOrder.planName}</strong> ({formatRupiah(pendingOrder.amount)}) yang belum selesai.
          </p>
          <Button size="sm" nativeButton={false} render={<a href={pendingOrder.redirectUrl!} />}>
            Lanjutkan pembayaran
          </Button>
        </section>
      )}

      <section aria-labelledby="pilih-heading" className="flex flex-col gap-4">
        <h2 id="pilih-heading" className="text-xl font-bold">
          {membership ? "Perpanjang Premium" : "Pilih paket Premium"}
        </h2>
        {!configured ? (
          <p className="surface-card px-6 py-10 text-center text-sm text-muted-foreground">
            Pembayaran online sedang disiapkan. Hubungi admin untuk membuka Premium.
          </p>
        ) : plans.length === 0 ? (
          <p className="surface-card px-6 py-10 text-center text-sm text-muted-foreground">Belum ada paket Premium untuk jenjangmu.</p>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((p) => (
              <li key={p.id} className="surface-card flex flex-col gap-4 p-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold">{p.name}</h3>
                    <Badge variant="info">{p.jenjang ?? "Semua jenjang"}</Badge>
                  </div>
                  {p.description && <p className="mt-1 text-sm whitespace-pre-line text-muted-foreground">{p.description}</p>}
                </div>
                <div>
                  <span className="text-3xl font-extrabold tracking-tight">{formatRupiah(p.price)}</span>
                  <span className="ml-1 text-sm text-muted-foreground">/ {p.durationDays ? `${p.durationDays} hari` : "selamanya"}</span>
                </div>
                <div className="mt-auto">
                  <BuyPlanButton planId={p.id} label={membership ? "Perpanjang" : "Bayar sekarang"} />
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="size-3.5" aria-hidden /> Bayar dengan QRIS — bisa dari GoPay, OVO, DANA, ShopeePay, atau m-banking. Diproses aman oleh DOKU.
        </p>
      </section>

      {orders.length > 0 && (
        <section aria-labelledby="riwayat-bayar" className="flex flex-col gap-3">
          <h2 id="riwayat-bayar" className="text-lg font-bold">
            Riwayat pembayaran
          </h2>
          <ul className="surface-card divide-y text-sm">
            {orders.map((o) => {
              const meta = ORDER_STATUS_META[o.status];
              return (
                <li key={o.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{o.planName}</div>
                    <div className="text-xs text-muted-foreground">
                      {o.orderCode} · {formatDateTime(o.createdAt.toISOString())}
                    </div>
                  </div>
                  <span className="font-semibold tabular-nums">{formatRupiah(o.amount)}</span>
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                  <Link href={`/langganan/selesai?order_id=${encodeURIComponent(o.orderCode)}`} className="text-xs font-semibold text-primary hover:underline">
                    Detail
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
