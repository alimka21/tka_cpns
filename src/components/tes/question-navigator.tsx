"use client";

import { Flag } from "lucide-react";
import { answerStatus, type ExamAnswerState, type ExamQuestion } from "@/lib/exam";
import { cn } from "@/lib/utils";

type Props = {
  questions: ExamQuestion[];
  answers: Record<number, ExamAnswerState | undefined>;
  currentIndex: number;
  onSelect: (index: number) => void;
};

// Warna status sesuai docs/UI_UX.md §3: terjawab = solid biru, ragu-ragu =
// solid amber (teks gelap demi kontras), belum lengkap = outline putus-putus
// biru, belum = outline abu. Soal grup stimulus diberi garis bawah kecil.
export function QuestionNavigator({ questions, answers, currentIndex, onSelect }: Props) {
  const statuses = questions.map((q) => answerStatus(q, answers[q.id]?.response));
  const completeCount = statuses.filter((s) => s === "complete").length;
  const partialCount = statuses.filter((s) => s === "partial").length;
  const flaggedCount = questions.filter((q) => answers[q.id]?.isFlagged).length;
  const hasGroups = questions.some((q) => q.stimulusId != null);

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-3 gap-2 text-center">
        <Count label="Dijawab" value={completeCount} className="bg-primary-soft text-primary" />
        <Count label="Ragu-ragu" value={flaggedCount} className="bg-warning-soft text-warning-strong" />
        <Count label="Belum" value={questions.length - completeCount} className="bg-muted text-muted-foreground" />
      </dl>

      <div className="grid grid-cols-5 gap-2">
        {questions.map((q, i) => {
          const status = statuses[i];
          const flagged = answers[q.id]?.isFlagged ?? false;
          const grouped = q.stimulusId != null;
          const statusText = { complete: ", sudah dijawab", partial: ", belum lengkap", blank: ", belum dijawab" }[status];
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => onSelect(i)}
              aria-current={i === currentIndex ? "step" : undefined}
              aria-label={`Soal ${i + 1}${statusText}${flagged ? ", ragu-ragu" : ""}${grouped ? ", soal grup stimulus" : ""}`}
              className={cn(
                "relative flex h-11 items-center justify-center rounded-lg border border-input bg-background text-sm font-semibold text-muted-foreground tabular-nums transition-colors hover:border-primary/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/25",
                status === "partial" && "border-dashed border-primary bg-primary-soft text-primary",
                status === "complete" && "border-primary bg-primary text-primary-foreground hover:bg-primary-hover hover:text-primary-foreground",
                flagged && "border-solid border-cta bg-cta text-cta-foreground hover:bg-cta-hover hover:text-cta-foreground",
                i === currentIndex && "ring-2 ring-primary ring-offset-2 ring-offset-card",
              )}
            >
              {i + 1}
              {flagged && <Flag className="absolute top-0.5 right-0.5 size-3" aria-hidden />}
              {grouped && <span aria-hidden className="absolute inset-x-3 bottom-1 h-0.5 rounded-full bg-current opacity-60" />}
            </button>
          );
        })}
      </div>

      <ul className="flex flex-col gap-1.5 text-xs text-muted-foreground">
        <li className="flex items-center gap-2">
          <span className="size-3.5 rounded bg-primary" aria-hidden /> Sudah dijawab
        </li>
        {partialCount > 0 && (
          <li className="flex items-center gap-2">
            <span className="size-3.5 rounded border border-dashed border-primary bg-primary-soft" aria-hidden /> Belum
            lengkap ({partialCount})
          </li>
        )}
        <li className="flex items-center gap-2">
          <span className="flex size-3.5 items-center justify-center rounded bg-cta" aria-hidden>
            <Flag className="size-2.5 text-cta-foreground" />
          </span>
          Ragu-ragu
        </li>
        <li className="flex items-center gap-2">
          <span className="size-3.5 rounded border border-input bg-background" aria-hidden /> Belum dijawab
        </li>
        {hasGroups && (
          <li className="flex items-center gap-2">
            <span className="relative size-3.5 rounded border border-input bg-background" aria-hidden>
              <span className="absolute inset-x-0.5 bottom-0.5 h-0.5 rounded-full bg-muted-foreground" />
            </span>
            Soal grup (satu stimulus)
          </li>
        )}
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
