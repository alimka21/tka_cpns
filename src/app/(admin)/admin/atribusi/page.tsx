import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Megaphone, UserPlus, Wallet } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { defaultRange, parseModel, parseRange } from "@/lib/attribution-report";
import { formatRupiah } from "@/lib/format";
import { requireAdmin } from "@/server/auth/session";
import { attributionReport } from "@/server/queries/attribution";

export const metadata: Metadata = { title: "Atribusi Kampanye" };
export const dynamic = "force-dynamic";

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;
const th = "px-4 py-3";
const td = "px-4 py-3 tabular-nums";

export default async function AdminAtribusiPage({ searchParams }: PageProps<"/admin/atribusi">) {
  await requireAdmin("/admin/atribusi");
  const params = await searchParams;
  const model = parseModel(one(params.model));
  const parsed = parseRange(one(params.dari), one(params.sampai));
  // Input tidak valid → tampilkan pesan dan pakai rentang default (30 hari terakhir).
  const range = parsed.ok ? parsed.range : defaultRange();
  const report = await attributionReport(range, model);
  const { totals } = report;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Atribusi Kampanye"
        description="Asal pendaftar (utm_* dari link Instagram/TikTok) dan berapa yang membeli Premium. Pendaftar dihitung berdasarkan tanggal daftar (WIB); pembelian dihitung kapan pun dibayar."
      />

      <form method="get" className="surface-card flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Dari
          <input type="date" name="dari" defaultValue={range.from} className="h-10 rounded-lg border border-input bg-card px-3 text-sm font-normal" />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Sampai
          <input type="date" name="sampai" defaultValue={range.to} className="h-10 rounded-lg border border-input bg-card px-3 text-sm font-normal" />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Atribusi
          <select name="model" defaultValue={model} className="h-10 rounded-lg border border-input bg-card px-3 text-sm font-normal">
            <option value="first">Sentuhan pertama (first)</option>
            <option value="last">Sentuhan terakhir (last)</option>
          </select>
        </label>
        <Button type="submit" className="sm:w-fit">
          Terapkan
        </Button>
        <Link href="/admin/atribusi" className="text-sm font-semibold text-primary hover:underline sm:pb-2.5">
          Reset
        </Link>
      </form>
      {!parsed.ok && (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive-soft p-3 text-sm text-destructive">
          {parsed.error} Menampilkan 30 hari terakhir.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pendaftar" value={String(totals.signups)} icon={UserPlus} hint={`${range.from} s.d. ${range.to}`} />
        <StatCard
          label="Dengan UTM"
          value={String(totals.attributed)}
          icon={Megaphone}
          tone="muted"
          hint={totals.signups ? `${Math.round((totals.attributed / totals.signups) * 100)}% pendaftar` : undefined}
        />
        <StatCard label="Membeli Premium" value={String(totals.buyers)} icon={BadgeCheck} tone="success" hint={`${totals.conversion}% pendaftar`} />
        <StatCard label="Pendapatan" value={formatRupiah(totals.revenue)} icon={Wallet} tone="cta" hint="Order lunas milik pendaftar ini" />
      </div>

      <section aria-labelledby="kampanye-heading" className="flex flex-col gap-3">
        <h2 id="kampanye-heading" className="font-bold">
          Per kampanye (utm_campaign, {model === "first" ? "sentuhan pertama" : "sentuhan terakhir"})
        </h2>
        <div className="surface-card overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/50 text-left text-xs font-semibold text-muted-foreground uppercase">
              <tr>
                <th className={th}>Kampanye</th>
                <th className={`${th} text-right`}>Pendaftar</th>
                <th className={`${th} text-right`}>Premium</th>
                <th className={`${th} text-right`}>Pendapatan</th>
                <th className={`${th} text-right`}>Konversi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {report.campaigns.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    Belum ada pendaftar di rentang ini.
                  </td>
                </tr>
              )}
              {report.campaigns.map((r) => (
                <tr key={r.campaign ?? "(none)"} className="align-top hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <div className="font-semibold">{r.campaign ?? <span className="text-muted-foreground">(tanpa utm_campaign)</span>}</div>
                    {r.channels.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {r.channels.map((c) => (
                          <Badge key={c} variant="outline">
                            {c}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className={`${td} text-right`}>{r.signups}</td>
                  <td className={`${td} text-right`}>{r.buyers}</td>
                  <td className={`${td} text-right`}>{formatRupiah(r.revenue)}</td>
                  <td className={`${td} text-right font-semibold`}>{r.conversion}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="materi-heading" className="flex flex-col gap-3">
        <h2 id="materi-heading" className="font-bold">
          Per materi (lead magnet)
        </h2>
        <div className="surface-card overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/50 text-left text-xs font-semibold text-muted-foreground uppercase">
              <tr>
                <th className={th}>Materi</th>
                <th className={`${th} text-right`}>Unduhan</th>
                <th className={`${th} text-right`}>Oleh akun baru</th>
                <th className={`${th} text-right`}>Pendaftar dari halaman ini</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {report.leadMagnets.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                    Belum ada materi. Buat di <Link href="/admin/materi" className="font-semibold text-primary hover:underline">Materi (Lead Magnet)</Link>.
                  </td>
                </tr>
              )}
              {report.leadMagnets.map((r) => (
                <tr key={r.slug} className="align-top hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2 font-semibold">
                      {r.title} {!r.isActive && <Badge variant="muted">Nonaktif</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground">/materi/{r.slug}</div>
                  </td>
                  <td className={`${td} text-right`}>{r.downloads}</td>
                  <td className={`${td} text-right`}>{r.downloadsByNewUsers}</td>
                  <td className={`${td} text-right`}>{r.firstLandingSignups}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          &ldquo;Oleh akun baru&rdquo; = unduhan oleh akun yang dibuat ≤ 24 jam sebelum mengunduh. &ldquo;Pendaftar dari halaman ini&rdquo; = pendaftar di
          rentang ini yang pertama kali datang (dengan UTM) ke halaman materi tersebut.
        </p>
      </section>
    </div>
  );
}
