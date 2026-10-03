"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, LoaderCircle, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateQuestionStatusAction } from "@/server/actions/questions";

/** Setujui (terbitkan) satu soal dari pratinjau paket, atau kembalikan ke tinjauan. */
export function ApproveQuestionButton({ id, published }: { id: number; published: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="flex flex-col gap-1">
      <Button
        size="sm"
        variant={published ? "ghost" : "default"}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const r = await updateQuestionStatusAction({ id, status: published ? "pending_review" : "published" });
            if (!r.ok) return setError(r.errors[0]);
            setError(null);
            router.refresh();
          })
        }
      >
        {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : published ? <Undo2 aria-hidden /> : <CircleCheck aria-hidden />}
        {published ? "Kembalikan ke tinjauan" : "Setujui soal"}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </span>
  );
}
