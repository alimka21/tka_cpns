"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolveReportsAction } from "@/server/actions/question-reports";

export function ResolveReportButton({ target }: { target: { questionId: number } | { practiceQuestionId: number } }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="flex items-center gap-2">
      {error && <span className="text-xs text-destructive">{error}</span>}
      <Button
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const r = await resolveReportsAction(target);
            if (!r.ok) setError(r.error);
            else router.refresh();
          })
        }
      >
        <CircleCheck aria-hidden /> {pending ? "Menyimpan…" : "Tandai selesai"}
      </Button>
    </span>
  );
}
