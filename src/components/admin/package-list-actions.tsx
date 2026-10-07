"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Crown, Gift, Send, Trash2, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deletePackageAction, setPackagePremiumAction, updatePackageStatusAction } from "@/server/actions/packages";

export function PackageStatusButton({ id, status }: { id: number; status: "draft" | "published" }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  /** Jumlah soal belum tayang → tampilkan konfirmasi terbit sekaligus. */
  const [unpublished, setUnpublished] = useState<number | null>(null);
  const next = status === "published" ? "draft" : "published";

  const run = (publishQuestions: boolean) =>
    startTransition(async () => {
      const result = await updatePackageStatusAction({ id, status: next, publishQuestions });
      if (result.ok) {
        setError(null);
        setUnpublished(null);
        router.refresh();
      } else if (result.unpublishedCount) {
        setError(null);
        setUnpublished(result.unpublishedCount);
      } else {
        setUnpublished(null);
        setError(result.errors[0]);
      }
    });

  return (
    <span className="flex flex-col items-end gap-1">
      <Button variant={next === "published" ? "default" : "outline"} size="sm" disabled={pending} onClick={() => run(false)}>
        {next === "published" ? <Send aria-hidden /> : <Undo2 aria-hidden />}
        {pending ? "Menyimpan…" : next === "published" ? "Terbitkan" : "Jadikan draft"}
      </Button>
      {error && <span className="max-w-48 text-right text-xs text-destructive">{error}</span>}
      <AlertDialog open={unpublished != null} onOpenChange={(open) => !open && setUnpublished(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terbitkan paket beserta {unpublished} soalnya?</AlertDialogTitle>
            <AlertDialogDescription>
              Paket ini sudah memenuhi aturan, tetapi {unpublished} soal di dalamnya belum tayang (draf atau menunggu
              tinjauan). Soal-soal itu akan ikut diterbitkan sehingga bisa dikerjakan siswa. Pastikan kunci jawaban dan
              pembahasannya sudah kamu periksa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={(e) => {
                e.preventDefault();
                run(true);
              }}
            >
              {pending ? "Menerbitkan…" : `Terbitkan paket + ${unpublished} soal`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </span>
  );
}

export function DeletePackageButton({ id, title }: { id: number; title: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Hapus ${title}`} className="text-muted-foreground hover:text-destructive"><Trash2 aria-hidden /></Button>} />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus paket ini?</AlertDialogTitle>
          <AlertDialogDescription>
            &ldquo;{title}&rdquo; akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
            {error && <span className="mt-2 block font-semibold text-destructive">{error}</span>}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={(e) => {
              e.preventDefault();
              startTransition(async () => {
                const result = await deletePackageAction(id);
                if (!result.ok) setError(result.errors[0]);
                else router.refresh();
              });
            }}
          >
            {pending ? "Menghapus…" : "Hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Pilih akses paket langsung dari daftar: Gratis | Premium (tersimpan seketika). */
export function PackageAccessToggle({ id, isPremium, title }: { id: number; isPremium: boolean; title: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(isPremium);
  const [error, setError] = useState<string | null>(null);

  const choose = (premium: boolean) => {
    if (premium === value || pending) return;
    const before = value;
    setValue(premium);
    startTransition(async () => {
      const r = await setPackagePremiumAction({ id, isPremium: premium });
      if (!r.ok) {
        setValue(before);
        setError(r.errors[0]);
      } else {
        setError(null);
        router.refresh();
      }
    });
  };

  const option = (premium: boolean) => (
    <button
      type="button"
      aria-pressed={value === premium}
      disabled={pending}
      onClick={() => choose(premium)}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:ring-3 focus-visible:ring-ring/25 focus-visible:outline-none disabled:opacity-60",
        value === premium
          ? premium
            ? "bg-cta text-cta-foreground"
            : "bg-success-strong text-white"
          : "bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {premium ? <Crown className="size-3.5" aria-hidden /> : <Gift className="size-3.5" aria-hidden />}
      {premium ? "Premium" : "Gratis"}
    </button>
  );

  return (
    <span className="flex flex-col items-end gap-1">
      <span role="group" aria-label={`Akses paket ${title}`} className="inline-flex overflow-hidden rounded-lg border divide-x">
        {option(false)}
        {option(true)}
      </span>
      {error && <span className="max-w-48 text-right text-xs text-destructive">{error}</span>}
    </span>
  );
}
