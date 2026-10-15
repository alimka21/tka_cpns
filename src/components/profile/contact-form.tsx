"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPhone } from "@/lib/identity";
import { updateMyContactAction } from "@/server/actions/profile";

/** Ubah username & No. HP akun sendiri (dipakai untuk masuk & menerima kata sandi baru dari admin). */
export function ContactForm({ username: initialUsername, phone: initialPhone }: { username: string | null; phone: string | null }) {
  const router = useRouter();
  const [username, setUsername] = useState(initialUsername ?? "");
  const [phone, setPhone] = useState(formatPhone(initialPhone));
  const [saved, setSaved] = useState({ username: initialUsername ?? "", phone: formatPhone(initialPhone) });
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();
  const changed = username.trim().toLowerCase() !== saved.username || phone.trim() !== saved.phone;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const r = await updateMyContactAction({ username, phone });
          if (!r.ok) return setError(r.error);
          const next = { username: r.username, phone: formatPhone(r.phone) };
          setUsername(next.username);
          setPhone(next.phone);
          setSaved(next);
          setDone(true);
          router.refresh();
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={username}
            maxLength={20}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            placeholder={initialUsername ? undefined : "Buat username"}
            onChange={(e) => {
              setUsername(e.target.value);
              setDone(false);
            }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone">No. HP / WhatsApp</Label>
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            value={phone}
            autoComplete="tel"
            placeholder="Boleh nomor orang tua"
            onChange={(e) => {
              setPhone(e.target.value);
              setDone(false);
            }}
          />
        </div>
      </div>
      {error ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : done ? (
        <p role="status" className="flex items-center gap-1.5 text-xs text-success-strong">
          <CircleCheck className="size-3.5" aria-hidden /> Tersimpan.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Username &amp; No. HP bisa dipakai untuk masuk. Bila lupa kata sandi, admin mengirim kata sandi baru ke No. HP ini.
        </p>
      )}
      <Button type="submit" className="w-fit" disabled={pending || !changed}>
        {pending && <LoaderCircle className="animate-spin" aria-hidden />} Simpan username &amp; No. HP
      </Button>
    </form>
  );
}
