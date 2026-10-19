"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, LogOut } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

/** Tombol "Keluar" dengan konfirmasi dulu (admin & siswa) — mencegah keluar tak sengaja. */
export function SignOutButton({ className, withLabel = true }: { className?: string; withLabel?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    await authClient.signOut();
    router.replace("/masuk");
    router.refresh();
  }

  return (
    <AlertDialog open={open} onOpenChange={(o) => !pending && setOpen(o)}>
      <AlertDialogTrigger
        render={
          <button
            type="button"
            aria-label="Keluar"
            title="Keluar"
            className={cn(
              "flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/25 focus-visible:outline-none",
              className,
            )}
          />
        }
      >
        <LogOut className="size-4" aria-hidden />
        {withLabel && <span>Keluar</span>}
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive-soft text-destructive">
            <LogOut aria-hidden />
          </AlertDialogMedia>
          <AlertDialogTitle>Apakah Anda ingin keluar?</AlertDialogTitle>
          <AlertDialogDescription>Anda perlu masuk lagi untuk menggunakan akun ini.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            className="bg-destructive text-white hover:bg-destructive/90"
            onClick={(e) => {
              e.preventDefault();
              void signOut();
            }}
          >
            {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : <LogOut aria-hidden />}
            {pending ? "Keluar…" : "Ya, keluar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
