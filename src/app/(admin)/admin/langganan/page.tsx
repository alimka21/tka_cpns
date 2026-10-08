import type { Metadata } from "next";
import { CircleAlert, CircleCheck, Clock, CreditCard, Crown, Receipt, Wallet, type LucideIcon } from "lucide-react";
import { GrantMembershipForm, RevokeMembershipButton } from "@/components/billing/admin-billing";
import { NewPlanPanel, PlanCard, type PlanCardData } from "@/components/billing/plan-manager";
import { SyncOrderButton } from "@/components/billing/sync-order-button";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { promotedPlan } from "@/lib/plans";
import { formatDate, formatDateTime, formatRupiah, ORDER_STATUS_META } from "@/lib/format";
import { SITE_URL } from "@/lib/site";
import { listActiveMembershipsAdmin, listOrdersAdmin, listPlans, planSalesStats } from "@/server/services/billing";
import { DokuConnectionTest } from "@/components/billing/doku-connection-test";
import { DOKU_NOTIFICATION_PATH, dokuPublicInfo, isDokuConfigured, isDokuProduction } from "@/server/services/doku";

export const metadata: Metadata = { title: "Langganan & Pembayaran" };
export const dynamic = "force-dynamic";

const NEW_DAYS = 7;

export default async function AdminLanggananPage() {
  const [plans, orders, members, sales] = await Promise.all([listPlans({ activeOnly: false }), listOrdersAdmin(), listActiveMembershipsAdmin(), planSalesStats()]);
  const configured = isDokuConfigured();
  const production = isDokuProduction();
  const info = dokuPublicInfo();
  const paidTotal = [...sales.values()].reduce((n, s) => n + s.revenue, 0);
  const pendingTotal = [...sales.values()].reduce((n, s) => n + s.pending, 0);
  const cheapest = promotedPlan(plans);
  // eslint-disable-next-line react-hooks/purity -- server component, dirender per request
  const now = Date.now();
  const cards: PlanCardData[] = plans.map((p) => ({
    ...p,
    description: p.description ?? "",
    createdAt: p.createdAt.toISOString(),
    isNew: now - p.createdAt.getTime() < NEW_DAYS * 86_400_000,
    isCheapest: p.id === cheapest?.id,
    sales: sales.get(p.id) ?? { paid: 0, revenue: 0, pending: 0 },
  }));
  const active = cards.filter((p) => p.isActive);
  const inactive = cards.filter((p) => !p.isActive);
  const stats: [LucideIcon, string, string, string][] = [
    [Wallet, "Pendapatan lunas", formatRupiah(paidTotal), "text-success-strong"],
    [Crown, "Anggota Premium aktif", String(members.length), "text-cta"],
    [Clock, "Pembayaran menunggu", String(pendingTotal), "text-warning-strong"],
    [CreditCard, "Paket dijual", `${active.length} dari ${plans.length}`, "text-primary"],
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Langganan & Pembayaran"
        description="Akun gratis: 1 paket tes gratis per mapel. Premium (dibayar lewat QRIS DOKU atau diberikan admin) membuka semua paket tes jenjangnya, pembahasan, analisa kelemahan, dan Latihan Kelemahan — aktif otomatis setelah pembayaran berhasil."
      />

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(([Icon, label, value, tone]) => (
          <div key={label} className="surface-card flex items-center gap-2.5 p-3 sm:gap-3 sm:p-4">
            <Icon className={`size-6 shrink-0 sm:size-8 ${tone}`} aria-hidden />
            <div className="min-w-0">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="text-base font-bold break-words tabular-nums sm:text-lg">{value}</dd>
            </div>
          </div>
        ))}
      </dl>

      <section className={`surface-card flex flex-col gap-2 p-5 text-sm ${configured ? "border-success/40" : "border-warning/50"}`}>
        <p className="flex items-center gap-2 font-semibold">
          {configured ? <CircleCheck className="size-4 text-success-strong" aria-hidden /> : <CircleAlert className="size-4 text-warning-strong" aria-hidden />}
          DOKU {configured ? `terhubung — mode ${production ? "PRODUKSI" : "Sandbox (uji coba)"}` : "belum dikonfigurasi"}
        </p>
        {!configured && <p className="text-muted-foreground">Isi env DOKU_CLIENT_ID, DOKU_SECRET_KEY (dan DOKU_IS_PRODUCTION) di hPanel, lalu redeploy.</p>}
        {configured && (
          <dl className="grid gap-x-4 gap-y-1 text-muted-foreground sm:grid-cols-[auto_1fr]">
            <dt>Alamat API</dt>
            <dd>
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">{info.apiBase}</code>{" "}
              {production ? "(Production — pakai key dari Back Office Production)" : "(Sandbox — pakai key dari Back Office Sandbox)"}
            </dd>
            <dt>Client ID</dt>
            <dd>
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">{info.clientIdMasked}</code>
            </dd>
            <dt>Secret Key</dt>
            <dd>{info.secretKeyLength ? `terisi (${info.secretKeyLength} karakter)` : "kosong"}</dd>
            <dt>Metode bayar</dt>
            <dd>
              {info.paymentMethods.length ? info.paymentMethods.join(", ") : "Semua channel yang aktif di akun DOKU"}{" "}
              <span className="text-xs">(env DOKU_PAYMENT_METHODS; harus aktif di DOKU Back Office)</span>
            </dd>
          </dl>
        )}
        {configured && <DokuConnectionTest />}
        <p className="text-muted-foreground">
          Notification URL (pasang di DOKU Back Office → Settings → Payment Settings):{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">{SITE_URL.replace(/\/$/, "")}{DOKU_NOTIFICATION_PATH}</code>
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <CreditCard className="size-5 text-primary" aria-hidden /> Paket langganan
        </h2>
        <div className="flex flex-col gap-3">
          <h3 className="flex items-center gap-2 text-sm font-bold text-success-strong">
            <span className="size-2 rounded-full bg-success" aria-hidden /> Sedang dijual ({active.length})
          </h3>
          {active.length === 0 ? (
            <p className="surface-card px-6 py-6 text-center text-sm text-muted-foreground">Belum ada paket yang dijual — siswa belum bisa membeli Premium.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {active.map((p) => (
                <PlanCard key={p.id} plan={p} />
              ))}
            </div>
          )}
        </div>
        {inactive.length > 0 && (
          <div className="flex flex-col gap-3">
            <h3 className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
              <span className="size-2 rounded-full bg-muted-foreground/50" aria-hidden /> Tidak dijual ({inactive.length})
            </h3>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {inactive.map((p) => (
                <PlanCard key={p.id} plan={p} />
              ))}
            </div>
          </div>
        )}
        <NewPlanPanel />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Crown className="size-5 text-cta" aria-hidden /> Anggota Premium aktif ({members.length})
        </h2>
        <div className="surface-card flex flex-col gap-4 p-4">
          <GrantMembershipForm />
          {members.length > 0 && (
            <ul className="divide-y border-t text-sm">
              {members.map(({ m, userName, userEmail }) => (
                <li key={m.id} className="flex flex-wrap items-center gap-3 py-2.5">
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold">{userName}</span> <span className="text-xs text-muted-foreground">{userEmail}</span>
                  </span>
                  <Badge variant="info">{m.jenjang ?? "Semua"}</Badge>
                  <Badge variant={m.grantedBy === "purchase" ? "success" : "muted"}>{m.grantedBy === "purchase" ? "Bayar" : "Manual"}</Badge>
                  <span className="text-xs text-muted-foreground">{m.endsAt ? `s.d. ${formatDate(m.endsAt.toISOString())}` : "Selamanya"}</span>
                  <RevokeMembershipButton id={m.id} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Receipt className="size-5 text-primary" aria-hidden /> Transaksi terbaru
        </h2>
        {orders.length === 0 ? (
          <p className="surface-card px-6 py-8 text-center text-sm text-muted-foreground">Belum ada transaksi.</p>
        ) : (
          <ul className="surface-card divide-y text-sm">
            {orders.map(({ order: o, userName, userEmail }) => {
              const meta = ORDER_STATUS_META[o.status];
              return (
                <li key={o.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold">{userName}</span> <span className="text-xs text-muted-foreground">{userEmail}</span>
                    <span className="block text-xs text-muted-foreground">
                      {o.planName} · {o.orderCode} · {formatDateTime(o.createdAt.toISOString())}
                      {o.paymentType && ` · ${o.paymentType}`}
                    </span>
                  </span>
                  <span className="font-semibold tabular-nums">{formatRupiah(o.amount)}</span>
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                  {o.status === "pending" && configured && <SyncOrderButton orderCode={o.orderCode} label="Cek" />}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
