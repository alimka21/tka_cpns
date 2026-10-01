"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { setRequireApprovalAction } from "@/server/actions/users";

export function ApprovalSetting({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold">Pendaftar baru harus dikonfirmasi admin</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {value
              ? "Aktif — akun siswa baru berstatus “Menunggu” dan belum bisa memakai aplikasi sampai disetujui di Manajemen User."
              : "Nonaktif — akun siswa baru langsung aktif setelah mendaftar."}
          </p>
        </div>
        <Switch
          checked={value}
          disabled={pending}
          label="Wajib konfirmasi pendaftar"
          onCheckedChange={(next) => {
            setValue(next);
            setError(null);
            startTransition(async () => {
              const r = await setRequireApprovalAction(next);
              if (!r.ok) {
                setValue(!next);
                setError(r.error);
              } else router.refresh();
            });
          }}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">Berlaku untuk pendaftar berikutnya; akun yang sudah ada tidak berubah.</p>
    </div>
  );
}
