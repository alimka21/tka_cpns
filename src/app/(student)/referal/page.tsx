import type { Metadata } from "next";
import { BadgeCheck, Clock, ShoppingBag, Users } from "lucide-react";
import { StatCard } from "@/components/layout/stat-card";
import { LateReferralForm, PayoutAccountForm, ReferralShare } from "@/components/student/referral-panels";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatRupiah } from "@/lib/format";
import { LATE_REFERRAL_DAYS, referralLink } from "@/lib/referral";
import { SITE_URL } from "@/lib/site";
import { requireUser } from "@/server/auth/session";
import { getReferralDashboard } from "@/server/services/referrals";

export const metadata: Metadata = { title: "Referal" };
export const dynamic = "force-dynamic";

const COMMISSION_STATUS = {
  pending: { label: "Belum ditransfer", variant: "warning" },
  paid: { label: "Sudah ditransfer", variant: "success" },
  void: { label: "Batal (refund)", variant: "muted" },
} as const;

const STEPS = [
  ["Bagikan kode", "Kirim kode atau link daftar ke teman, adik kelas, atau murid."],
  ["Teman daftar", "Mereka memasukkan kodemu di kolom “Kode referal” saat daftar."],
  ["Dapat komisi", "Setiap kali mereka membayar Premium, komisimu tercatat di sini."],
  ["Ditransfer admin", "Admin mentransfer komisi ke rekening/e-wallet yang kamu isi di bawah."],
] as const;

export default async function ReferalPage() {
  const { user } = await requireUser("/referal");
  const d = await getReferralDashboard(Number(user.id));

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-[1.75rem]">Referal</h1>
        <p className="mt-1 text-muted-foreground">
          Ajak teman belajar di Pakar TKA dan dapatkan komisi {d.percent}% dari setiap pembayaran Premium mereka.
        </p>
      </header>

      <section className="surface-card flex flex-col gap-5 p-5">
        <ReferralShare code={d.code} link={referralLink(SITE_URL, d.code)} percent={d.percent} />
        <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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

      {d.canEnterCode && <LateReferralForm days={LATE_REFERRAL_DAYS} />}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Teman mendaftar" value={String(d.stats.referred)} icon={Users} hint="Memakai kode referal kamu" />
        <StatCard label="Teman membeli Premium" value={String(d.stats.buyers)} icon={ShoppingBag} tone="success" />
        <StatCard label="Komisi belum ditransfer" value={formatRupiah(d.stats.pending)} icon={Clock} tone="cta" hint="Menunggu transfer admin" />
        <StatCard label="Komisi sudah ditransfer" value={formatRupiah(d.stats.paid)} icon={BadgeCheck} tone="muted" />
      </div>

      <section className="surface-card flex flex-col gap-3 p-5">
        <div>
          <h2 className="font-bold">Rekening penerima komisi</h2>
          <p className="text-sm text-muted-foreground">Pastikan benar — admin mentransfer komisi secara manual ke rekening ini.</p>
        </div>
        <PayoutAccountForm account={d.account} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface-card flex flex-col gap-3 p-5">
          <h2 className="font-bold">Riwayat komisi</h2>
          {d.commissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada komisi. Komisi muncul begitu teman yang kamu ajak membayar Premium.</p>
          ) : (
            <ul className="divide-y text-sm">
              {d.commissions.map((c) => {
                const st = COMMISSION_STATUS[c.status];
                return (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(c.createdAt)} · {c.percent}% × {formatRupiah(c.orderAmount)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-semibold">{formatRupiah(c.amount)}</span>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="surface-card flex flex-col gap-3 p-5">
          <h2 className="font-bold">Teman yang mendaftar</h2>
          {d.referred.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada teman yang mendaftar dengan kodemu.</p>
          ) : (
            <ul className="divide-y text-sm">
              {d.referred.map((r, i) => (
                <li key={i} className="flex items-center justify-between gap-3 py-2.5">
                  <div>
                    <p className="font-medium">{r.name}</p>
                    <p className="text-xs text-muted-foreground">Daftar {formatDate(r.joinedAt)}</p>
                  </div>
                  <Badge variant={r.bought ? "success" : "muted"}>{r.bought ? "Premium" : "Gratis"}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {d.payouts.length > 0 && (
        <section className="surface-card flex flex-col gap-3 p-5">
          <h2 className="font-bold">Transfer dari admin</h2>
          <ul className="divide-y text-sm">
            {d.payouts.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                <div>
                  <p className="font-medium">{formatDate(p.createdAt)}</p>
                  {p.note && <p className="text-xs text-muted-foreground">{p.note}</p>}
                </div>
                <span className="font-semibold text-success-strong">{formatRupiah(p.amount)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-xs text-muted-foreground">
        Komisi dihitung dari nominal yang benar-benar dibayar teman (termasuk perpanjangan), dibulatkan ke bawah. Komisi batal bila pembayaran
        dikembalikan. Kode sendiri tidak bisa dipakai untuk akun sendiri.
      </p>
    </div>
  );
}
