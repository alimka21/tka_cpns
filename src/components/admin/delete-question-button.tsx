"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
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
import { deleteQuestionAction } from "@/server/actions/questions";

/** `disabledReason` terisi = soal tidak boleh dihapus (server tetap memeriksa ulang). */
export function DeleteQuestionButton({ id, disabledReason }: { id: number; disabledReason: string | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (disabledReason) {
    return (
      <span className="flex flex-col items-end gap-1">
        <Button variant="outline" disabled>
          <Trash2 aria-hidden /> Hapus soal
        </Button>
        <span className="max-w-60 text-right text-xs text-muted-foreground">{disabledReason}</span>
      </span>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button variant="outline" className="text-destructive hover:text-destructive">
            <Trash2 aria-hidden /> Hapus soal
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus soal #{id}?</AlertDialogTitle>
          <AlertDialogDescription>
            Soal beserta opsi dan pembahasannya dihapus permanen. Tindakan ini tidak bisa dibatalkan.
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
                const result = await deleteQuestionAction(id);
                if (!result.ok) setError(result.errors[0]);
                else router.push("/admin/soal");
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
