"use client";

import type { ExamAnswerState } from "@/lib/exam";
import { cn } from "@/lib/utils";

type Props = {
  questionIds: number[];
  answers: Record<number, ExamAnswerState | undefined>;
  currentIndex: number;
  onSelect: (index: number) => void;
};

export function QuestionNavigator({ questionIds, answers, currentIndex, onSelect }: Props) {
  return (
    <div>
      <div className="grid grid-cols-5 gap-2">
        {questionIds.map((id, i) => {
          const answer = answers[id];
          const answered = answer?.selectedOptionId != null;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(i)}
              aria-current={i === currentIndex ? "step" : undefined}
              aria-label={`Soal ${i + 1}${answered ? ", sudah dijawab" : ""}${answer?.isFlagged ? ", ragu-ragu" : ""}`}
              className={cn(
                "h-9 rounded-md border text-sm font-medium tabular-nums transition-colors hover:bg-muted",
                answered && "border-primary bg-primary text-primary-foreground hover:bg-primary/80",
                answer?.isFlagged && "border-amber-500 bg-amber-400 text-amber-950 hover:bg-amber-400/80",
                i === currentIndex && "ring-2 ring-ring ring-offset-2 ring-offset-background",
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
      <ul className="mt-4 flex flex-col gap-1.5 text-xs text-muted-foreground">
        <li className="flex items-center gap-2">
          <span className="size-3 rounded-sm bg-primary" /> Sudah dijawab
        </li>
        <li className="flex items-center gap-2">
          <span className="size-3 rounded-sm bg-amber-400" /> Ragu-ragu
        </li>
        <li className="flex items-center gap-2">
          <span className="size-3 rounded-sm border" /> Belum dijawab
        </li>
      </ul>
    </div>
  );
}
