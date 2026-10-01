"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Jenjang } from "@/lib/jenjang";
import { setMyJenjangAction } from "@/server/actions/profile";
import { JenjangPicker } from "./jenjang-picker";

/** Simpan jenjang akun sendiri. `next` = arahkan ke sana setelah tersimpan (onboarding). */
export function JenjangForm({ current, next, submitLabel = "Simpan jenjang" }: { current: Jenjang | null; next?: string; submitLabel?: string }) {
  const router = useRouter();
  const [value, setValue] = useState<Jenjang | null>(current);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-3">
      <JenjangPicker
        value={value}
        onChange={(v) => {
          setValue(v);
          setSaved(false);
        }}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex items-center gap-3">
        <Button
          disabled={pending || !value || value === current}
          onClick={() =>
            startTransition(async () => {
              const r = await setMyJenjangAction(value!);
              if (!r.ok) return setError(r.error);
              setError(null);
              setSaved(true);
              if (next) router.replace(next);
              router.refresh();
            })
          }
        >
          {pending && <LoaderCircle className="animate-spin" aria-hidden />} {submitLabel}
        </Button>
        {saved && !next && (
          <span role="status" className="flex items-center gap-1.5 text-sm text-success-strong">
            <CircleCheck className="size-4" aria-hidden /> Tersimpan
          </span>
        )}
      </div>
    </div>
  );
}
