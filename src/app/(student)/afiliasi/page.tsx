import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { BadgeCheck, Clock, Hourglass, ShoppingBag, Users } from "lucide-react";
import { StatCard } from "@/components/layout/stat-card";
import { AffiliateShare, PayoutAccountForm } from "@/components/student/referral-panels";
import { Badge } from "@/components/ui/badge";
import { COMMISSION_HOLD_DAYS, MIN_PAYOUT, studentShareMessage } from "@/lib/affiliate";
import { formatDate, formatRupiah } from "@/lib/format";
import { referralLink } from "@/lib/referral";
import { SITE_URL } from "@/lib/site";
import { requireUser } from "@/server/auth/session";
import { getAffiliateDashboard } from "@/server/services/affiliates";

export const metadata: Metadata = { title: "Afiliasi Guru" };
export const dynamic = "force-dynamic";

const STEPS = [
  ["Bagikan kode", "Kirim link, kode, atau QR ke grup kelas / orang tua siswa."],
  ["Siswa daftar", "Siswa memasukkan kode Anda saat daftar dan mendapat diskon pembelian pertama."],
  ["Komisi tercatat", "Begitu siswa membeli Premium pertama kali, komisi Anda tercatat di sini."],
  ["Ditransfer admin", "Setelah masa tahan, admin mentransfer komisi ke rekening Anda."],
] as const;

export default async function AfiliasiPage() {
  const { user } = await requireUser("/afiliasi");
  const d = await getAffiliateDashboard(Number(user.id));
  if (!d) notFound();
  const link = referralLink(SITE_URL, d.code);
  const qrPng = await QRCode.toDataURL(link, { width: 480, margin: 1 });
  const status = (c: (typeof d.commissions)[number]) => {
    if (c.status === "paid") return { label: "Sudah ditransfer", variant: "success" as const };
    if (c.status === "void") return { label: "Batal (refund)", variant: "muted" as const };
    if (c.availableAt && new Date(c.availableAt) > new Date()) return { label: `Siap cair ${formatDate(c.availableAt)}`, variant: "info" as const };
    return { label: "Siap cair", variant: "warning" as const };
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-[1.75rem]">Afiliasi Guru</h1>
        <p className="mt-1 text-muted-foreground">
          Komisi {d.percent}% dari pembelian Premium pertama setiap siswa yang mendaftar dengan kode Anda
          {d.discount > 0 && <> — siswa mendapat diskon {d.discount}%</>}. Anda juga mendapat Premium gratis semua jenjang.
        </p>
      </header>

      {d.status !== "active" && (
        <p className="rounded-xl border border-warning/50 bg-warning-soft px-4 py-3 text-sm text-warning-strong">
          Afiliasi Anda sedang <strong>nonaktif</strong>: kode tidak bisa dipakai siswa baru. Komisi yang sudah tercatat tetap dibayar. Hubungi admin bila
          ada pertanyaan.
        </p>
      )}

      <section className="surface-card flex flex-col gap-5 p-5">
        <AffiliateShare code={d.code} link={link} waText={studentShareMessage(d.code, link, d.discount)} qrPng={qrPng} />
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Siswa mendaftar" value={String(d.stats.referred)} icon={Users} hint="Memakai kode Anda" />
        <StatCard label="Siswa membeli" value={String(d.stats.buyers)} icon={ShoppingBag} tone="success" />
        <StatCard label="Siap cair" value={formatRupiah(d.stats.available)} icon={Clock} tone="cta" hint={`Ditransfer bila ≥ ${formatRupiah(MIN_PAYOUT)}`} />
        <StatCard label="Masa tahan" value={formatRupiah(d.stats.held)} icon={Hourglass} tone="muted" hint={`${COMMISSION_HOLD_DAYS} hari setelah siswa bayar`} />
        <StatCard label="Sudah ditransfer" value={formatRupiah(d.stats.paid)} icon={BadgeCheck} tone="muted" />
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
            <p className="text-sm text-muted-foreground">Belum ada komisi. Komisi muncul begitu siswa Anda membeli Premium pertama kali.</p>
          ) : (
            <ul className="divide-y text-sm">
              {d.commissions.map((c) => {
                const st = status(c);
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
          <h2 className="font-bold">Siswa yang mendaftar</h2>
          {d.referred.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada siswa yang mendaftar dengan kode Anda.</p>
          ) : (
            <ul className="divide-y text-sm">
              {d.referred.map((r, i) => (
                <li key={i} className="flex items-center justify-between gap-3 py-2.5">
                  <div>
                    <p className="font-medium">{r.name}</p>
                    <p className="text-xs text-muted-foreground">Daftar {formatDate(r.joinedAt)}</p>
                  </div>
                  <Badge variant={r.bought ? "success" : "muted"}>{r.bought ? "Membeli" : "Belum membeli"}</Badge>
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
        Komisi dihitung dari nominal yang benar-benar dibayar siswa (setelah diskon), dibulatkan ke bawah, dan hanya untuk pembelian Premium pertama —
        perpanjangan tidak berkomisi. Komisi bisa dicairkan {COMMISSION_HOLD_DAYS} hari setelah pembayaran dan batal bila pembayaran dikembalikan. Nama
        siswa disamarkan untuk melindungi data pribadi mereka.
      </p>
    </div>
  );
}
