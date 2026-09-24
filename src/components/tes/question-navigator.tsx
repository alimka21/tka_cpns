"use client";

import { Flag } from "lucide-react";
import type { ExamAnswerState } from "@/lib/exam";
import { cn } from "@/lib/utils";

type Props = {
  questionIds: number[];
  answers: Record<number, ExamAnswerState | undefined>;
  currentIndex: number;
  onSelect: (index: number) => void;
};

// Warna status sesuai docs/UI_UX.md §3: terjawab = solid biru, ragu-ragu =
// solid amber (teks gelap demi kontras), belum = outline abu.
export function QuestionNavigator({ questionIds, answers, currentIndex, onSelect }: Props) {
  const answeredCount = questionIds.filter((id) => answers[id]?.selectedOptionId != null).length;
  const flaggedCount = questionIds.filter((id) => answers[id]?.isFlagged).length;

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-3 gap-2 text-center">
        <Count label="Dijawab" value={answeredCount} className="bg-primary-soft text-primary" />
        <Count label="Ragu-ragu" value={flaggedCount} className="bg-warning-soft text-warning-strong" />
        <Count label="Belum" value={questionIds.length - answeredCount} className="bg-muted text-muted-foreground" />
      </dl>

      <div className="grid grid-cols-5 gap-2">
        {questionIds.map((id, i) => {
          const answer = answers[id];
          const answered = answer?.selectedOptionId != null;
          const flagged = answer?.isFlagged ?? false;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(i)}
              aria-current={i === currentIndex ? "step" : undefined}
              aria-label={`Soal ${i + 1}${answered ? ", sudah dijawab" : ", belum dijawab"}${flagged ? ", ragu-ragu" : ""}`}
              className={cn(
                "relative flex h-11 items-center justify-center rounded-lg border border-input bg-background text-sm font-semibold text-muted-foreground tabular-nums transition-colors hover:border-primary/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/25",
                answered && "border-primary bg-primary text-primary-foreground hover:bg-primary-hover hover:text-primary-foreground",
                flagged && "border-cta bg-cta text-cta-foreground hover:bg-cta-hover hover:text-cta-foreground",
                i === currentIndex && "ring-2 ring-primary ring-offset-2 ring-offset-card",
              )}
            >
              {i + 1}
              {flagged && <Flag className="absolute top-0.5 right-0.5 size-3" aria-hidden />}
            </button>
          );
        })}
      </div>

      <ul className="flex flex-col gap-1.5 text-xs text-muted-foreground">
        <li className="flex items-center gap-2">
          <span className="size-3.5 rounded bg-primary" aria-hidden /> Sudah dijawab
        </li>
        <li className="flex items-center gap-2">
          <span className="flex size-3.5 items-center justify-center rounded bg-cta" aria-hidden>
            <Flag className="size-2.5 text-cta-foreground" />
          </span>
          Ragu-ragu
        </li>
        <li className="flex items-center gap-2">
          <span className="size-3.5 rounded border border-input bg-background" aria-hidden /> Belum dijawab
        </li>
      </ul>
    </div>
  );
}

function Count({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className={cn("flex flex-col-reverse rounded-lg px-2 py-2", className)}>
      <dt className="text-[11px] font-semibold">{label}</dt>
      <dd className="text-lg font-bold tabular-nums">{value}</dd>
    </div>
  );
}
