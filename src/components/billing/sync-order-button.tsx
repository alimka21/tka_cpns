"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { syncOrderAction } from "@/server/actions/billing";

export function SyncOrderButton({ orderCode, label = "Cek status pembayaran" }: { orderCode: string; label?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <span className="flex flex-col gap-1">
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const r = await syncOrderAction(orderCode);
            if (!r.ok) setError(r.error);
            else {
              setError(null);
              router.refresh();
            }
          })
        }
      >
        {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : <RefreshCw aria-hidden />} {label}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </span>
  );
}
