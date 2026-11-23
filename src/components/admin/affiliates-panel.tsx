"use client";

import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, HandCoins, MessageCircle, Search, UserPlus } from "lucide-react";
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
import { inviteMessage, MIN_PAYOUT } from "@/lib/affiliate";
import { formatDate, formatRupiah } from "@/lib/format";
import {
  addAffiliateAction,
  deleteAffiliateInviteAction,
  setAffiliateCodeAction,
  setAffiliateSettingsAction,
  setAffiliateStatusAction,
  updateAffiliateAction,
} from "@/server/actions/affiliates";
import { recordPayoutAction } from "@/server/actions/referrals";
import type { AdminAffiliateRow } from "@/server/services/affiliates";

type Msg = { ok: boolean; text: string } | null;
type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

const STATUS = {
  invited: { label: "Diundang", variant: "info" },
  active: { label: "Aktif", variant: "success" },
  suspended: { label: "Nonaktif", variant: "muted" },
} as const;

function useAction() {
  const router = useRouter();
  const [msg, setMsg] = useState<Msg>(null);
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<ActionResult>, after?: () => void) =>
    start(async () => {
      const r = await fn();
      setMsg(r.ok ? { ok: true, text: r.message ?? "Tersimpan." } : { ok: false, text: r.error });
      if (r.ok) {
        after?.();
        router.refresh();
      }
    });
  return { msg, pending, run };
}

function MsgLine({ msg }: { msg: Msg }) {
  return msg ? <p className={`text-sm ${msg.ok ? "text-success-strong" : "text-destructive"}`}>{msg.text}</p> : null;
}

/** Form tambah guru lewat email. */
export function AddAffiliateForm({ defaultPercent }: { defaultPercent: number }) {
  const { msg, pending, run } = useAction();
  return (
    <form
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const f = new FormData(form);
        const percent = String(f.get("commissionPercent") ?? "").trim();
        run(
          () =>
            addAffiliateAction({
              email: String(f.get("email") ?? ""),
              name: String(f.get("name") ?? ""),
              school: String(f.get("school") ?? ""),
              phone: String(f.get("phone") ?? ""),
              commissionPercent: percent === "" ? null : percent,
              note: String(f.get("note") ?? ""),
            }),
          () => form.reset(),
        );
      }}
    >
      <div className="grid gap-1.5">
        <Label htmlFor="aff-email">Email guru *</Label>
        <Input id="aff-email" name="email" type="email" required maxLength={255} placeholder="guru@sekolah.sch.id" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="aff-name">Nama *</Label>
        <Input id="aff-name" name="name" required maxLength={100} placeholder="Bu Siti Aminah" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="aff-school">Sekolah</Label>
        <Input id="aff-school" name="school" maxLength={150} placeholder="SMPN 3 Makassar" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="aff-phone">No. WhatsApp</Label>
        <Input id="aff-phone" name="phone" inputMode="tel" maxLength={20} placeholder="0812…" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="aff-percent">Komisi khusus (%)</Label>
        <Input id="aff-percent" name="commissionPercent" type="number" min={0} max={60} placeholder={`Kosong = ${defaultPercent}%`} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="aff-note">Catatan</Label>
        <Input id="aff-note" name="note" maxLength={500} placeholder="Opsional" />
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-3">
        <Button type="submit" disabled={pending}>
          <UserPlus aria-hidden /> {pending ? "Menyimpan…" : "Tambah guru"}
        </Button>
        <MsgLine msg={msg} />
      </div>
    </form>
  );
}

export function AffiliatesTable({ rows, defaultPercent, signupUrl }: { rows: AdminAffiliateRow[]; defaultPercent: number; signupUrl: string }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const needle = q.trim().toLowerCase();
  const visible = rows.filter((r) => !needle || [r.name, r.email, r.code ?? "", r.school ?? "", r.phone ?? ""].some((v) => v.toLowerCase().includes(needle)));

  return (
    <section className="surface-card flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-bold">Daftar guru afiliasi</h2>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama, email, kode, sekolah…" className="w-64 pl-9" aria-label="Cari guru" />
        </div>
      </div>
      {visible.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">{rows.length === 0 ? "Belum ada guru afiliasi. Tambahkan lewat form di atas." : "Tidak ada yang cocok."}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="w-8 py-2" />
                <th className="py-2 pr-3">Guru</th>
                <th className="py-2 pr-3">Kode</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3 text-right">Siswa</th>
                <th className="py-2 pr-3 text-right">Membeli</th>
                <th className="py-2 pr-3 text-right">Siap cair</th>
                <th className="py-2 pr-3 text-right">Ditahan</th>
                <th className="py-2 pr-3 text-right">Dibayar</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => {
                const expanded = open === r.id;
                const st = STATUS[r.status];
                return (
                  <Fragment key={r.id}>
                    <tr className="border-b align-top">
                      <td className="py-2.5">
                        <button type="button" onClick={() => setOpen(expanded ? null : r.id)} aria-expanded={expanded} aria-label={`Detail ${r.name}`} className="rounded p-1 hover:bg-muted">
                          {expanded ? <ChevronDown className="size-4" aria-hidden /> : <ChevronRight className="size-4" aria-hidden />}
                        </button>
                      </td>
                      <td className="py-2.5 pr-3">
                        <p className="font-semibold">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.email}</p>
                        {r.school && <p className="text-xs text-muted-foreground">{r.school}</p>}
                      </td>
                      <td className="py-2.5 pr-3 font-mono">{r.code ?? "—"}</td>
                      <td className="py-2.5 pr-3">
                        <Badge variant={st.variant}>{st.label}</Badge>
                        <p className="mt-1 text-xs text-muted-foreground">Komisi {r.commissionPercent ?? defaultPercent}%</p>
                      </td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">{r.referred}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">{r.buyers}</td>
                      <td className="py-2.5 pr-3 text-right font-semibold tabular-nums">{formatRupiah(r.available)}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums text-muted-foreground">{formatRupiah(r.held)}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums text-muted-foreground">{formatRupiah(r.paid)}</td>
                      <td className="py-2.5 text-right">{r.userId && <PayoutDialog row={r} />}</td>
                    </tr>
                    {expanded && (
                      <tr className="border-b bg-muted/30">
                        <td />
                        <td colSpan={9} className="py-4 pr-3">
                          <AffiliateDetail row={r} signupUrl={signupUrl} />
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

function AffiliateDetail({ row, signupUrl }: { row: AdminAffiliateRow; signupUrl: string }) {
  const status = useAction();
  const code = useAction();
  const edit = useAction();
  const waPhone = row.phone?.replace(/^0/, "62").replace(/\D/g, "");
  const invite = inviteMessage(row.name, signupUrl, row.email);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {row.status === "invited" && (
            <>
              <Button
                size="sm"
                nativeButton={false}
                render={<a href={`https://wa.me/${waPhone ?? ""}?text=${encodeURIComponent(invite)}`} target="_blank" rel="noopener noreferrer" />}
              >
                <MessageCircle aria-hidden /> Kirim undangan WA
              </Button>
              <Button size="sm" variant="outline" disabled={status.pending} onClick={() => status.run(() => deleteAffiliateInviteAction(row.id))}>
                Hapus undangan
              </Button>
            </>
          )}
          {row.status === "active" && (
            <Button size="sm" variant="outline" disabled={status.pending} onClick={() => status.run(() => setAffiliateStatusAction({ id: row.id, status: "suspended" }))}>
              Nonaktifkan
            </Button>
          )}
          {row.status === "suspended" && (
            <Button size="sm" disabled={status.pending} onClick={() => status.run(() => setAffiliateStatusAction({ id: row.id, status: "active" }))}>
              Aktifkan lagi
            </Button>
          )}
          <MsgLine msg={status.msg} />
        </div>

        {row.userId && (
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const v = String(new FormData(e.currentTarget).get("code") ?? "");
              code.run(() => setAffiliateCodeAction({ id: row.id, code: v }));
            }}
          >
            <div className="grid gap-1.5">
              <Label htmlFor={`code-${row.id}`}>Kode khusus</Label>
              <Input id={`code-${row.id}`} name="code" defaultValue={row.code ?? ""} maxLength={12} className="w-40 font-mono uppercase" required />
            </div>
            <Button type="submit" size="sm" variant="outline" disabled={code.pending}>
              Simpan kode
            </Button>
            <MsgLine msg={code.msg} />
          </form>
        )}

        <form
          className="grid gap-2 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            edit.run(() =>
              updateAffiliateAction({
                id: row.id,
                commissionPercent: String(f.get("commissionPercent") ?? "").trim(),
                school: String(f.get("school") ?? ""),
                phone: String(f.get("phone") ?? ""),
                note: String(f.get("note") ?? ""),
              }),
            );
          }}
        >
          <div className="grid gap-1.5">
            <Label htmlFor={`pct-${row.id}`}>Komisi khusus (%)</Label>
            <Input id={`pct-${row.id}`} name="commissionPercent" type="number" min={0} max={60} defaultValue={row.commissionPercent ?? ""} placeholder="Default" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`phone-${row.id}`}>No. WhatsApp</Label>
            <Input id={`phone-${row.id}`} name="phone" defaultValue={row.phone ?? ""} maxLength={20} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`school-${row.id}`}>Sekolah</Label>
            <Input id={`school-${row.id}`} name="school" defaultValue={row.school ?? ""} maxLength={150} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`note-${row.id}`}>Catatan</Label>
            <Input id={`note-${row.id}`} name="note" defaultValue={row.note ?? ""} maxLength={500} />
          </div>
          <div className="flex items-center gap-3 sm:col-span-2">
            <Button type="submit" size="sm" variant="outline" disabled={edit.pending}>
              Simpan data
            </Button>
            <MsgLine msg={edit.msg} />
          </div>
        </form>

        <p className="text-xs text-muted-foreground">
          Ditambahkan {formatDate(row.createdAt)}
          {row.activatedAt && ` · aktif sejak ${formatDate(row.activatedAt)}`}
          {row.account ? ` · Rekening: ${row.account.bankName} ${row.account.accountNumber} a.n. ${row.account.accountName}` : " · Rekening belum diisi"}
        </p>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Siswa ({row.students.length})</p>
        {row.students.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada siswa yang memakai kode ini.</p>
        ) : (
          <ul className="max-h-72 divide-y overflow-y-auto rounded-lg border bg-card text-sm">
            {row.students.map((s, i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate font-medium">{s.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {s.contact} · daftar {formatDate(s.joinedAt)}
                  </p>
                </div>
                <Badge variant={s.bought ? "success" : "muted"}>{s.bought ? "Membeli" : "Belum"}</Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** Admin sudah mentransfer komisi siap cair → tandai dibayar. Minimal Rp50.000. */
function PayoutDialog({ row }: { row: AdminAffiliateRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  if (row.available < MIN_PAYOUT) {
    return <span className="text-xs text-muted-foreground">{row.available > 0 ? `< ${formatRupiah(MIN_PAYOUT)}` : "—"}</span>;
  }
  return (
    <>
      <Button size="xs" onClick={() => setOpen(true)}>
        <HandCoins aria-hidden /> Catat transfer
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
              Transfer dulu secara manual, lalu catat di sini. Semua komisi siap cair milik {row.name} ditandai sudah ditransfer; komisi yang masih
              dalam masa tahan tidak ikut.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-3 text-sm">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">Nominal transfer</p>
              <p className="text-2xl font-bold">{formatRupiah(row.available)}</p>
              {row.account ? (
                <p className="mt-1">
                  ke <b>{row.account.bankName}</b> <span className="font-mono">{row.account.accountNumber}</span> a.n. {row.account.accountName}
                </p>
              ) : (
                <p className="mt-1 text-warning-strong">Rekening belum diisi — hubungi {row.phone ?? row.email} untuk menanyakan tujuan transfer.</p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`payout-note-${row.id}`}>Catatan (opsional)</Label>
              <Input id={`payout-note-${row.id}`} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="No. referensi transfer, dll." />
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

export function AffiliateSettingsForm({ percent, discount }: { percent: number; discount: number }) {
  const { msg, pending, run } = useAction();
  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        run(() => setAffiliateSettingsAction({ percent: f.get("percent"), discount: f.get("discount") }));
      }}
    >
      <div className="grid gap-1.5">
        <Label htmlFor="set-percent">Komisi guru (default)</Label>
        <div className="flex items-center gap-2">
          <Input id="set-percent" name="percent" type="number" min={0} max={60} defaultValue={percent} className="w-24" required />
          <span className="text-sm text-muted-foreground">%</span>
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="set-discount">Diskon siswa (pembelian pertama)</Label>
        <div className="flex items-center gap-2">
          <Input id="set-discount" name="discount" type="number" min={0} max={50} defaultValue={discount} className="w-24" required />
          <span className="text-sm text-muted-foreground">%</span>
        </div>
      </div>
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "Menyimpan…" : "Simpan"}
      </Button>
      <MsgLine msg={msg} />
    </form>
  );
}
