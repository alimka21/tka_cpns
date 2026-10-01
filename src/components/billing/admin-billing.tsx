"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Plus, Save, UserPlus, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { grantMembershipAction, revokeMembershipAction, savePlanAction } from "@/server/actions/billing";

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

const field = "h-9 w-full rounded-md border border-input bg-card px-2.5 text-sm";

function useAction() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) =>
    start(async () => {
      const r = await fn();
      if (!r.ok) {
        setError(r.error ?? "Gagal.");
        setDone(false);
      } else {
        setError(null);
        setDone(true);
        after?.();
        router.refresh();
      }
    });
  return { error, done, pending, run };
}

/** Form satu paket langganan (baru bila tanpa id). */
export function PlanForm({ plan }: { plan?: PlanFormData }) {
  const empty: PlanFormData = { name: "", description: "", jenjang: null, price: 49000, durationDays: 30, isActive: true, sortOrder: 0 };
  const [v, setV] = useState<PlanFormData>(plan ?? empty);
  const { error, done, pending, run } = useAction();
  const set = <K extends keyof PlanFormData>(k: K, value: PlanFormData[K]) => setV((p) => ({ ...p, [k]: value }));

  return (
    <form
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => savePlanAction(v), () => !plan && setV(empty));
      }}
    >
      <label className="flex flex-col gap-1 text-xs font-semibold">
        Nama paket
        <Input value={v.name} onChange={(e) => set("name", e.target.value)} placeholder="Premium SMP 30 hari" className="h-9" />
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
        Harga (Rp)
        <input type="number" min={1000} step={500} className={field} value={v.price} onChange={(e) => set("price", Number(e.target.value))} />
      </label>
      <label className="flex flex-col gap-1 text-xs font-semibold">
        Durasi (hari, kosong = selamanya)
        <input
          type="number"
          min={1}
          className={field}
          value={v.durationDays ?? ""}
          onChange={(e) => set("durationDays", e.target.value ? Number(e.target.value) : null)}
        />
      </label>
      <div className="flex items-end gap-3">
        <label className="flex h-9 items-center gap-1.5 text-xs font-semibold whitespace-nowrap">
          <input type="checkbox" checked={v.isActive} onChange={(e) => set("isActive", e.target.checked)} /> Dijual
        </label>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : plan ? <Save aria-hidden /> : <Plus aria-hidden />}
          {plan ? "Simpan" : "Tambah"}
        </Button>
      </div>
      <label className="flex flex-col gap-1 text-xs font-semibold sm:col-span-2 lg:col-span-5">
        Deskripsi (opsional)
        <Input value={v.description ?? ""} onChange={(e) => set("description", e.target.value)} placeholder="Semua paket tes premium + Latihan Kelemahan" className="h-9" />
      </label>
      {(error || done) && (
        <p className={`text-xs sm:col-span-2 lg:col-span-5 ${error ? "text-destructive" : "text-success-strong"}`}>{error ?? "Tersimpan."}</p>
      )}
    </form>
  );
}

export function GrantMembershipForm() {
  const [email, setEmail] = useState("");
  const [jenjang, setJenjang] = useState<"" | "SD" | "SMP" | "SMA">("");
  const [days, setDays] = useState<string>("30");
  const { error, done, pending, run } = useAction();
  return (
    <form
      className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => grantMembershipAction({ email, jenjang: jenjang || null, durationDays: days ? Number(days) : null }), () => setEmail(""));
      }}
    >
      <label className="flex flex-col gap-1 text-xs font-semibold">
        Email siswa
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="siswa@email.com" className="h-9" />
      </label>
      <label className="flex flex-col gap-1 text-xs font-semibold">
        Jenjang
        <select className={field} value={jenjang} onChange={(e) => setJenjang(e.target.value as typeof jenjang)}>
          <option value="">Semua jenjang</option>
          <option value="SD">SD</option>
          <option value="SMP">SMP</option>
          <option value="SMA">SMA</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-semibold">
        Durasi (hari, kosong = selamanya)
        <input type="number" min={1} className={field} value={days} onChange={(e) => setDays(e.target.value)} />
      </label>
      <Button type="submit" size="sm" disabled={pending || !email}>
        <UserPlus aria-hidden /> Beri Premium
      </Button>
      {(error || done) && <p className={`text-xs sm:col-span-4 ${error ? "text-destructive" : "text-success-strong"}`}>{error ?? "Premium diberikan."}</p>}
    </form>
  );
}

export function RevokeMembershipButton({ id }: { id: number }) {
  const { pending, run } = useAction();
  return (
    <Button
      size="xs"
      variant="ghost"
      disabled={pending}
      className="text-muted-foreground hover:text-destructive"
      onClick={() => window.confirm("Cabut Premium ini?") && run(() => revokeMembershipAction(id))}
    >
      <XCircle aria-hidden /> Cabut
    </Button>
  );
}
