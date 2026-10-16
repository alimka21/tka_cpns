"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateMySchoolAction } from "@/server/actions/profile";
import { ProvinceSelect } from "./province-select";

/** Ubah provinsi asal & nama sekolah akun sendiri. */
export function SchoolForm({ province: initialProvince, schoolName: initialSchool }: { province: string | null; schoolName: string | null }) {
  const router = useRouter();
  const [province, setProvince] = useState(initialProvince ?? "");
  const [schoolName, setSchoolName] = useState(initialSchool ?? "");
  const [saved, setSaved] = useState({ province: initialProvince ?? "", schoolName: initialSchool ?? "" });
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();
  const changed = province !== saved.province || schoolName.trim() !== saved.schoolName;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const r = await updateMySchoolAction({ province: province as never, schoolName });
          if (!r.ok) return setError(r.error);
          setSaved({ province, schoolName: schoolName.trim().replace(/\s+/g, " ") });
          setDone(true);
          router.refresh();
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="province">Asal provinsi</Label>
          <ProvinceSelect
            id="province"
            value={province}
            onChange={(v) => {
              setProvince(v);
              setDone(false);
            }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="schoolName">Nama sekolah</Label>
          <Input
            id="schoolName"
            value={schoolName}
            maxLength={150}
            placeholder="Contoh: SMP Negeri 1 Bandung"
            onChange={(e) => {
              setSchoolName(e.target.value);
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
      ) : null}
      <Button type="submit" className="w-fit" disabled={pending || !changed}>
        {pending && <LoaderCircle className="animate-spin" aria-hidden />} Simpan provinsi &amp; sekolah
      </Button>
    </form>
  );
}
