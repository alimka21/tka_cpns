"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateMyNameAction } from "@/server/actions/profile";

/** Ubah nama tampilan akun sendiri. */
export function NameForm({ current }: { current: string }) {
  const router = useRouter();
  const [name, setName] = useState(current);
  const [saved, setSaved] = useState(current);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();
  const changed = name.trim().replace(/\s+/g, " ") !== saved;

  return (
    <form
      className="flex flex-col gap-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const r = await updateMyNameAction(name);
          if (!r.ok) return setError(r.error);
          setName(r.name);
          setSaved(r.name);
          setDone(true);
          router.refresh();
        });
      }}
    >
      <Label htmlFor="name">Nama tampilan</Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id="name"
          value={name}
          maxLength={100}
          autoComplete="name"
          aria-invalid={!!error}
          aria-describedby={error ? "name-error" : undefined}
          onChange={(e) => {
            setName(e.target.value);
            setDone(false);
          }}
        />
        <Button type="submit" disabled={pending || !changed} className="sm:w-auto">
          {pending && <LoaderCircle className="animate-spin" aria-hidden />} Simpan nama
        </Button>
      </div>
      {error ? (
        <p id="name-error" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : done ? (
        <p role="status" className="flex items-center gap-1.5 text-xs text-success-strong">
          <CircleCheck className="size-3.5" aria-hidden /> Nama tersimpan.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">Ditampilkan di header, riwayat, dan laporan.</p>
      )}
    </form>
  );
}
