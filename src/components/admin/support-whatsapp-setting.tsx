"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPhone, whatsappLink } from "@/lib/identity";
import { setSupportWhatsappAction } from "@/server/actions/users";

/** No. WhatsApp admin untuk tombol "Hubungi Admin" di halaman Lupa kata sandi. */
export function SupportWhatsappSetting({ initial }: { initial: string }) {
  const router = useRouter();
  const [value, setValue] = useState(formatPhone(initial));
  const [saved, setSaved] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-col gap-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const r = await setSupportWhatsappAction(value);
          if (!r.ok) return setError(r.error);
          setSaved(r.phone);
          setValue(formatPhone(r.phone));
          setDone(true);
          router.refresh();
        });
      }}
    >
      <Label htmlFor="support-whatsapp" className="font-semibold">
        No. WhatsApp admin
      </Label>
      <p className="text-sm text-muted-foreground">
        Tampil sebagai tombol &ldquo;Hubungi Admin via WhatsApp&rdquo; di halaman Lupa kata sandi. Kosongkan untuk menyembunyikan tombol.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id="support-whatsapp"
          type="tel"
          inputMode="tel"
          value={value}
          placeholder="0812 3456 7890"
          aria-invalid={!!error}
          onChange={(e) => {
            setValue(e.target.value);
            setDone(false);
          }}
        />
        <Button type="submit" disabled={pending}>
          {pending && <LoaderCircle className="animate-spin" aria-hidden />} Simpan
        </Button>
      </div>
      {error ? (
        <p className="text-xs font-medium text-destructive">{error}</p>
      ) : done ? (
        <p role="status" className="flex items-center gap-1.5 text-xs text-success-strong">
          <CircleCheck className="size-3.5" aria-hidden /> {saved ? "Nomor tersimpan." : "Tombol WhatsApp disembunyikan."}
        </p>
      ) : null}
      {saved && (
        <a href={whatsappLink(saved)} target="_blank" rel="noreferrer" className="w-fit text-xs font-semibold text-primary hover:underline">
          Uji tautan wa.me/{saved}
        </a>
      )}
      <p className="text-xs text-muted-foreground">
        Sebelum mengatur ulang kata sandi siswa, pastikan permintaan datang dari No. HP yang tercatat di akunnya.
      </p>
    </form>
  );
}
