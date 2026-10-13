"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, CircleCheck, DatabaseBackup, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createBackupAction } from "@/server/actions/backup";

/** Buat backup sekarang (opsional kirim salinan ke email). */
export function BackupNowButton({ canEmail }: { canEmail: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [email, setEmail] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-4">
        <Button
          disabled={pending}
          onClick={() =>
            start(async () => {
              setResult(null);
              const r = await createBackupAction(email);
              setResult(r.ok ? { ok: true, text: r.message } : { ok: false, text: r.error });
              router.refresh();
            })
          }
        >
          {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : <DatabaseBackup aria-hidden />} {pending ? "Membuat backup…" : "Buat backup sekarang"}
        </Button>
        {canEmail && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} className="size-4 accent-primary" />
            Kirim salinan ke email
          </label>
        )}
      </div>
      {result && (
        <p role="status" className={`flex items-start gap-1.5 text-sm font-medium ${result.ok ? "text-success-strong" : "text-destructive"}`}>
          {result.ok ? <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden /> : <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />}
          {result.text}
        </p>
      )}
    </div>
  );
}
