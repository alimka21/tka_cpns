"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changeMyPasswordAction } from "@/server/actions/profile";

/**
 * Ganti kata sandi. Akun yang daftar lewat Google (belum punya kata sandi)
 * melihat versi "buat kata sandi" tanpa kolom kata sandi saat ini.
 */
export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<"change" | "create">(hasPassword ? "change" : "create");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [revokeOthers, setRevokeOthers] = useState(true);
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isChange = mode === "change";
  const mismatch = confirm.length > 0 && confirm !== next;
  const canSubmit = (!isChange || current.length > 0) && next.length >= 8 && confirm === next;

  const type = show ? "text" : "password";
  const clearStatus = () => {
    setError(null);
    setDone(null);
  };

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        clearStatus();
        if (next !== confirm) return setError("Konfirmasi kata sandi tidak sama.");
        startTransition(async () => {
          const r = await changeMyPasswordAction({
            currentPassword: isChange ? current : "",
            newPassword: next,
            revokeOtherSessions: isChange && revokeOthers,
          });
          if (!r.ok) return setError(r.error);
          setCurrent("");
          setNext("");
          setConfirm("");
          setMode("change");
          setDone(
            r.created
              ? "Kata sandi dibuat. Sekarang kamu juga bisa masuk dengan email dan kata sandi."
              : "Kata sandi diganti.",
          );
          router.refresh();
        });
      }}
    >
      {!isChange && (
        <p className="text-sm text-muted-foreground">
          Akunmu masuk lewat Google dan belum punya kata sandi. Buat kata sandi supaya bisa juga masuk dengan email.
        </p>
      )}

      {isChange && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="current-password">Kata sandi saat ini</Label>
          <Input
            id="current-password"
            type={type}
            value={current}
            maxLength={128}
            autoComplete="current-password"
            onChange={(e) => {
              setCurrent(e.target.value);
              clearStatus();
            }}
          />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-password">Kata sandi baru</Label>
          <Input
            id="new-password"
            type={type}
            value={next}
            maxLength={128}
            autoComplete="new-password"
            aria-describedby="new-password-hint"
            onChange={(e) => {
              setNext(e.target.value);
              clearStatus();
            }}
          />
          <p id="new-password-hint" className="text-xs text-muted-foreground">
            Minimal 8 karakter.
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirm-password">Ulangi kata sandi baru</Label>
          <Input
            id="confirm-password"
            type={type}
            value={confirm}
            maxLength={128}
            autoComplete="new-password"
            aria-invalid={mismatch}
            aria-describedby={mismatch ? "confirm-password-error" : undefined}
            onChange={(e) => {
              setConfirm(e.target.value);
              clearStatus();
            }}
          />
          {mismatch && (
            <p id="confirm-password-error" className="text-xs font-medium text-destructive">
              Belum sama dengan kata sandi baru.
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 text-sm">
        <label className="flex w-fit cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            className="size-4 accent-[var(--primary)]"
            checked={show}
            onChange={(e) => setShow(e.target.checked)}
          />
          {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />} Tampilkan kata sandi
        </label>
        {isChange && (
          <label className="flex w-fit cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              className="size-4 accent-[var(--primary)]"
              checked={revokeOthers}
              onChange={(e) => setRevokeOthers(e.target.checked)}
            />
            Keluarkan akun ini dari perangkat lain
          </label>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Button type="submit" disabled={pending || !canSubmit} className="w-fit">
          {pending && <LoaderCircle className="animate-spin" aria-hidden />} {isChange ? "Ganti kata sandi" : "Buat kata sandi"}
        </Button>
        {error ? (
          <p role="alert" className="text-xs font-medium text-destructive">
            {error}
          </p>
        ) : (
          done && (
            <p role="status" className="flex items-center gap-1.5 text-xs text-success-strong">
              <CircleCheck className="size-3.5" aria-hidden /> {done}
            </p>
          )
        )}
      </div>
    </form>
  );
}
