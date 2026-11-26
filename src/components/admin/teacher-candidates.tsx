"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HandCoins, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { whatsappLink } from "@/lib/identity";
import { addAffiliateAction } from "@/server/actions/affiliates";

type Row = { id: number; name: string; email: string; phone: string | null; school: string | null; createdAt: string; classCount: number; studentCount: number };

/** Guru yang mengaktifkan akun guru sendiri — admin bisa menghubungi lalu menjadikannya afiliasi. */
export function TeacherCandidates({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">Belum ada guru yang mendaftar sendiri.</p>;
  return (
    <div className="flex flex-col gap-2">
      <ul className="divide-y text-sm">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="font-semibold">{r.name}</p>
              <p className="text-xs text-muted-foreground">
                {r.school ?? "-"} · {r.classCount} kelas · {r.studentCount} siswa · sejak {formatDate(r.createdAt)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {r.phone && (
                <Button
                  size="sm"
                  variant="outline"
                  nativeButton={false}
                  render={<a href={whatsappLink(r.phone, `Halo ${r.name}, kami dari admin Pakar TKA. `)} target="_blank" rel="noreferrer" />}
                >
                  <MessageCircle aria-hidden /> WhatsApp
                </Button>
              )}
              <Button
                size="sm"
                disabled={pending}
                onClick={() => {
                  if (!confirm(`Jadikan ${r.name} guru afiliasi? Ia langsung mendapat kode afiliasi dan Premium gratis.`)) return;
                  start(async () => {
                    const res = await addAffiliateAction({ email: r.email, name: r.name, school: r.school ?? "", phone: r.phone ?? "" });
                    setMsg(res.ok ? { ok: true, text: `${r.name} sekarang guru afiliasi.` } : { ok: false, text: res.error });
                    if (res.ok) router.refresh();
                  });
                }}
              >
                <HandCoins aria-hidden /> Jadikan afiliasi
              </Button>
            </div>
          </li>
        ))}
      </ul>
      {msg && <p className={`text-sm ${msg.ok ? "text-success-strong" : "text-destructive"}`}>{msg.text}</p>}
    </div>
  );
}
