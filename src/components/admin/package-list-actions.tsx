"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send, Trash2, Undo2 } from "lucide-react";
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
import { deletePackageAction, updatePackageStatusAction } from "@/server/actions/packages";

export function PackageStatusButton({ id, status }: { id: number; status: "draft" | "published" }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const next = status === "published" ? "draft" : "published";

  return (
    <span className="flex flex-col items-end gap-1">
      <Button
        variant={next === "published" ? "default" : "outline"}
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await updatePackageStatusAction({ id, status: next });
            if (!result.ok) setError(result.errors[0]);
            else {
              setError(null);
              router.refresh();
            }
          })
        }
      >
        {next === "published" ? <Send aria-hidden /> : <Undo2 aria-hidden />}
        {pending ? "Menyimpan…" : next === "published" ? "Terbitkan" : "Jadikan draft"}
      </Button>
      {error && <span className="max-w-48 text-right text-xs text-destructive">{error}</span>}
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
