"use client";

import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, HandCoins, Search } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate, formatRupiah } from "@/lib/format";
import { recordPayoutAction, setCommissionPercentAction } from "@/server/actions/referrals";
import type { AdminReferrerRow } from "@/server/services/referrals";

export function ReferrersTable({ rows }: { rows: AdminReferrerRow[] }) {
  const [q, setQ] = useState("");
  const [onlyPending, setOnlyPending] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const needle = q.trim().toLowerCase();
  const visible = rows.filter(
    (r) =>
      (!onlyPending || r.pending > 0) &&
      (!needle || [r.name, r.contact, r.code ?? "", r.phone ?? ""].some((v) => v.toLowerCase().includes(needle))),
  );

  return (
    <section className="surface-card flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-bold">Pemberi referal</h2>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={onlyPending} onChange={(e) => setOnlyPending(e.target.checked)} className="size-4 accent-primary" />
            Hanya yang belum dibayar
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama, kode, kontak…" className="w-64 pl-9" aria-label="Cari pemberi referal" />
          </div>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">{rows.length === 0 ? "Belum ada user yang memakai kode referal." : "Tidak ada yang cocok."}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="w-8 py-2" />
                <th className="py-2 pr-3">Pemilik kode</th>
                <th className="py-2 pr-3">Kode</th>
                <th className="py-2 pr-3 text-right">Pendaftar</th>
                <th className="py-2 pr-3 text-right">Pembeli</th>
                <th className="py-2 pr-3 text-right">Belum dibayar</th>
                <th className="py-2 pr-3 text-right">Sudah dibayar</th>
                <th className="py-2 pr-3">Rekening</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => {
                const expanded = open === r.userId;
                return (
                  <Fragment key={r.userId}>
                    <tr className="border-b align-top">
                      <td className="py-3">
                        <button type="button" onClick={() => setOpen(expanded ? null : r.userId)} aria-label={expanded ? "Tutup rincian" : "Lihat rincian"} aria-expanded={expanded} className="rounded p-0.5 text-muted-foreground hover:bg-muted">
                          {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                        </button>
                      </td>
                      <td className="py-3 pr-3">
                        <p className="font-semibold">{r.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.contact}
                          {r.phone ? ` · ${r.phone}` : ""}
                        </p>
                      </td>
                      <td className="py-3 pr-3 font-mono">{r.code ?? "—"}</td>
                      <td className="py-3 pr-3 text-right font-semibold">{r.referred}</td>
                      <td className="py-3 pr-3 text-right">{r.buyers}</td>
                      <td className={`py-3 pr-3 text-right font-semibold ${r.pending > 0 ? "text-warning-strong" : "text-muted-foreground"}`}>{formatRupiah(r.pending)}</td>
                      <td className="py-3 pr-3 text-right text-muted-foreground">{formatRupiah(r.paid)}</td>
                      <td className="py-3 pr-3 text-xs">
                        {r.account ? (
                          <>
                            <p className="font-semibold">{r.account.bankName}</p>
                            <p className="font-mono">{r.account.accountNumber}</p>
                            <p className="text-muted-foreground">a.n. {r.account.accountName}</p>
                          </>
                        ) : (
                          <Badge variant="muted">Belum diisi</Badge>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <PayoutDialog row={r} />
                      </td>
                    </tr>
                    {expanded && (
                      <tr className="border-b bg-muted/30">
                        <td />
                        <td colSpan={8} className="py-3 pr-3">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Pendaftar ({r.referredUsers.length})</p>
                              <ul className="max-h-64 divide-y overflow-y-auto">
                                {r.referredUsers.map((u, i) => (
                                  <li key={i} className="flex items-center justify-between gap-2 py-1.5">
                                    <span>
                                      {u.name} <span className="text-xs text-muted-foreground">· {u.contact} · {formatDate(u.joinedAt)}</span>
                                    </span>
                                    <Badge variant={u.bought ? "success" : "muted"}>{u.bought ? "Membeli" : "Belum"}</Badge>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Komisi ({r.commissions.length})</p>
                              {r.commissions.length === 0 ? (
                                <p className="text-muted-foreground">Belum ada pembayaran.</p>
                              ) : (
                                <ul className="max-h-64 divide-y overflow-y-auto">
                                  {r.commissions.map((c, i) => (
                                    <li key={i} className="flex items-center justify-between gap-2 py-1.5">
                                      <span>
                                        {c.name} <span className="text-xs text-muted-foreground">· {formatDate(c.createdAt)} · bayar {formatRupiah(c.orderAmount)}</span>
                                      </span>
                                      <span className="flex items-center gap-2">
                                        <span className="font-semibold">{formatRupiah(c.amount)}</span>
                                        <Badge variant={c.status === "paid" ? "success" : c.status === "pending" ? "warning" : "muted"}>
                                          {c.status === "paid" ? "Dibayar" : c.status === "pending" ? "Pending" : "Batal"}
                                        </Badge>
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/** Konfirmasi: admin sudah mentransfer seluruh komisi pending → tandai dibayar. */
function PayoutDialog({ row }: { row: AdminReferrerRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  if (row.pending <= 0) return <span className="text-xs text-muted-foreground">Lunas</span>;

  return (
    <>
      <Button size="xs" onClick={() => setOpen(true)}>
        <HandCoins aria-hidden /> Catat pembayaran
      </Button>
      <AlertDialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (o) {
            setNote("");
            setError(null);
          }
        }}
      >
        <AlertDialogContent className="data-[size=default]:max-w-md data-[size=default]:sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">Catat transfer komisi</AlertDialogTitle>
            <AlertDialogDescription>
              Transfer dulu secara manual, lalu catat di sini. Semua komisi yang belum dibayar milik {row.name} akan ditandai sudah ditransfer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-3 text-sm">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">Nominal transfer</p>
              <p className="text-2xl font-bold">{formatRupiah(row.pending)}</p>
              {row.account ? (
                <p className="mt-1">
                  ke <b>{row.account.bankName}</b> <span className="font-mono">{row.account.accountNumber}</span> a.n. {row.account.accountName}
                </p>
              ) : (
                <p className="mt-1 text-warning-strong">Rekening belum diisi — hubungi {row.phone ?? row.contact} untuk menanyakan tujuan transfer.</p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`note-${row.userId}`}>Catatan (opsional)</Label>
              <Input id={`note-${row.userId}`} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="No. referensi transfer, tanggal, dll." />
            </div>
            {error && <p className="text-destructive">{error}</p>}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <Button
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const r = await recordPayoutAction({ referrerId: row.userId, note });
                  if (!r.ok) return setError(r.error);
                  setOpen(false);
                  router.refresh();
                })
              }
            >
              {pending ? "Menyimpan…" : "Sudah ditransfer"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function CommissionPercentForm({ percent }: { percent: number }) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const v = new FormData(e.currentTarget).get("percent");
        startTransition(async () => {
          const r = await setCommissionPercentAction(v);
          setMsg(r.ok ? { ok: true, text: r.message ?? "Tersimpan." } : { ok: false, text: r.error });
          if (r.ok) router.refresh();
        });
      }}
    >
      <div className="grid gap-1.5">
        <Label htmlFor="percent">Persen komisi</Label>
        <div className="flex items-center gap-2">
          <Input id="percent" name="percent" type="number" min={0} max={50} defaultValue={percent} className="w-24" required />
          <span className="text-sm text-muted-foreground">%</span>
        </div>
      </div>
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "Menyimpan…" : "Simpan"}
      </Button>
      {msg && <p className={`text-sm ${msg.ok ? "text-success-strong" : "text-destructive"}`}>{msg.text}</p>}
    </form>
  );
}
