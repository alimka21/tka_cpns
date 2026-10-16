import type { Metadata } from "next";
import { CalendarDays, Clock, TrendingUp, Wallet } from "lucide-react";
import { TransactionsTable } from "@/components/admin/transactions-table";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { formatRupiah } from "@/lib/format";
import { formatWaNumber } from "@/lib/manual-payment";
import { parseTransactionFilters } from "@/lib/transaction-filters";
import { requireAdmin } from "@/server/auth/session";
import { listTransactionsAdmin } from "@/server/queries/transactions";
import { expireStalePendingOrders } from "@/server/services/billing";
import { activeProvider } from "@/server/services/payment-provider";

export const metadata: Metadata = { title: "Transaksi" };
export const dynamic = "force-dynamic";

const STEPS = [
  ["Terima bukti", `Siswa mengirim bukti transfer ke WhatsApp admin (${formatWaNumber()}).`],
  ["Cari nominal", "Ketik nominal persis (mis. 27023) di kolom pencarian — kode unik membuat nominal tiap order berbeda."],
  ["Cocokkan mutasi", "Pastikan dana dengan nominal itu benar-benar masuk di mutasi GoPay Merchant."],
  ["Konfirmasi lunas", "Tekan Verifikasi → Konfirmasi lunas. Premium langsung aktif, lalu kabari siswa lewat WhatsApp."],
] as const;

export default async function AdminTransaksiPage({ searchParams }: PageProps<"/admin/transaksi">) {
  await requireAdmin("/admin/transaksi");
  const filters = parseTransactionFilters(await searchParams);
  await expireStalePendingOrders();
  const data = await listTransactionsAdmin(filters);
  const { stats } = data;
  const manual = activeProvider() === "manual";

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Transaksi"
        description="Semua pembayaran Premium: verifikasi pembayaran QRIS manual, pantau status gateway, dan rekap pendapatan. Order menunggu lebih dari 3 hari otomatis kedaluwarsa (masih bisa dikonfirmasi bila dana ternyata masuk)."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Perlu verifikasi" value={String(stats.pending)} icon={Clock} tone="cta" hint="Order menunggu pembayaran / konfirmasi" />
        <StatCard label="Pendapatan hari ini" value={formatRupiah(stats.revenueToday)} icon={Wallet} tone="success" hint={`${stats.paidToday} transaksi lunas`} />
        <StatCard label="Pendapatan bulan ini" value={formatRupiah(stats.revenueMonth)} icon={CalendarDays} hint={`${stats.paidMonth} transaksi lunas`} />
        <StatCard label="Total pendapatan" value={formatRupiah(stats.revenueAll)} icon={TrendingUp} tone="muted" hint={`${stats.paidAll} transaksi lunas sejak awal`} />
      </div>

      {manual && (
        <section aria-labelledby="alur-verifikasi" className="surface-card p-5">
          <h2 id="alur-verifikasi" className="text-sm font-bold">
            Alur verifikasi QRIS manual
          </h2>
          <ol className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {STEPS.map(([title, text], i) => (
              <li key={title} className="flex gap-3 rounded-lg bg-muted/50 p-3 text-sm">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</span>
                <span>
                  <span className="block font-semibold">{title}</span>
                  <span className="text-xs text-muted-foreground">{text}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <TransactionsTable data={data} filters={filters} />
    </div>
  );
}
