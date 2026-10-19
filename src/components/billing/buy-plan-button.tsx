"use client";

import { useState, useTransition } from "react";
import { CreditCard, Landmark, LoaderCircle, Lock, MessageCircle, QrCode, ShieldCheck, Wallet, type LucideIcon } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { createOrderAction } from "@/server/actions/billing";

export type BuyMethod = { id: string; label: string; hint: string; primary?: boolean };

const ICONS: Record<string, LucideIcon> = {
  "doku-qris": QrCode,
  "doku-va": Landmark,
  "doku-ewallet": Wallet,
  "doku-card": CreditCard,
  manual: MessageCircle,
};

/**
 * Pilih cara bayar (metode utama disorot, umumnya QRIS) lalu buat order dan pindah ke
 * halaman pembayaran penyedia (mis. DOKU Checkout) atau halaman QRIS manual.
 */
export function BuyPlanButton({
  planId,
  planName,
  priceText,
  methods,
  gatewayLabel,
  label = "Bayar sekarang",
}: {
  planId: number;
  planName: string;
  priceText: string;
  methods: BuyMethod[];
  /** Nama penyedia pembayaran resmi untuk catatan keamanan (mis. "DOKU"); null bila hanya manual. */
  gatewayLabel: string | null;
  label?: string;
}) {
  const primary = methods.find((m) => m.primary) ?? methods[0];
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState(primary?.id);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const others = methods.filter((m) => m.id !== primary?.id);

  const pay = () =>
    startTransition(async () => {
      setError(null);
      const r = await createOrderAction(planId, choice).catch(() => ({ ok: false as const, error: "Koneksi terputus. Coba lagi." }));
      if (!r.ok) return setError(r.error);
      window.location.href = r.redirectUrl;
    });

  const option = (m: BuyMethod) => {
    const Icon = ICONS[m.id] ?? CreditCard;
    const active = choice === m.id;
    return (
      <label
        key={m.id}
        className={cn(
          "flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors",
          active ? "border-primary bg-primary-soft ring-1 ring-primary" : "hover:border-primary/40",
          m.primary && "p-4",
        )}
      >
        <input type="radio" name={`metode-${planId}`} value={m.id} checked={active} onChange={() => setChoice(m.id)} className="mt-1 size-4 accent-[var(--color-primary)]" />
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", m.primary ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
          <Icon className="size-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-1.5 font-semibold">
            {m.label}
            {m.primary && methods.length > 1 && <Badge variant="success">Utama · disarankan</Badge>}
          </span>
          <span className="mt-0.5 block text-xs text-muted-foreground">{m.hint}</span>
        </span>
      </label>
    );
  };

  return (
    <>
      <Button size="lg" variant="cta" className="w-full" onClick={() => setOpen(true)}>
        <CreditCard aria-hidden /> {label}
      </Button>
      <AlertDialog open={open} onOpenChange={(o) => !pending && setOpen(o)}>
        <AlertDialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto data-[size=default]:max-w-md data-[size=default]:sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">Pilih cara pembayaran</AlertDialogTitle>
            <AlertDialogDescription>
              {planName} · <strong className="text-foreground">{priceText}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div role="radiogroup" aria-label="Cara pembayaran" className="flex flex-col gap-2">
            {primary && option(primary)}
            {others.length > 0 && <p className="mt-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Metode lain</p>}
            {others.map(option)}
          </div>
          {gatewayLabel && choice !== "manual" && (
            <p className="flex gap-2 rounded-lg border border-success/30 bg-success-soft p-3 text-xs text-success-strong">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                Pembayaran diproses aman oleh <strong>{gatewayLabel}</strong>, payment gateway resmi berizin Bank Indonesia. Anda akan diarahkan ke
                halaman pembayaran {gatewayLabel}; data kartu/rekening tidak disimpan oleh kami. Premium aktif otomatis setelah pembayaran berhasil.
              </span>
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm font-semibold text-destructive">
              {error}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
            <Button variant="cta" disabled={pending || !choice} onClick={pay}>
              {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : <Lock aria-hidden />}
              {pending ? "Menyiapkan pembayaran…" : "Lanjut bayar"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
