"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Landmark, MessageCircle, TicketPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { savePayoutAccountAction, setLateReferralAction } from "@/server/actions/referrals";

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (key: string, text: string) => {
    await navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied((c) => (c === key ? null : c)), 2000);
  };
  return { copied, copy };
}

/** Kode + link referal dengan tombol salin & bagikan ke WhatsApp. */
export function ReferralShare({ code, link, percent }: { code: string; link: string; percent: number }) {
  const { copied, copy } = useCopy();
  const waText =
    `Aku latihan TKA di Pakar TKA — ada ribuan soal SD/SMP/SMA plus analisis kelemahan per subtopik.\n\n` +
    `Daftar gratis lewat link ini (kode referal: ${code}):\n${link}`;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-xl border bg-primary-soft/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Kode referal kamu</p>
        <div className="mt-2 flex items-center gap-3">
          <span className="font-mono text-2xl font-bold tracking-[0.2em] text-primary">{code}</span>
          <Button size="sm" variant="outline" onClick={() => copy("code", code)}>
            {copied === "code" ? <Check aria-hidden /> : <Copy aria-hidden />}
            {copied === "code" ? "Tersalin" : "Salin"}
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Teman memasukkan kode ini saat daftar. Kamu mendapat komisi {percent}% dari setiap pembayaran Premium mereka.
        </p>
      </div>
      <div className="rounded-xl border p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Link daftar</p>
        <p className="mt-2 truncate rounded-md bg-muted px-3 py-2 font-mono text-sm" title={link}>
          {link}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => copy("link", link)}>
            {copied === "link" ? <Check aria-hidden /> : <Copy aria-hidden />}
            {copied === "link" ? "Tersalin" : "Salin link"}
          </Button>
          <Button
            size="sm"
            nativeButton={false}
            render={<a href={`https://wa.me/?text=${encodeURIComponent(waText)}`} target="_blank" rel="noopener noreferrer" />}
          >
            <MessageCircle aria-hidden /> Bagikan ke WhatsApp
          </Button>
        </div>
      </div>
    </div>
  );
}

type Account = { bankName: string; accountNumber: string; accountName: string } | null;

/** Rekening/e-wallet tujuan transfer komisi. */
export function PayoutAccountForm({ account }: { account: Account }) {
  const router = useRouter();
  const [editing, setEditing] = useState(!account);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  if (account && !editing) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/50 p-4 text-sm">
        <div className="flex items-start gap-3">
          <Landmark className="mt-0.5 size-5 text-primary" aria-hidden />
          <div>
            <p className="font-semibold">
              {account.bankName} · <span className="font-mono">{account.accountNumber}</span>
            </p>
            <p className="text-muted-foreground">a.n. {account.accountName}</p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
          Ubah
        </Button>
        {msg?.ok && <p className="w-full text-xs text-success-strong">{msg.text}</p>}
      </div>
    );
  }

  return (
    <form
      className="grid gap-3 sm:grid-cols-3"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        startTransition(async () => {
          const r = await savePayoutAccountAction({
            bankName: String(f.get("bankName") ?? ""),
            accountNumber: String(f.get("accountNumber") ?? ""),
            accountName: String(f.get("accountName") ?? ""),
          });
          setMsg(r.ok ? { ok: true, text: r.message ?? "Tersimpan." } : { ok: false, text: r.error });
          if (r.ok) {
            setEditing(false);
            router.refresh();
          }
        });
      }}
    >
      <div className="grid gap-1.5">
        <Label htmlFor="bankName">Bank / e-wallet</Label>
        <Input id="bankName" name="bankName" defaultValue={account?.bankName} placeholder="BCA, BRI, DANA, GoPay…" required maxLength={60} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="accountNumber">Nomor rekening / HP</Label>
        <Input id="accountNumber" name="accountNumber" defaultValue={account?.accountNumber} inputMode="numeric" placeholder="1234567890" required maxLength={40} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="accountName">Atas nama</Label>
        <Input id="accountName" name="accountName" defaultValue={account?.accountName} placeholder="Nama pemilik rekening" required maxLength={100} />
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:col-span-3">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan rekening"}
        </Button>
        {account && (
          <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Batal
          </Button>
        )}
        {msg && !msg.ok && <p className="text-sm text-destructive">{msg.text}</p>}
      </div>
    </form>
  );
}

/** Untuk akun baru yang belum memasukkan kode teman saat daftar (mis. lewat Google). */
export function LateReferralForm({ days }: { days: number }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <form
      className="flex flex-col gap-3 rounded-xl border border-dashed p-4 sm:flex-row sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        const code = String(new FormData(e.currentTarget).get("code") ?? "");
        startTransition(async () => {
          const r = await setLateReferralAction(code);
          if (!r.ok) return setError(r.error);
          setError(null);
          router.refresh();
        });
      }}
    >
      <div className="grid flex-1 gap-1.5">
        <Label htmlFor="late-code" className="flex items-center gap-2">
          <TicketPlus className="size-4 text-primary" aria-hidden /> Diajak teman? Masukkan kode referalnya
        </Label>
        <Input id="late-code" name="code" placeholder="Contoh: PKR7Q2X" className="uppercase" maxLength={12} required />
        <p className="text-xs text-muted-foreground">
          Hanya bisa diisi sekali, paling lambat {days} hari setelah daftar dan sebelum pembayaran pertama.
        </p>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Menyimpan…" : "Simpan kode"}
      </Button>
    </form>
  );
}
