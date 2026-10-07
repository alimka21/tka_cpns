"use client";

import { useState, useTransition } from "react";
import { CircleAlert, CircleCheck, LoaderCircle, PlugZap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { testDokuConnectionAction } from "@/server/actions/billing";

/** Tombol uji kredensial DOKU (tanpa transaksi) + hasilnya. */
export function DokuConnectionTest() {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <div className="flex flex-col gap-2">
      <Button
        size="sm"
        variant="outline"
        className="w-fit"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await testDokuConnectionAction();
            setResult(r.ok ? { ok: true, text: r.message } : { ok: false, text: r.error });
          })
        }
      >
        {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : <PlugZap aria-hidden />} Tes koneksi DOKU
      </Button>
      {result && (
        <p role="status" className={`flex items-start gap-1.5 text-sm font-medium ${result.ok ? "text-success-strong" : "text-destructive"}`}>
          {result.ok ? <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden /> : <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />}
          {result.text}
        </p>
      )}
    </div>
  );
}
