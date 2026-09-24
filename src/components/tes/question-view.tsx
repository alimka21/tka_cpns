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

export function QuestionView({ number, question, answer, disabled, onSelectOption }: Props) {
  const selected = answer?.selectedOptionId ?? null;
  return (
    <div className="flex flex-col gap-6">
      <div className="text-base leading-relaxed">
        <div className="mb-2 text-sm font-medium text-muted-foreground">Soal {number}</div>
        <RichHtml html={question.html} />
        {question.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- URL gambar bebas dari admin
          <img
            src={question.imageUrl}
            alt={`Gambar soal ${number}`}
            decoding="async"
            className="mt-4 max-h-80 rounded-md border"
          />
        )}
      </div>

      <div role="radiogroup" aria-label={`Pilihan jawaban soal ${number}`} className="flex flex-col gap-2">
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
                "flex items-start gap-3 rounded-lg border px-4 py-3 text-left transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-60",
                checked && "border-primary bg-primary/5 hover:bg-primary/10",
              )}
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                  checked && "border-primary bg-primary text-primary-foreground",
                )}
              >
                {option.label}
              </span>
              <RichHtml html={option.html} className="pt-0.5" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
