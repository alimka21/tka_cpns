"use client";

// Admin → Langganan: paket langganan yang sudah ada (kartu, status dijual/nonaktif,
// penjualan, edit di tempat) dipisahkan dari panel "Buat paket baru" (form +
// pratinjau kartu seperti yang dilihat siswa).

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LoaderCircle, Pencil, Plus, Save, Sparkles, TriangleAlert, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatRupiah } from "@/lib/format";
import { TEST_PLAN_MAX_PRICE } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { savePlanAction } from "@/server/actions/billing";

export type PlanFormData = {
  id?: number;
  name: string;
  description: string | null;
  jenjang: "SD" | "SMP" | "SMA" | null;
  price: number;
  durationDays: number | null;
  isActive: boolean;
  sortOrder: number;
};

export type PlanCardData = PlanFormData & {
  id: number;
  createdAt: string;
  isNew: boolean;
  /** Paket aktif termurah (bukan uji coba) — harganya tampil di landing & popup upgrade. */
  isCheapest: boolean;
  sales: { paid: number; revenue: number; pending: number };
};

const field = "h-9 w-full rounded-md border border-input bg-card px-2.5 text-sm";
const EMPTY: PlanFormData = { name: "", description: "", jenjang: null, price: 49000, durationDays: 30, isActive: true, sortOrder: 0 };

function perDay(p: { price: number; durationDays: number | null }) {
  return p.durationDays ? formatRupiah(Math.ceil(p.price / p.durationDays)) : null;
}

function useSave() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const save = (data: PlanFormData, after?: () => void) =>
    start(async () => {
      const r = await savePlanAction(data);
      if (!r.ok) return setError(r.error);
      setError(null);
      after?.();
      router.refresh();
    });
  return { error, pending, save };
}

function PlanFields({ v, set }: { v: PlanFormData; set: <K extends keyof PlanFormData>(k: K, value: PlanFormData[K]) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="flex flex-col gap-1 text-xs font-semibold sm:col-span-2">
        Nama paket
        <Input value={v.name} onChange={(e) => set("name", e.target.value)} placeholder="Premium SMA 60 hari" className="h-9" />
      </label>
      <label className="flex flex-col gap-1 text-xs font-semibold">
        Harga (Rp)
        <input type="number" min={1000} step={500} className={field} value={v.price} onChange={(e) => set("price", Number(e.target.value))} />
      </label>
      <label className="flex flex-col gap-1 text-xs font-semibold">
        Durasi (hari, kosong = selamanya)
        <input type="number" min={1} className={field} value={v.durationDays ?? ""} onChange={(e) => set("durationDays", e.target.value ? Number(e.target.value) : null)} />
      </label>
      <label className="flex flex-col gap-1 text-xs font-semibold">
        Jenjang
        <select className={field} value={v.jenjang ?? ""} onChange={(e) => set("jenjang", (e.target.value || null) as PlanFormData["jenjang"])}>
          <option value="">Semua jenjang</option>
          <option value="SD">SD</option>
          <option value="SMP">SMP</option>
          <option value="SMA">SMA</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-semibold">
        Urutan tampil (kecil = duluan)
        <input type="number" min={0} max={999} className={field} value={v.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value) || 0)} />
      </label>
      <label className="flex flex-col gap-1 text-xs font-semibold sm:col-span-2">
        Deskripsi (opsional, tampil di kartu siswa)
        <textarea
          rows={2}
          className="w-full rounded-md border border-input bg-card px-2.5 py-2 text-sm"
          value={v.description ?? ""}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Semua paket tes premium + Latihan Kelemahan"
        />
      </label>
      <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2">
        <input type="checkbox" checked={v.isActive} onChange={(e) => set("isActive", e.target.checked)} className="size-4" />
        Langsung dijual (tampil di halaman Langganan siswa)
      </label>
    </div>
  );
}

function useForm(initial: PlanFormData) {
  const [v, setV] = useState<PlanFormData>(initial);
  const set = <K extends keyof PlanFormData>(k: K, value: PlanFormData[K]) => setV((p) => ({ ...p, [k]: value }));
  return { v, setV, set };
}

/** Kartu paket yang sudah ada: ringkasan + edit di tempat + tombol jual/hentikan. */
export function PlanCard({ plan }: { plan: PlanCardData }) {
  const [editing, setEditing] = useState(false);
  const { v, setV, set } = useForm(plan);
  const { error, pending, save } = useSave();
  const formData = (p: PlanFormData): PlanFormData => ({ ...p, description: p.description?.trim() || null });

  return (
    <article className={cn("surface-card flex flex-col gap-4 p-5", plan.isActive ? "border-success/40" : "bg-muted/30 opacity-90")}>
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant={plan.isActive ? "success" : "muted"}>
          {plan.isActive ? <Eye aria-hidden /> : <EyeOff aria-hidden />} {plan.isActive ? "Dijual" : "Tidak dijual"}
        </Badge>
        {plan.isNew && (
          <Badge variant="warning">
            <Sparkles aria-hidden /> Baru
          </Badge>
        )}
        <Badge variant="info">{plan.jenjang ?? "Semua jenjang"}</Badge>
        {plan.isCheapest && <Badge variant="outline">Harga di landing & popup</Badge>}
      </div>

      {editing ? (
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            save(formData(v), () => setEditing(false));
          }}
        >
          <PlanFields v={v} set={set} />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : <Save aria-hidden />} Simpan
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setV(plan);
                setEditing(false);
              }}
            >
              <X aria-hidden /> Batal
            </Button>
          </div>
        </form>
      ) : (
        <>
          <div>
            <h3 className="text-lg font-bold">{plan.name}</h3>
            {plan.description && <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{plan.description}</p>}
          </div>
          <div>
            <span className="text-2xl font-extrabold tracking-tight">{formatRupiah(plan.price)}</span>
            <span className="ml-1 text-sm text-muted-foreground">/ {plan.durationDays ? `${plan.durationDays} hari` : "selamanya"}</span>
            {perDay(plan) && <p className="text-xs text-muted-foreground">± {perDay(plan)} per hari</p>}
          </div>
          {plan.isActive && plan.price < TEST_PLAN_MAX_PRICE && (
            <p className="flex gap-1.5 rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning-strong">
              <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
              Paket uji coba (di bawah {formatRupiah(TEST_PLAN_MAX_PRICE)}): masih bisa dibeli siswa, tetapi tidak dipakai sebagai harga di landing page &
              popup. Hentikan penjualannya bila uji sudah selesai.
            </p>
          )}
          <dl className="grid grid-cols-3 gap-2 rounded-lg bg-muted/50 p-3 text-center text-xs">
            <div>
              <dt className="text-muted-foreground">Terjual</dt>
              <dd className="text-base font-bold tabular-nums">{plan.sales.paid}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Pendapatan</dt>
              <dd className="text-sm font-bold tabular-nums">{formatRupiah(plan.sales.revenue)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Menunggu</dt>
              <dd className="text-base font-bold tabular-nums">{plan.sales.pending}</dd>
            </div>
          </dl>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="mt-auto flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              <Pencil aria-hidden /> Edit
            </Button>
            <Button
              size="sm"
              variant={plan.isActive ? "ghost" : "default"}
              disabled={pending}
              className={cn(plan.isActive && "text-muted-foreground hover:text-destructive")}
              onClick={() => {
                if (plan.isActive && !window.confirm(`Hentikan penjualan "${plan.name}"? Siswa tidak bisa membelinya lagi; Premium yang sudah aktif tetap berlaku.`)) return;
                save(formData({ ...plan, isActive: !plan.isActive }));
              }}
            >
              {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : plan.isActive ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
              {plan.isActive ? "Hentikan penjualan" : "Jual lagi"}
            </Button>
          </div>
        </>
      )}
    </article>
  );
}

/** Panel paket baru: form di kiri, pratinjau kartu (seperti di halaman siswa) di kanan. */
export function NewPlanPanel() {
  const { v, setV, set } = useForm(EMPTY);
  const { error, pending, save } = useSave();
  const [saved, setSaved] = useState<string | null>(null);

  return (
    <section aria-labelledby="paket-baru" className="rounded-2xl border-2 border-dashed border-primary/40 bg-primary-soft/40 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Plus className="size-5" aria-hidden />
        </span>
        <div>
          <h3 id="paket-baru" className="text-lg font-bold">
            Buat paket langganan baru
          </h3>
          <p className="text-sm text-muted-foreground">Isi data di kiri — pratinjau di kanan menunjukkan kartu yang akan dilihat siswa.</p>
        </div>
      </div>
      <div className="mt-5 grid gap-6 lg:grid-cols-[3fr_2fr]">
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            setSaved(null);
            save({ ...v, description: v.description?.trim() || null }, () => {
              setSaved(v.name);
              setV(EMPTY);
            });
          }}
        >
          <PlanFields v={v} set={set} />
          {error && <p className="text-xs text-destructive">{error}</p>}
          {saved && <p className="text-xs font-semibold text-success-strong">Paket &ldquo;{saved}&rdquo; dibuat — lihat di daftar paket di atas.</p>}
          <div>
            <Button type="submit" disabled={pending || v.name.trim().length < 3}>
              {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : <Plus aria-hidden />} Buat paket
            </Button>
          </div>
        </form>
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">Pratinjau di halaman siswa</p>
          <div className="surface-card flex flex-col gap-4 p-6 shadow-md">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-lg font-bold">{v.name.trim() || "Nama paket"}</h4>
                <Badge variant="info">{v.jenjang ?? "Semua jenjang"}</Badge>
              </div>
              {v.description?.trim() && <p className="mt-1 text-sm whitespace-pre-line text-muted-foreground">{v.description}</p>}
            </div>
            <div>
              <span className="text-3xl font-extrabold tracking-tight">{formatRupiah(v.price || 0)}</span>
              <span className="ml-1 text-sm text-muted-foreground">/ {v.durationDays ? `${v.durationDays} hari` : "selamanya"}</span>
              {perDay(v) && <p className="text-xs text-muted-foreground">± {perDay(v)} per hari</p>}
            </div>
            <span className="inline-flex h-9 items-center justify-center rounded-lg bg-cta text-sm font-semibold text-cta-foreground">Bayar sekarang</span>
          </div>
          {!v.isActive && <p className="text-xs text-muted-foreground">Tidak dijual — siswa belum melihat paket ini sampai diaktifkan.</p>}
        </div>
      </div>
    </section>
  );
}
