"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, CircleCheck, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveTestimonialsAction } from "@/server/actions/landing";

type Item = { name: string; role: string; quote: string; visible: boolean };

/** Kelola testimoni landing page. Section testimoni baru tampil bila ada ≥1 testimoni aktif. */
export function TestimonialsSetting({ initial }: { initial: Item[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>(initial);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const update = (i: number, patch: Partial<Item>) => {
    setItems((xs) => xs.map((x, j) => (j === i ? { ...x, ...patch } : x)));
    setSaved(false);
  };
  const move = (i: number, d: -1 | 1) => {
    setItems((xs) => {
      const next = [...xs];
      [next[i], next[i + d]] = [next[i + d], next[i]];
      return next;
    });
    setSaved(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Hanya masukkan testimoni <strong>asli</strong> dari siswa, guru, atau orang tua yang sudah memberi izin namanya
        ditampilkan. Section testimoni di halaman depan otomatis disembunyikan selama belum ada testimoni yang aktif.
      </p>

      {items.length === 0 && <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">Belum ada testimoni.</p>}

      <ol className="flex flex-col gap-3">
        {items.map((t, i) => (
          <li key={i} className="flex flex-col gap-3 rounded-xl border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold">Testimoni {i + 1}</span>
              <div className="flex items-center gap-1">
                <Switch checked={t.visible} onCheckedChange={(v) => update(i, { visible: v })} label={`Tampilkan testimoni ${i + 1}`} />
                <span className="mr-2 text-xs text-muted-foreground">{t.visible ? "Tampil" : "Disembunyikan"}</span>
                <Button variant="ghost" size="sm" aria-label="Naikkan" disabled={i === 0} onClick={() => move(i, -1)}>
                  <ArrowUp aria-hidden />
                </Button>
                <Button variant="ghost" size="sm" aria-label="Turunkan" disabled={i === items.length - 1} onClick={() => move(i, 1)}>
                  <ArrowDown aria-hidden />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Hapus testimoni ${i + 1}`}
                  onClick={() => {
                    setItems((xs) => xs.filter((_, j) => j !== i));
                    setSaved(false);
                  }}
                >
                  <Trash2 aria-hidden />
                </Button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`t-name-${i}`}>Nama</Label>
                <Input id={`t-name-${i}`} value={t.name} maxLength={80} placeholder="mis. Nadia R." onChange={(e) => update(i, { name: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`t-role-${i}`}>Keterangan</Label>
                <Input
                  id={`t-role-${i}`}
                  value={t.role}
                  maxLength={120}
                  placeholder="mis. Siswa kelas 12, Bandung"
                  onChange={(e) => update(i, { role: e.target.value })}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`t-quote-${i}`}>Isi testimoni</Label>
              <textarea
                id={`t-quote-${i}`}
                value={t.quote}
                maxLength={400}
                rows={3}
                className="min-h-20 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15 focus-visible:outline-none"
                onChange={(e) => update(i, { quote: e.target.value })}
              />
              <span className="text-right text-xs text-muted-foreground">{t.quote.length}/400</span>
            </div>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          disabled={items.length >= 12}
          onClick={() => {
            setItems((xs) => [...xs, { name: "", role: "", quote: "", visible: true }]);
            setSaved(false);
          }}
        >
          <Plus aria-hidden /> Tambah testimoni
        </Button>
        <Button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const r = await saveTestimonialsAction(items);
              if (!r.ok) return setError(r.error);
              setSaved(true);
              router.refresh();
            })
          }
        >
          {pending && <LoaderCircle className="animate-spin" aria-hidden />} Simpan testimoni
        </Button>
        {saved && (
          <span role="status" className="flex items-center gap-1.5 text-sm text-success-strong">
            <CircleCheck className="size-4" aria-hidden /> Tersimpan — halaman depan diperbarui.
          </span>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
