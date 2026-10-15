"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { thresholdsFromCuts } from "@/lib/achievement-thresholds";
import { formatScore } from "@/lib/score-display";
import { ACHIEVEMENT_LABEL, SCALE_LABEL, SCALE_RANGE, SCORE_SCALES, type ScoreScale } from "@/lib/score-scale";
import type { ConversionScales } from "@/lib/scoring-config";
import { clearAchievementThresholdsAction, setAchievementThresholdsAction, setScoringConversionAction } from "@/server/actions/scoring-settings";

const SCALE_JENJANG: Record<ScoreScale, string> = { "0_100": "SD & SMP", "200_800": "SMA" };

export type ThresholdState = Record<ScoreScale, { memadaiFrom: string; baikFrom: string; official: boolean } | null>;

/** Ambang kategori Baik/Memadai/Kurang per skala — tidak diatur regulasi. */
export function ThresholdSettings({ initial }: { initial: ThresholdState }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Regulasi (Kepmendikdasmen 56/2026) menetapkan nama kategori <strong>Baik, Memadai, Kurang</strong> per mata uji, tetapi{" "}
        <strong>tidak menetapkan ambangnya</strong>. Selama ambang skala belum diisi, halaman hasil menampilkan &ldquo;ambang kategori belum
        ditetapkan&rdquo;. Siswa diberi tahu bahwa ambang ini ketetapan internal platform, kecuali ditandai resmi.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {SCORE_SCALES.map((scale) => (
          <ThresholdCard key={scale} scale={scale} initial={initial[scale]} />
        ))}
      </div>
    </div>
  );
}

function ThresholdCard({ scale, initial }: { scale: ScoreScale; initial: ThresholdState[ScoreScale] }) {
  const router = useRouter();
  const [memadaiFrom, setMemadaiFrom] = useState(initial ? formatScore(initial.memadaiFrom) : "");
  const [baikFrom, setBaikFrom] = useState(initial ? formatScore(initial.baikFrom) : "");
  const [official, setOfficial] = useState(initial?.official ?? false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();
  const preview = memadaiFrom && baikFrom ? thresholdsFromCuts(scale, memadaiFrom, baikFrom) : null;
  const { min, max } = SCALE_RANGE[scale];

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => {
      setError(null);
      const r = await fn();
      if (!r.ok) return setError(r.error ?? "Gagal menyimpan.");
      setDone(true);
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-3 rounded-xl border p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold">
          Skala {SCALE_LABEL[scale]} <span className="font-normal text-muted-foreground">· {SCALE_JENJANG[scale]}</span>
        </h3>
        {initial ? <Badge variant={initial.official ? "success" : "info"}>{initial.official ? "Resmi" : "Internal"}</Badge> : <Badge variant="muted">Belum diatur</Badge>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`memadai-${scale}`}>Memadai mulai dari</Label>
          <Input id={`memadai-${scale}`} inputMode="decimal" value={memadaiFrom} placeholder={`> ${min}`} onChange={(e) => { setMemadaiFrom(e.target.value); setDone(false); }} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`baik-${scale}`}>Baik mulai dari</Label>
          <Input id={`baik-${scale}`} inputMode="decimal" value={baikFrom} placeholder={`≤ ${max}`} onChange={(e) => { setBaikFrom(e.target.value); setDone(false); }} />
        </div>
      </div>
      {preview && "rows" in preview && (
        <ul className="flex flex-col gap-0.5 text-xs text-muted-foreground tabular-nums">
          {preview.rows.map((r) => (
            <li key={r.category}>
              {ACHIEVEMENT_LABEL[r.category]}: {formatScore(r.minScore)} – {formatScore(r.maxScore)}
            </li>
          ))}
        </ul>
      )}
      <label className="flex items-center gap-2 text-sm">
        <Switch checked={official} onCheckedChange={(v) => { setOfficial(v); setDone(false); }} label="Ambang resmi" />
        Ambang resmi (centang hanya bila sudah diterbitkan pemerintah)
      </label>
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
      {done && !error && (
        <p role="status" className="flex items-center gap-1.5 text-xs text-success-strong">
          <CircleCheck className="size-3.5" aria-hidden /> Tersimpan.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={pending} onClick={() => run(() => setAchievementThresholdsAction({ scale, memadaiFrom, baikFrom, isOfficial: official }))}>
          {pending && <LoaderCircle className="animate-spin" aria-hidden />} Simpan ambang
        </Button>
        {initial && (
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => {
              if (!window.confirm(`Kosongkan ambang skala ${SCALE_LABEL[scale]}? Kategori tidak akan ditampilkan lagi.`)) return;
              setMemadaiFrom("");
              setBaikFrom("");
              run(() => clearAchievementThresholdsAction(scale));
            }}
          >
            Kosongkan
          </Button>
        )}
      </div>
    </div>
  );
}

type AnchorRow = { raw: string; scaled: string };

/** Rumus konversi skor mentah → nilai skala (titik jangkar, linear di antaranya). */
export function ConversionSettings({ version, scales }: { version: number; scales: ConversionScales }) {
  const router = useRouter();
  const [rows, setRows] = useState<Record<ScoreScale, AnchorRow[]>>(
    () =>
      Object.fromEntries(
        SCORE_SCALES.map((s) => [s, scales[s].anchors.map((a) => ({ raw: String(a.raw), scaled: formatScore(a.scaled) }))]),
      ) as Record<ScoreScale, AnchorRow[]>,
  );
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  const update = (scale: ScoreScale, next: AnchorRow[]) => {
    setRows((r) => ({ ...r, [scale]: next }));
    setDone(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Rumus konversi resmi (penyetaraan statistik) <strong>tidak dipublikasikan</strong>, jadi nilai di platform ini adalah simulasi. Default:
        garis lurus dari batas bawah (0% benar) ke batas atas (100% benar). Tambahkan titik antara bila ingin kurva lain. Rumus baru hanya
        berlaku untuk tes yang selesai setelah disimpan; nilai lama tetap beserta versinya. <strong>Versi aktif: v{version}</strong>.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {SCORE_SCALES.map((scale) => {
          const list = rows[scale];
          return (
            <div key={scale} className="flex flex-col gap-2 rounded-xl border p-4">
              <h3 className="font-semibold">
                Skala {SCALE_LABEL[scale]} <span className="font-normal text-muted-foreground">· {SCALE_JENJANG[scale]}</span>
              </h3>
              <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs font-semibold text-muted-foreground">
                <span>% skor mentah</span>
                <span>Nilai</span>
                <span className="sr-only">Aksi</span>
              </div>
              {list.map((row, i) => {
                const edge = i === 0 || i === list.length - 1;
                return (
                  <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
                    <Input
                      aria-label={`Persen skor mentah titik ${i + 1}`}
                      inputMode="numeric"
                      value={row.raw}
                      readOnly={edge}
                      className={edge ? "bg-muted" : undefined}
                      onChange={(e) => update(scale, list.map((r, j) => (j === i ? { ...r, raw: e.target.value } : r)))}
                    />
                    <Input
                      aria-label={`Nilai titik ${i + 1}`}
                      inputMode="decimal"
                      value={row.scaled}
                      readOnly={edge}
                      className={edge ? "bg-muted" : undefined}
                      onChange={(e) => update(scale, list.map((r, j) => (j === i ? { ...r, scaled: e.target.value } : r)))}
                    />
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={edge}
                      aria-label={`Hapus titik ${i + 1}`}
                      onClick={() => update(scale, list.filter((_, j) => j !== i))}
                    >
                      <Trash2 aria-hidden />
                    </Button>
                  </div>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                className="w-fit"
                disabled={list.length >= 11}
                onClick={() => update(scale, [...list.slice(0, -1), { raw: "50", scaled: "" }, list[list.length - 1]])}
              >
                <Plus aria-hidden /> Tambah titik antara
              </Button>
              <p className="text-xs text-muted-foreground">Titik pertama & terakhir tetap: 0% → {SCALE_RANGE[scale].min}, 100% → {SCALE_RANGE[scale].max}.</p>
            </div>
          );
        })}
      </div>
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
      {done && !error && (
        <p role="status" className="flex items-center gap-1.5 text-sm text-success-strong">
          <CircleCheck className="size-4" aria-hidden /> Rumus tersimpan.
        </p>
      )}
      <Button
        className="w-fit"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const payload = Object.fromEntries(
              SCORE_SCALES.map((s) => [s, [...rows[s]].sort((a, b) => Number(a.raw) - Number(b.raw)).map((r) => ({ raw: Number(r.raw), scaled: r.scaled }))]),
            );
            const r = await setScoringConversionAction(payload);
            if (!r.ok) return setError(r.error);
            setDone(true);
            router.refresh();
          })
        }
      >
        {pending && <LoaderCircle className="animate-spin" aria-hidden />} Simpan rumus konversi
      </Button>
    </div>
  );
}
