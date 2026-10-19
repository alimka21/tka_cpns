import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CircleAlert, CircleCheck, Clock, CreditCard, Users, Wallet, type LucideIcon } from "lucide-react";
import { NewPlanPanel, PlanCard, type PlanCardData } from "@/components/billing/plan-manager";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { promotedPlan } from "@/lib/plans";
import { formatRupiah } from "@/lib/format";
import { SITE_URL } from "@/lib/site";
import { listPlans, planSalesStats } from "@/server/services/billing";
import { DokuConnectionTest } from "@/components/billing/doku-connection-test";
import { DOKU_NOTIFICATION_PATH, dokuPublicInfo, isDokuConfigured, isDokuProduction } from "@/server/services/doku";
import { formatWaNumber } from "@/lib/manual-payment";
import { activeProvider, isManualFallbackEnabled, paymentMethodOptions, PROVIDER_LABEL } from "@/server/services/payment-provider";

export const metadata: Metadata = { title: "Langganan & Pembayaran" };
export const dynamic = "force-dynamic";

const NEW_DAYS = 7;

export default async function AdminLanggananPage() {
  const [plans, sales] = await Promise.all([listPlans({ activeOnly: false }), planSalesStats()]);
  const configured = isDokuConfigured();
  const production = isDokuProduction();
  const info = dokuPublicInfo();
  const provider = activeProvider();
  const site = SITE_URL.replace(/\/$/, "");
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
  const stats: [LucideIcon, string, string, string, string][] = [
    [Wallet, "Pendapatan lunas", formatRupiah(paidTotal), "text-success-strong", "/admin/transaksi?status=paid"],
    [Clock, "Pembayaran menunggu", String(pendingTotal), "text-warning-strong", "/admin/transaksi"],
    [Users, "Akun Premium & Gratis", "Kelola", "text-cta", "/admin/users?akses=premium"],
    [CreditCard, "Paket dijual", `${active.length} dari ${plans.length}`, "text-primary", "#paket-langganan"],
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Langganan & Pembayaran"
        description="Atur paket Premium yang dijual dan penyedia pembayaran. Verifikasi pembayaran ada di menu Transaksi; beri/cabut Premium per akun di Manajemen User."
      />

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(([Icon, label, value, tone, href]) => (
          <Link key={label} href={href} className="surface-card group flex items-center gap-2.5 p-3 transition-colors hover:border-primary/40 sm:gap-3 sm:p-4">
            <Icon className={`size-6 shrink-0 sm:size-8 ${tone}`} aria-hidden />
            <div className="min-w-0 flex-1">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="text-base font-bold break-words tabular-nums sm:text-lg">{value}</dd>
            </div>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
          </Link>
        ))}
      </dl>

      <p className="-mb-4 text-sm">
        Penyedia pembayaran aktif: <strong>{PROVIDER_LABEL[provider]}</strong>{" "}
        <span className="text-muted-foreground">
          (env PAYMENT_PROVIDER = doku / manual; kosong → DOKU bila mode Produksi, selain itu QRIS manual). Mode Sandbox: hanya admin & email di
          PAYMENT_TEST_EMAILS yang bisa membayar.
        </span>
      </p>
      {provider !== "doku" && provider !== "manual" && (
        <p className="rounded-lg border border-warning/50 bg-warning-soft px-4 py-3 text-sm text-warning-strong">
          Pembayaran saat ini memakai {PROVIDER_LABEL[provider]}. Untuk memakai DOKU, isi env <strong>PAYMENT_PROVIDER=doku</strong> di hPanel lalu
          redeploy.
        </p>
      )}

      {provider === "manual" && (
        <section className="surface-card flex flex-col gap-2 border-success/40 p-5 text-sm">
          <p className="flex flex-wrap items-center gap-2 font-semibold">
            <CircleCheck className="size-4 text-success-strong" aria-hidden /> QRIS manual (GoPay Merchant) + kode unik
            <Badge variant="success">Dipakai</Badge>
          </p>
          <p className="text-muted-foreground">
            Siswa transfer harga paket + kode unik 1–999, lalu mengirim bukti ke WhatsApp admin ({formatWaNumber()}). Cocokkan nominal persis di
            mutasi GoPay Merchant di menu{" "}
            <Link href="/admin/transaksi" className="font-semibold text-primary hover:underline">
              Transaksi
            </Link>
            , lalu tekan <strong>Konfirmasi lunas</strong> — Premium langsung aktif. Order menunggu lebih dari 3 hari otomatis kedaluwarsa.
          </p>
        </section>
      )}

      <section className={`surface-card flex flex-col gap-2 p-5 text-sm ${provider !== "doku" ? "opacity-80" : configured ? "border-success/40" : "border-warning/50"}`}>
        <p className="flex flex-wrap items-center gap-2 font-semibold">
          {configured ? <CircleCheck className="size-4 text-success-strong" aria-hidden /> : <CircleAlert className="size-4 text-warning-strong" aria-hidden />}
          DOKU {configured ? `terhubung — mode ${production ? "PRODUKSI" : "Sandbox (uji coba)"}` : "belum dikonfigurasi"}
          {provider === "doku" && <Badge variant="success">Dipakai</Badge>}
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
        {configured && (
          <p className="text-muted-foreground">
            Pilihan cara bayar untuk siswa:{" "}
            <strong className="text-foreground">
              {paymentMethodOptions("doku")
                .map((m) => `${m.label}${m.primary ? " (utama)" : ""}`)
                .join(" · ")}
            </strong>
            . Atur lewat env DOKU_PAYMENT_METHODS (kosong = QRIS + semua channel aktif di DOKU); QRIS manual sebagai cadangan: PAYMENT_MANUAL_FALLBACK=true
            ({isManualFallbackEnabled() ? "aktif" : "nonaktif"}).
          </p>
        )}
        {configured && <DokuConnectionTest />}
        <p className="text-muted-foreground">
          Notification URL (wajib: DOKU dashboard → Settings → Payment Settings → QR Payment & metode aktif lain → CONFIGURE):{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">{site}{DOKU_NOTIFICATION_PATH}</code>
        </p>
      </section>

      <section id="paket-langganan" className="flex scroll-mt-20 flex-col gap-4">
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
    </div>
  );
}
