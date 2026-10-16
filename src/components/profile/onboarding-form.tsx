"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Phone, School } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Jenjang } from "@/lib/jenjang";
import { completeMyProfileAction } from "@/server/actions/profile";
import { JenjangPicker } from "./jenjang-picker";
import { ProvinceSelect } from "./province-select";

/** Lengkapi profil setelah daftar lewat Google: jenjang + provinsi + sekolah + No. HP (semua wajib). */
export function OnboardingForm({ next, initialPhone }: { next: string; initialPhone: string }) {
  const router = useRouter();
  const [jenjang, setJenjang] = useState<Jenjang | null>(null);
  const [province, setProvince] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [phone, setPhone] = useState(initialPhone);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!jenjang) return setError("Pilih jenjang SD, SMP, atau SMA.");
        startTransition(async () => {
          const r = await completeMyProfileAction({ jenjang, province: province as never, schoolName, phone });
          if (!r.ok) return setError(r.error);
          router.replace(next);
          router.refresh();
        });
      }}
    >
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">Jenjang</span>
        <JenjangPicker value={jenjang} onChange={setJenjang} />
        <p className="text-xs text-muted-foreground">Setelah tersimpan, jenjang hanya bisa diganti oleh admin.</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="province" className="text-sm font-semibold">
          Asal provinsi
        </Label>
        <ProvinceSelect id="province" value={province} onChange={setProvince} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="schoolName" className="text-sm font-semibold">
          Nama sekolah
        </Label>
        <div className="relative">
          <School className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input id="schoolName" value={schoolName} maxLength={150} placeholder="Contoh: SMP Negeri 1 Bandung" className="pl-10" onChange={(e) => setSchoolName(e.target.value)} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone" className="text-sm font-semibold">
          No. HP / WhatsApp
        </Label>
        <div className="relative">
          <Phone className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input id="phone" type="tel" inputMode="tel" value={phone} placeholder="0812 3456 7890" className="pl-10" onChange={(e) => setPhone(e.target.value)} />
        </div>
        <p className="text-xs text-muted-foreground">Boleh nomor orang tua. Dipakai admin untuk mengirim kata sandi baru bila kamu lupa.</p>
      </div>
      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending}>
        {pending && <LoaderCircle className="animate-spin" aria-hidden />} Simpan & lanjut
      </Button>
    </form>
  );
}
