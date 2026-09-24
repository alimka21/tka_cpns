"use client";

import type { ExamAnswerState, ExamQuestion } from "@/lib/exam";
import { cn } from "@/lib/utils";
import { RichHtml } from "./rich-html";

type Props = {
  number: number;
  question: ExamQuestion;
  answer: ExamAnswerState | undefined;
  disabled?: boolean;
  onSelectOption: (optionId: number | null) => void;
};

// Kartu opsi mengikuti design system Stitch: resting = border tipis + badge
// huruf abu; terpilih = border 2px primary, latar biru muda, badge solid.
export function QuestionView({ number, question, answer, disabled, onSelectOption }: Props) {
  const selected = answer?.selectedOptionId ?? null;
  return (
    <div className="flex flex-col gap-6">
      <div className="leading-relaxed">
        <RichHtml html={question.html} />
        {question.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- URL gambar bebas dari admin
          <img
            src={question.imageUrl}
            alt={`Gambar soal ${number}`}
            decoding="async"
            className="mt-4 max-h-80 rounded-lg border"
          />
        )}
      </div>

      <div role="radiogroup" aria-label={`Pilihan jawaban soal ${number}`} className="flex flex-col gap-3">
        {question.options.map((option) => {
          const checked = selected === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={checked}
              disabled={disabled}
              // Klik opsi yang sama lagi = batalkan jawaban.
              onClick={() => onSelectOption(checked ? null : option.id)}
              className={cn(
                "flex items-start gap-3 rounded-xl border bg-card px-4 py-3.5 text-left transition-colors hover:border-primary/40 hover:bg-primary-soft/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/25 disabled:pointer-events-none disabled:opacity-60",
                checked && "border-primary bg-primary-soft shadow-[0_0_0_1px_var(--primary)] hover:bg-primary-soft",
              )}
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground",
                  checked && "bg-primary text-primary-foreground",
                )}
              >
                {option.label}
              </span>
              <RichHtml html={option.html} className="pt-1" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
