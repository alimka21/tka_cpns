"use client";

import { useState } from "react";
import { CircleAlert, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { stimulusInput } from "@/lib/validation/question";

const fieldClass =
  "w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-base focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15 focus-visible:outline-none";

export function StimulusForm() {
  const [errors, setErrors] = useState<string[]>([]);
  const [valid, setValid] = useState(false);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const parsed = stimulusInput.safeParse({ ...data, imageUrl: data.imageUrl || null });
    setErrors(parsed.success ? [] : parsed.error.issues.map((i) => i.message));
    setValid(parsed.success);
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4" onChange={() => setValid(false)}>
      <div className="grid gap-4 sm:grid-cols-[14rem_1fr]">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="stimulus-code" className="font-semibold">
            Kode
          </Label>
          <Input id="stimulus-code" name="code" placeholder="STM-SMP-BIND-002" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="stimulus-title" className="font-semibold">
            Judul
          </Label>
          <Input id="stimulus-title" name="title" placeholder="Judul bacaan / tabel / grafik" />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="stimulus-content" className="font-semibold">
          Isi stimulus
        </Label>
        <textarea
          id="stimulus-content"
          name="content"
          rows={6}
          placeholder="Teks bacaan, data, atau deskripsi. Rumus pakai KaTeX: $...$"
          className={fieldClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="stimulus-image" className="font-semibold">
          URL gambar <span className="font-normal text-muted-foreground">(opsional)</span>
        </Label>
        <Input id="stimulus-image" name="imageUrl" type="url" placeholder="https://…" />
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
          <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden /> Stimulus valid. Penyimpanan aktif setelah database tersambung.
        </p>
      )}
      <Button type="submit" className="w-fit">
        Validasi & simpan
      </Button>
    </form>
  );
}
