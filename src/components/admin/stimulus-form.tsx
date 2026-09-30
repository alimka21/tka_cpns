"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { stimulusInput } from "@/lib/validation/question";
import { createStimulusAction, updateStimulusAction } from "@/server/actions/questions";

export type StimulusEditData = { id: number; code: string; title: string; content: string; imageUrl: string | null; status: "draft" | "published" };

const fieldClass =
  "w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-base focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15 focus-visible:outline-none";

/** Tanpa `initial` = buat baru; dengan `initial` = edit (kode tidak bisa diubah). */
export function StimulusForm({ initial }: { initial?: StimulusEditData }) {
  const [errors, setErrors] = useState<string[]>([]);
  const [valid, setValid] = useState(false);
  const [saving, startSaving] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const payload = { ...data, code: initial?.code ?? data.code, imageUrl: data.imageUrl || null };
    const parsed = stimulusInput.safeParse(payload);
    setErrors(parsed.success ? [] : parsed.error.issues.map((i) => i.message));
    if (!parsed.success) return;
    startSaving(async () => {
      const result = initial ? await updateStimulusAction({ ...payload, id: initial.id }) : await createStimulusAction(payload);
      if (!result.ok) {
        setErrors(result.errors);
        return;
      }
      setValid(true);
      if (!initial) formRef.current?.reset();
      router.refresh();
    });
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="flex flex-col gap-4" onChange={() => setValid(false)}>
      <div className="grid gap-4 sm:grid-cols-[14rem_1fr]">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`stimulus-code-${initial?.id ?? "new"}`} className="font-semibold">
            Kode
          </Label>
          <Input id={`stimulus-code-${initial?.id ?? "new"}`} name="code" placeholder="STM-SMP-BIND-002" defaultValue={initial?.code} disabled={!!initial} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`stimulus-title-${initial?.id ?? "new"}`} className="font-semibold">
            Judul
          </Label>
          <Input id={`stimulus-title-${initial?.id ?? "new"}`} name="title" placeholder="Judul bacaan / tabel / grafik" defaultValue={initial?.title} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`stimulus-content-${initial?.id ?? "new"}`} className="font-semibold">
          Isi stimulus
        </Label>
        <textarea
          id={`stimulus-content-${initial?.id ?? "new"}`}
          name="content"
          rows={initial ? 10 : 6}
          defaultValue={initial?.content}
          placeholder="Teks bacaan, data, atau deskripsi. Rumus pakai KaTeX: $...$"
          className={fieldClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`stimulus-image-${initial?.id ?? "new"}`} className="font-semibold">
          URL gambar <span className="font-normal text-muted-foreground">(opsional)</span>
        </Label>
        <Input id={`stimulus-image-${initial?.id ?? "new"}`} name="imageUrl" placeholder="https://… atau /gambar/12" defaultValue={initial?.imageUrl ?? ""} />
      </div>
      <div className="flex flex-col gap-1.5 sm:max-w-xs">
        <Label htmlFor={`stimulus-status-${initial?.id ?? "new"}`} className="font-semibold">
          Status
        </Label>
        <select
          id={`stimulus-status-${initial?.id ?? "new"}`}
          name="status"
          defaultValue={initial?.status ?? "draft"}
          className="h-10 rounded-lg border border-input bg-card px-3 text-sm"
        >
          <option value="draft">Draft</option>
          <option value="published">Tayang</option>
        </select>
      </div>
      {errors.length > 0 && (
        <ul role="alert" className="flex flex-col gap-1 rounded-lg border border-destructive/40 bg-destructive-soft p-3 text-sm text-destructive">
          {errors.map((m) => (
            <li key={m} className="flex items-center gap-2">
              <CircleAlert className="size-4 shrink-0" aria-hidden /> {m}
            </li>
          ))}
        </ul>
      )}
      {valid && (
        <p role="status" className="flex gap-2 rounded-lg border border-success/40 bg-success-soft p-3 text-sm text-success-strong">
          <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden />{" "}
          {initial ? "Perubahan stimulus tersimpan." : "Stimulus tersimpan. Sekarang bisa dipilih di form Tambah Soal."}
        </p>
      )}
      <Button type="submit" className="w-fit" disabled={saving}>
        {saving ? "Menyimpan…" : initial ? "Simpan perubahan" : "Simpan stimulus"}
      </Button>
    </form>
  );
}
