"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, CircleCheck, LoaderCircle, Lock, Sparkles, Wand2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { applyReportFixAction, suggestReportFixAction, type AiFixCurrent } from "@/server/actions/question-reports";
import type { FixSuggestion } from "@/server/services/report-ai-fix";

const LABELS = ["A", "B", "C", "D", "E"];
type Opt = { text: string; isCorrect: boolean; correctCategory: string | null };
const area = "w-full rounded-lg border bg-card px-3 py-2 text-sm leading-relaxed focus-visible:ring-3 focus-visible:ring-ring/25 focus-visible:outline-none";

/**
 * "Perbaiki dengan AI" untuk soal bank yang dilaporkan: admin menulis catatan, Gemini (key admin)
 * menganalisis laporan + soal dan mengusulkan perbaikan. Admin meninjau/menyunting kolom
 * "Sesudah", lalu menerapkannya (validasi & kunci soal terpakai tetap berlaku di server).
 */
export function AiFixPanel({ questionId }: { questionId: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [asking, startAsk] = useTransition();
  const [applying, startApply] = useTransition();
  const [result, setResult] = useState<{ suggestion: FixSuggestion; current: AiFixCurrent; keysLocked: boolean } | null>(null);
  const [text, setText] = useState("");
  const [opts, setOpts] = useState<Opt[]>([]);
  const [expl, setExpl] = useState("");
  const [resolve, setResolve] = useState(true);

  const ask = () =>
    startAsk(async () => {
      setError(null);
      setDone(false);
      const r = await suggestReportFixAction({ questionId, adminNote: note }).catch(() => ({ ok: false as const, error: "Koneksi terputus. Coba lagi." }));
      if (!r.ok) return setError(r.error);
      setResult(r);
      setText(r.suggestion.questionText);
      setOpts(r.suggestion.options);
      setExpl(r.suggestion.explanationText);
    });

  const apply = () =>
    startApply(async () => {
      setError(null);
      const r = await applyReportFixAction({ questionId, questionText: text, options: opts, explanationText: expl, resolve }).catch(() => ({
        ok: false as const,
        error: "Koneksi terputus. Coba lagi.",
      }));
      if (!r.ok) return setError(r.error);
      setDone(true);
      setResult(null);
      router.refresh();
    });

  if (!open) {
    return (
      <Button size="sm" variant="outline" className="border-primary/40 text-primary" onClick={() => setOpen(true)}>
        <Sparkles aria-hidden /> Perbaiki dengan AI
      </Button>
    );
  }

  const cur = result?.current;
  const locked = result?.keysLocked ?? false;
  const kategori = cur?.type === "pgk_kategori";
  const setOpt = (i: number, patch: Partial<Opt>) => setOpts((all) => all.map((o, j) => (j === i ? { ...o, ...patch } : cur?.type === "pg" && patch.isCorrect ? { ...o, isCorrect: false } : o)));
  const changed = (a: string, b: string) => a.trim() !== b.trim();

  return (
    <section className="w-full basis-full rounded-xl border border-primary/30 bg-primary-soft/40 p-4" aria-label="Perbaiki soal dengan AI">
      <div className="flex items-start justify-between gap-3">
        <h3 className="flex items-center gap-2 font-bold text-primary">
          <Sparkles className="size-4" aria-hidden /> Perbaiki dengan AI
        </h3>
        <Button size="icon-sm" variant="ghost" aria-label="Tutup panel AI" onClick={() => setOpen(false)}>
          <X aria-hidden />
        </Button>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        <Label htmlFor={`ai-note-${questionId}`}>Catatan admin untuk AI (opsional)</Label>
        <textarea
          id={`ai-note-${questionId}`}
          rows={3}
          maxLength={1000}
          className={area}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Mis. kunci seharusnya C karena …; atau: perjelas kalimat soal tanpa mengubah kunci."
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" disabled={asking || applying} onClick={ask}>
            {asking ? <LoaderCircle className="animate-spin" aria-hidden /> : <Wand2 aria-hidden />}
            {asking ? "AI sedang menelaah… (±10–40 detik)" : result ? "Minta saran ulang" : "Minta saran AI"}
          </Button>
          <span className="text-xs text-muted-foreground">Memakai API key Gemini milikmu. Saran tidak tersimpan sebelum kamu menerapkannya.</span>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-3 flex gap-2 rounded-lg border border-destructive/30 bg-destructive-soft p-3 text-sm text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden /> {error}
        </p>
      )}
      {done && (
        <p role="status" className="mt-3 flex gap-2 rounded-lg border border-success/30 bg-success-soft p-3 text-sm text-success-strong">
          <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden /> Perbaikan tersimpan{resolve ? " dan laporan ditandai selesai" : ""}.
        </p>
      )}

      {result && cur && (
        <div className="mt-4 flex flex-col gap-4">
          <div className="rounded-lg border bg-card p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={result.suggestion.reportValid ? "danger" : "success"}>
                {result.suggestion.reportValid ? "Laporan valid — soal perlu diperbaiki" : "Laporan tidak valid — soal sudah benar"}
              </Badge>
              {locked && (
                <Badge variant="muted">
                  <Lock aria-hidden /> Kunci terkunci (soal sudah dijawab siswa)
                </Badge>
              )}
            </div>
            <p className="mt-2 whitespace-pre-line">{result.suggestion.analysis}</p>
            {result.suggestion.changesSummary && <p className="mt-2 whitespace-pre-line text-muted-foreground">Perubahan: {result.suggestion.changesSummary}</p>}
            {result.suggestion.keyChangeIgnored && (
              <p className="mt-2 font-semibold text-warning-strong">
                AI mengusulkan perubahan kunci, tetapi diabaikan karena soal sudah dijawab siswa. Bila kunci memang salah, buat soal baru lewat Bank Soal.
              </p>
            )}
          </div>

          <Compare label="Teks soal" before={cur.questionText} changed={changed(cur.questionText, text)}>
            <textarea rows={Math.min(14, Math.max(4, text.split("\n").length + 1))} className={area} value={text} onChange={(e) => setText(e.target.value)} />
          </Compare>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold">{kategori ? "Pernyataan & kategori kunci" : "Opsi & kunci"}</p>
            {opts.map((o, i) => {
              const before = cur.options[i];
              const keyChanged = kategori ? o.correctCategory !== before.correctCategory : o.isCorrect !== before.isCorrect;
              return (
                <div key={i} className={cn("grid gap-2 rounded-lg border bg-card p-3 sm:grid-cols-[auto_1fr_auto]", (changed(before.text, o.text) || keyChanged) && "border-warning")}>
                  <span className="font-bold">{LABELS[i]}.</span>
                  <div className="flex flex-col gap-1">
                    {changed(before.text, o.text) && <p className="text-xs text-muted-foreground line-through">{before.text}</p>}
                    <input className={cn(area, "py-1.5")} value={o.text} onChange={(e) => setOpt(i, { text: e.target.value })} aria-label={`Teks opsi ${LABELS[i]}`} />
                  </div>
                  {kategori ? (
                    <select
                      className="h-9 rounded-lg border bg-card px-2 text-sm disabled:opacity-60"
                      value={o.correctCategory ?? ""}
                      disabled={locked}
                      onChange={(e) => setOpt(i, { correctCategory: e.target.value })}
                      aria-label={`Kategori kunci ${LABELS[i]}`}
                    >
                      {cur.categoryLabels?.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <label className={cn("flex items-center gap-1.5 text-sm font-semibold", locked && "opacity-60")}>
                      <input
                        type={cur.type === "pg" ? "radio" : "checkbox"}
                        name={`kunci-${questionId}`}
                        checked={o.isCorrect}
                        disabled={locked}
                        onChange={(e) => setOpt(i, { isCorrect: e.target.checked })}
                        className="size-4 accent-[var(--color-success)]"
                      />
                      Kunci
                    </label>
                  )}
                </div>
              );
            })}
          </div>

          <Compare label="Pembahasan" before={cur.explanationText || "(kosong)"} changed={changed(cur.explanationText, expl)}>
            <textarea rows={Math.min(16, Math.max(5, expl.split("\n").length + 1))} className={area} value={expl} onChange={(e) => setExpl(e.target.value)} />
          </Compare>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="size-4" checked={resolve} onChange={(e) => setResolve(e.target.checked)} />
              Tandai laporan soal ini selesai setelah diterapkan
            </label>
            <span className="flex gap-2">
              <Button size="sm" variant="ghost" disabled={applying} onClick={() => setResult(null)}>
                Buang saran
              </Button>
              <Button size="sm" disabled={applying || asking} onClick={apply}>
                {applying ? <LoaderCircle className="animate-spin" aria-hidden /> : <CircleCheck aria-hidden />}
                {applying ? "Menyimpan…" : "Terapkan perbaikan"}
              </Button>
            </span>
          </div>
        </div>
      )}
    </section>
  );
}

function Compare({ label, before, changed, children }: { label: string; before: string; changed: boolean; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold">{label} — sebelum</p>
        <pre className="max-h-72 overflow-auto rounded-lg border bg-muted/50 p-3 font-sans text-sm whitespace-pre-wrap">{before}</pre>
      </div>
      <div className="flex flex-col gap-1">
        <p className="flex items-center gap-2 text-sm font-semibold">
          {label} — sesudah {changed ? <Badge variant="warning">diubah</Badge> : <Badge variant="muted">tetap</Badge>}
        </p>
        {children}
      </div>
    </div>
  );
}
