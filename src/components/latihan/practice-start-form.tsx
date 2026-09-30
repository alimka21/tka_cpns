"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DIAGNOSIS_STATUS, type DiagnosisStatusKey } from "@/lib/format";
import { DEFAULT_PRACTICE_SIZE, MAX_PRACTICE_TARGETS, PRACTICE_SIZES } from "@/lib/practice";
import { cn } from "@/lib/utils";
import { startPracticeAction } from "@/server/actions/practice";

export type PracticeOption = {
  subtopicId: number;
  name: string;
  context: string;
  accuracy: number;
  status: DiagnosisStatusKey;
  /** Soal bank tayang di subdomain ini. */
  available: number;
};

export function PracticeStartForm({ options, preselected, hasKey }: { options: PracticeOption[]; preselected: number[]; hasKey: boolean }) {
  const router = useRouter();
  const [selected, setSelected] = useState<number[]>(preselected);
  const [size, setSize] = useState<number>(DEFAULT_PRACTICE_SIZE);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const available = options.filter((o) => selected.includes(o.subtopicId)).reduce((n, o) => n + o.available, 0);

  function toggle(id: number) {
    setError(null);
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= MAX_PRACTICE_TARGETS ? prev : [...prev, id],
    );
  }

  function start() {
    setError(null);
    startTransition(async () => {
      const result = await startPracticeAction({ subtopicIds: selected, count: size });
      if (!result.ok) setError(result.error);
      else {
        const n = result.notice;
        router.push(`/latihan/${result.sessionId}${n && n.kind !== "added" ? `?ai=${n.kind}` : ""}`);
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-semibold">
          Pilih subdomain (maks {MAX_PRACTICE_TARGETS}) <span className="font-normal text-muted-foreground">— {selected.length} dipilih</span>
        </legend>
        {options.map((o) => {
          const checked = selected.includes(o.subtopicId);
          const disabled = (o.available === 0 && !hasKey) || (!checked && selected.length >= MAX_PRACTICE_TARGETS);
          const meta = DIAGNOSIS_STATUS[o.status];
          return (
            <label
              key={o.subtopicId}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
                checked && "border-primary bg-primary-soft",
                disabled && "cursor-not-allowed opacity-60",
              )}
            >
              <input
                type="checkbox"
                className="mt-1 size-4 accent-[var(--primary)]"
                checked={checked}
                disabled={disabled}
                onChange={() => toggle(o.subtopicId)}
              />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{o.name}</span>
                <span className="block text-xs text-muted-foreground">{o.context}</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {o.available > 0
                    ? `${o.available} soal tersedia di bank`
                    : hasKey
                      ? "Belum ada soal di bank — AI akan membuatkan soal latihan"
                      : "Belum ada soal di bank untuk subdomain ini"}
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-lg font-bold tabular-nums">{o.accuracy}%</span>
                <Badge variant={meta.variant}>{meta.label}</Badge>
              </span>
            </label>
          );
        })}
      </fieldset>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold">Jumlah soal</span>
        <div role="radiogroup" aria-label="Jumlah soal" className="flex flex-wrap gap-2">
          {PRACTICE_SIZES.map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={size === n}
              onClick={() => setSize(n)}
              className={cn(
                "h-10 min-w-14 rounded-lg border px-4 text-sm font-semibold text-muted-foreground",
                size === n && "border-primary bg-primary text-primary-foreground",
              )}
            >
              {n}
            </button>
          ))}
        </div>
        {selected.length > 0 && available < size && (
          <p className="text-xs text-muted-foreground">
            {hasKey
              ? `Bank baru punya ${available} soal untuk pilihanmu — sisanya dibuatkan AI (Latihan AI) memakai key Gemini-mu.`
              : `Bank baru punya ${available} soal untuk pilihanmu — sesi akan berisi soal yang tersedia saja. Simpan key Gemini di Pengaturan supaya AI bisa menambah soal.`}
          </p>
        )}
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive-soft px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button size="lg" disabled={pending || selected.length === 0 || (available === 0 && !hasKey)} onClick={start}>
        {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
        {pending ? (available < size && hasKey ? "Menyiapkan soal (AI bisa 10–40 detik)…" : "Menyiapkan soal…") : "Mulai latihan"}
        {!pending && <ArrowRight aria-hidden />}
      </Button>
    </div>
  );
}
