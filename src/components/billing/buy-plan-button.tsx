"use client";

import { useState, useTransition } from "react";
import { CreditCard, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createOrderAction } from "@/server/actions/billing";

/** Buat order lalu pindah ke halaman pembayaran DOKU Checkout (QRIS). */
export function BuyPlanButton({ planId, label = "Bayar sekarang" }: { planId: number; label?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-col gap-2">
      <Button
        size="lg"
        variant="cta"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const r = await createOrderAction(planId).catch(() => ({ ok: false as const, error: "Koneksi terputus. Coba lagi." }));
            if (!r.ok) return setError(r.error);
            window.location.href = r.redirectUrl;
          })
        }
      >
        {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : <CreditCard aria-hidden />}
        {pending ? "Menyiapkan pembayaran…" : label}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
