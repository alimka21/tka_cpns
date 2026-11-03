"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Lock, LockOpen, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { formatDate } from "@/lib/format";
import { setLeadMagnetActiveAction } from "@/server/actions/lead-magnets";
import type { LeadMagnetAdminRow } from "@/server/services/lead-magnets";

export function LeadMagnetList({ rows }: { rows: LeadMagnetAdminRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(id: number, isActive: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await setLeadMagnetActiveAction({ id, isActive });
      if (!result.ok) setError(result.error);
      router.refresh();
    });
  }

  if (rows.length === 0) {
    return <p className="surface-card px-6 py-12 text-center text-sm text-muted-foreground">Belum ada materi. Buat lewat tombol &ldquo;Materi baru&rdquo;.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive-soft p-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <ul className="flex flex-col gap-3">
        {rows.map((r) => (
          <li key={r.id} className="surface-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{r.title}</span>
                {!r.isActive && <Badge variant="muted">Nonaktif</Badge>}
                <Badge variant="outline">
                  {r.requiresLogin ? <Lock aria-hidden /> : <LockOpen aria-hidden />} {r.requiresLogin ? "Wajib login" : "Bebas unduh"}
                </Badge>
              </div>
              <p className="break-all text-xs text-muted-foreground">
                /materi/{r.slug} · {Math.ceil(r.fileSize / 1024)} KB · {r.downloads} unduhan · diperbarui {formatDate(r.updatedAt)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Switch checked={r.isActive} disabled={pending} onCheckedChange={(v) => toggle(r.id, v)} label={`Aktifkan ${r.title}`} />
              <Button variant="ghost" size="sm" nativeButton={false} render={<a href={`/materi/${r.slug}`} target="_blank" rel="noreferrer" />}>
                <ExternalLink aria-hidden /> Lihat
              </Button>
              <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/admin/materi/${r.id}`} />}>
                <Pencil aria-hidden /> Ubah
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
