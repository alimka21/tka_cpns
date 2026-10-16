"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronLeft, ChevronRight, MessageCircle, Search, ShieldCheck, XCircle } from "lucide-react";
import { SyncOrderButton } from "@/components/billing/sync-order-button";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDateTime, formatRupiah, ORDER_STATUS_META } from "@/lib/format";
import { formatPhone, visibleEmail, whatsappLink } from "@/lib/identity";
import { SITE_NAME } from "@/lib/site";
import { TRANSACTIONS_PAGE_SIZE, transactionsHref, type TransactionFilters, type TransactionTab } from "@/lib/transaction-filters";
import { cn } from "@/lib/utils";
import { settleManualOrderAction } from "@/server/actions/billing";
import type { AdminTransactionRow, AdminTransactionsPage } from "@/server/queries/transactions";

const TABS: { key: TransactionTab; label: string }[] = [
  { key: "pending", label: "Perlu verifikasi" },
  { key: "paid", label: "Lunas" },
  { key: "closed", label: "Kedaluwarsa / batal" },
  { key: "all", label: "Semua" },
];
const periodItems = { all: "Semua waktu", today: "Hari ini", "7d": "7 hari terakhir", "30d": "30 hari terakhir", month: "Bulan ini" };

/** Status singkat untuk tabel ("Menunggu pembayaran" terlalu panjang di kolom). */
const statusLabel = (s: AdminTransactionRow["status"]) => (s === "pending" ? "Menunggu" : ORDER_STATUS_META[s].label);

function ago(iso: string) {
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (min < 1) return "baru saja";
  if (min < 60) return `${min} menit lalu`;
  const h = Math.round(min / 60);
  return h < 24 ? `${h} jam lalu` : `${Math.round(h / 24)} hari lalu`;
}

const contactOf = (u: AdminTransactionRow["user"]) => visibleEmail(u.email) ?? (u.username ? `@${u.username}` : "");

/** Nominal dengan kode unik disorot: Rp27.0[23]. */
function Amount({ row, large }: { row: AdminTransactionRow; large?: boolean }) {
  const text = formatRupiah(row.amount);
  const digits = row.uniqueCode != null ? String(row.uniqueCode).length : 0;
  return (
    <span className={cn("font-bold whitespace-nowrap tabular-nums", large && "text-2xl")}>
      {digits ? text.slice(0, -digits) : text}
      {digits > 0 && <span className="rounded bg-cta/20 px-0.5 text-cta">{text.slice(-digits)}</span>}
    </span>
  );
}

/** Tabel transaksi — filter & paginasi di server lewat query string (lib/transaction-filters). */
export function TransactionsTable({ data, filters }: { data: AdminTransactionsPage; filters: TransactionFilters }) {
  const router = useRouter();
  const [navPending, startNav] = useTransition();
  const [query, setQuery] = useState(filters.q ?? "");
  const { rows, total, tabCounts } = data;
  const tab = filters.status ?? "pending";
  const page = filters.hal ?? 1;
  const pageCount = Math.max(1, Math.ceil(total / TRANSACTIONS_PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * TRANSACTIONS_PAGE_SIZE + 1;

  const go = (patch: Partial<Record<keyof TransactionFilters, string | number | undefined>>) =>
    startNav(() => router.replace(transactionsHref({ ...filters, hal: undefined, ...patch }), { scroll: false }));

  useEffect(() => {
    const q = query.trim();
    if (q === (filters.q ?? "")) return;
    const t = setTimeout(() => go({ q: q || undefined }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <section className={cn("surface-card overflow-hidden transition-opacity", navPending && "opacity-60")} aria-busy={navPending}>
      <nav aria-label="Status transaksi" className="flex gap-1 overflow-x-auto border-b px-4 pt-2 sm:px-5">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            aria-pressed={tab === t.key}
            onClick={() => go({ status: t.key === "pending" ? undefined : t.key })}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-semibold whitespace-nowrap",
              tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label} <span className="tabular-nums opacity-70">({tabCounts[t.key]})</span>
          </button>
        ))}
      </nav>
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:p-5">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nominal (mis. 27023), kode order, nama, sekolah, atau No. HP…"
            aria-label="Cari transaksi"
            maxLength={100}
            className="pl-10"
          />
        </div>
        <Select items={periodItems} value={filters.periode ?? "all"} onValueChange={(v) => go({ periode: v === "all" ? undefined : String(v) })}>
          <SelectTrigger className="w-full sm:w-44" aria-label="Filter periode">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(periodItems).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop: tabel */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs font-semibold text-muted-foreground uppercase">
            <tr>
              <th className="px-5 py-3">Waktu</th>
              <th className="px-5 py-3">Pelanggan</th>
              <th className="px-5 py-3">Paket</th>
              <th className="px-5 py-3 text-right">Nominal</th>
              <th className="px-5 py-3">Metode</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.id} className="align-top hover:bg-muted/40">
                <td className="px-5 py-3.5 whitespace-nowrap">
                  <div>{formatDateTime(row.createdAt)}</div>
                  <div className="text-xs text-muted-foreground">{row.status === "pending" ? ago(row.createdAt) : row.orderCode}</div>
                </td>
                <td className="px-5 py-3.5">
                  <Customer row={row} />
                </td>
                <td className="px-5 py-3.5">
                  <div className="font-medium">{row.planName}</div>
                  <div className="text-xs text-muted-foreground">
                    {row.jenjang ?? "Semua jenjang"} · {row.durationDays ? `${row.durationDays} hari` : "selamanya"}
                  </div>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <Amount row={row} />
                  {row.uniqueCode != null && <div className="text-xs text-muted-foreground">kode unik {row.uniqueCode}</div>}
                </td>
                <td className="px-5 py-3.5 whitespace-nowrap text-muted-foreground">{row.providerLabel}</td>
                <td className="px-5 py-3.5">
                  <Badge variant={ORDER_STATUS_META[row.status].variant}>{statusLabel(row.status)}</Badge>
                  {row.paidAt && <div className="mt-1 text-xs text-muted-foreground">{formatDateTime(row.paidAt)}</div>}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <RowActions row={row} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile & tablet: kartu */}
      <ul className="divide-y lg:hidden">
        {rows.map((row) => (
          <li key={row.id} className="flex flex-col gap-3 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <Customer row={row} />
              <Badge variant={ORDER_STATUS_META[row.status].variant}>{statusLabel(row.status)}</Badge>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="text-sm">
                <Amount row={row} large />
                <div className="text-xs text-muted-foreground">
                  {row.planName} · {row.providerLabel} · {row.status === "pending" ? ago(row.createdAt) : formatDateTime(row.createdAt)}
                </div>
              </div>
              <RowActions row={row} />
            </div>
          </li>
        ))}
      </ul>

      {rows.length === 0 && (
        <p className="px-5 py-12 text-center text-sm text-muted-foreground">
          {tab === "pending" && !filters.q ? "Tidak ada pembayaran yang perlu diverifikasi." : "Tidak ada transaksi yang cocok dengan filter."}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t px-5 py-3 text-xs text-muted-foreground">
        <span>
          Menampilkan {from}–{from === 0 ? 0 : from + rows.length - 1} dari {total} transaksi
        </span>
        {pageCount > 1 && (
          <span className="flex items-center gap-2">
            <Button variant="outline" size="xs" disabled={page <= 1 || navPending} onClick={() => go({ hal: page - 1 > 1 ? page - 1 : undefined })}>
              <ChevronLeft aria-hidden /> Sebelumnya
            </Button>
            <span className="tabular-nums">
              Hal. {page} / {pageCount}
            </span>
            <Button variant="outline" size="xs" disabled={page >= pageCount || navPending} onClick={() => go({ hal: page + 1 })}>
              Berikutnya <ChevronRight aria-hidden />
            </Button>
          </span>
        )}
      </div>
    </section>
  );
}

function Customer({ row }: { row: AdminTransactionRow }) {
  const u = row.user;
  return (
    <div className="min-w-0">
      <div className="truncate font-semibold">{u.name}</div>
      <div className="truncate text-xs text-muted-foreground">{[contactOf(u), u.phone && formatPhone(u.phone)].filter(Boolean).join(" · ")}</div>
      {(u.schoolName || u.province) && <div className="truncate text-xs text-muted-foreground">{[u.schoolName, u.province].filter(Boolean).join(" · ")}</div>}
    </div>
  );
}

function RowActions({ row }: { row: AdminTransactionRow }) {
  const canVerify = row.provider === "manual" && (row.status === "pending" || row.status === "expired");
  return (
    <span className="inline-flex flex-wrap items-center justify-end gap-1.5">
      {canVerify && <VerifyDialog row={row} />}
      {row.provider !== "manual" && row.status === "pending" && <SyncOrderButton orderCode={row.orderCode} label="Cek status" />}
      {row.user.phone && (
        <Button
          variant="ghost"
          size="icon-sm"
          title={`WhatsApp ${formatPhone(row.user.phone)}`}
          aria-label={`WhatsApp ${row.user.name}`}
          className="text-muted-foreground hover:text-success-strong"
          nativeButton={false}
          render={<a href={whatsappLink(row.user.phone)} target="_blank" rel="noopener noreferrer" />}
        >
          <MessageCircle aria-hidden />
        </Button>
      )}
    </span>
  );
}

/** Dialog verifikasi: rincian order + centang "dana sudah masuk" sebelum konfirmasi lunas. */
function VerifyDialog({ row }: { row: AdminTransactionRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<"paid" | "cancelled" | null>(null);
  const [pending, startTransition] = useTransition();
  const amount = formatRupiah(row.amount);
  const u = row.user;

  const settle = (status: "paid" | "cancelled") =>
    startTransition(async () => {
      if (status === "cancelled" && !window.confirm(`Batalkan order ${row.orderCode}? Siswa perlu membuat order baru bila ingin membayar.`)) return;
      const r = await settleManualOrderAction(row.orderCode, status);
      if (!r.ok) return setError(r.error);
      setError(null);
      setDone(status);
      router.refresh();
    });

  const notify = u.phone
    ? whatsappLink(
        u.phone,
        `Halo ${u.name}, pembayaran ${row.planName} sebesar ${amount} (kode order ${row.orderCode}) sudah kami terima.\n\n` +
          `Akses Premium ${SITE_NAME} di akunmu kini aktif — silakan muat ulang halaman atau masuk kembali.\n\nTerima kasih dan selamat belajar!`,
      )
    : null;

  return (
    <>
      <Button size="xs" variant={row.status === "pending" ? "default" : "outline"} onClick={() => setOpen(true)}>
        <ShieldCheck aria-hidden /> Verifikasi
      </Button>
      <AlertDialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (o) {
            setChecked(false);
            setError(null);
            setDone(null);
          }
        }}
      >
        <AlertDialogContent className="data-[size=default]:max-w-md data-[size=default]:sm:max-w-md">
          {done ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-lg font-bold">
                  {done === "paid" ? <CheckCircle2 className="size-5 text-success-strong" aria-hidden /> : <XCircle className="size-5 text-muted-foreground" aria-hidden />}
                  {done === "paid" ? "Premium aktif" : "Order dibatalkan"}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {done === "paid"
                    ? `Pembayaran ${amount} dari ${u.name} tercatat lunas dan Premium sudah aktif.`
                    : `Order ${row.orderCode} dibatalkan.`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              {done === "paid" && notify && (
                <Button className="w-full" nativeButton={false} render={<a href={notify} target="_blank" rel="noopener noreferrer" />}>
                  <MessageCircle aria-hidden /> Kabari {u.name.split(" ")[0]} via WhatsApp
                </Button>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel>Selesai</AlertDialogCancel>
              </AlertDialogFooter>
            </>
          ) : (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-lg font-bold">Verifikasi pembayaran</AlertDialogTitle>
                <AlertDialogDescription>Cocokkan rincian di bawah dengan bukti WhatsApp dan mutasi GoPay Merchant.</AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex flex-col gap-3 text-sm">
                <div className="rounded-lg border bg-muted/40 p-3 text-center">
                  <div className="text-xs text-muted-foreground">Nominal yang harus masuk</div>
                  <Amount row={row} large />
                  {row.uniqueCode != null && <div className="text-xs text-muted-foreground">termasuk kode unik {row.uniqueCode}</div>}
                </div>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                  <dt className="text-muted-foreground">Nama</dt>
                  <dd className="font-semibold">{u.name}</dd>
                  <dt className="text-muted-foreground">Akun</dt>
                  <dd>{contactOf(u) || "—"}</dd>
                  <dt className="text-muted-foreground">Sekolah</dt>
                  <dd>{[u.schoolName, u.province].filter(Boolean).join(" · ") || "—"}</dd>
                  <dt className="text-muted-foreground">Paket</dt>
                  <dd>
                    {row.planName} ({row.jenjang ?? "Semua jenjang"}, {row.durationDays ? `${row.durationDays} hari` : "selamanya"})
                  </dd>
                  <dt className="text-muted-foreground">Kode order</dt>
                  <dd className="font-mono text-xs">{row.orderCode}</dd>
                  <dt className="text-muted-foreground">Dibuat</dt>
                  <dd>
                    {formatDateTime(row.createdAt)} ({ago(row.createdAt)})
                  </dd>
                </dl>
                {row.status === "expired" && (
                  <p className="rounded-lg border border-warning/40 bg-warning-soft p-2.5 text-xs text-warning-strong">
                    Order ini sudah kedaluwarsa. Konfirmasi hanya bila dana dengan nominal persis ini memang masuk.
                  </p>
                )}
                <label className="flex items-start gap-2 rounded-lg border p-3">
                  <input type="checkbox" className="mt-0.5 size-4 accent-[var(--color-primary)]" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
                  <span>
                    Saya sudah memastikan dana <strong>{amount}</strong> masuk di mutasi GoPay Merchant.
                  </span>
                </label>
                {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
              </div>
              <AlertDialogFooter className="sm:justify-between">
                <Button variant="ghost" className="text-muted-foreground hover:text-destructive" disabled={pending} onClick={() => settle("cancelled")}>
                  Batalkan order
                </Button>
                <span className="flex flex-col-reverse gap-2 sm:flex-row">
                  <AlertDialogCancel>Tutup</AlertDialogCancel>
                  <Button disabled={!checked || pending} onClick={() => settle("paid")}>
                    <CheckCircle2 aria-hidden /> {pending ? "Memproses…" : "Konfirmasi lunas"}
                  </Button>
                </span>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
