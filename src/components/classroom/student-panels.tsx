"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { joinClassAction, leaveClassAction } from "@/server/actions/classroom";

type Msg = { ok: boolean; text: string } | null;

export function JoinClassForm({ initialCode = "", redirectTo }: { initialCode?: string; redirectTo?: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState<Msg>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const code = String(new FormData(form).get("code") ?? "");
        start(async () => {
          const r = await joinClassAction(code);
          setMsg(r.ok ? { ok: true, text: r.message ?? "Berhasil." } : { ok: false, text: r.error });
          if (!r.ok) return;
          if (redirectTo) router.push(redirectTo);
          else {
            form.reset();
            router.refresh();
          }
        });
      }}
    >
      <Label htmlFor="join-code">Kode kelas dari guru</Label>
      <div className="flex flex-wrap gap-2">
        <Input
          id="join-code"
          name="code"
          defaultValue={initialCode}
          required
          maxLength={10}
          autoComplete="off"
          placeholder="mis. K7M2QX"
          className="max-w-48 font-mono uppercase tracking-widest"
        />
        <Button type="submit" disabled={pending}>
          <LogIn aria-hidden /> {pending ? "Memproses…" : "Gabung kelas"}
        </Button>
      </div>
      {msg && (
        <p role="status" className={`text-sm ${msg.ok ? "text-success-strong" : "text-destructive"}`}>
          {msg.text}
        </p>
      )}
    </form>
  );
}

export function LeaveClassButton({ classId, name }: { classId: number; name: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={pending}
      onClick={() => {
        if (!confirm(`Keluar dari kelas ${name}? Guru tidak lagi bisa melihat progresmu.`)) return;
        start(async () => {
          await leaveClassAction(classId);
          router.refresh();
        });
      }}
    >
      <LogOut aria-hidden /> Keluar
    </Button>
  );
}
