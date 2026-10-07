"use client";

import { useState, useTransition } from "react";
import { CircleCheck, Flag, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { REPORT_REASON_LABEL, type ReportReasonKey } from "@/lib/report-reasons";
import { cn } from "@/lib/utils";
import { reportQuestionAction } from "@/server/actions/question-reports";

import type { ReportTarget as Target } from "@/lib/report-target";

/** Siswa melaporkan soal (kunci salah, ambigu, dst.) → antrean admin /admin/laporan. */
export function ReportQuestionButton({ target }: { target: Target }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReasonKey | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  if (sent) {
    return (
      <p role="status" className="flex items-center gap-1.5 text-xs text-success-strong">
        <CircleCheck className="size-3.5" aria-hidden /> Terima kasih — laporanmu terkirim ke admin.
      </p>
    );
  }
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="flex w-fit items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-destructive">
        <Flag className="size-3.5" aria-hidden /> Laporkan soal
      </button>
    );
  }
  return (
    <form
      className="flex flex-col gap-3 rounded-lg border p-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!reason) return setError("Pilih alasan laporan.");
        setError(null);
        startTransition(async () => {
          const r = await reportQuestionAction({ target, reason, note: note || undefined });
          if (!r.ok) setError(r.error);
          else setSent(true);
        });
      }}
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-semibold">Apa masalah soal ini?</legend>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(REPORT_REASON_LABEL) as ReportReasonKey[]).map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={reason === k}
              onClick={() => setReason(k)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-semibold text-muted-foreground",
                reason === k && "border-destructive bg-destructive-soft text-destructive",
              )}
            >
              {REPORT_REASON_LABEL[k]}
            </button>
          ))}
        </div>
      </fieldset>
      <textarea
        rows={2}
        maxLength={500}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Keterangan tambahan (opsional), mis. kunci seharusnya C karena…"
        aria-label="Keterangan laporan"
        className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus-visible:border-ring focus-visible:outline-none"
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" variant="destructive" disabled={pending}>
          {pending && <LoaderCircle className="animate-spin" aria-hidden />} Kirim laporan
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Batal
        </Button>
      </div>
    </form>
  );
}
