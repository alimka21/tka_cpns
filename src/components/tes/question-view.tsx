"use client";

import { Check, Info } from "lucide-react";
import type { AnswerResponse, ExamOption, ExamQuestion } from "@/lib/exam";
import { cn } from "@/lib/utils";
import { RichHtml } from "./rich-html";

type Props = {
  number: number;
  question: ExamQuestion;
  response: AnswerResponse | null;
  disabled?: boolean;
  onChange: (response: AnswerResponse | null) => void;
};

const HINT: Record<ExamQuestion["type"], string | null> = {
  pg: null,
  pgk_mcma: "Jawaban benar bisa lebih dari satu — pilih semua yang benar.",
  pgk_kategori: "Tentukan kategori untuk setiap pernyataan.",
};

// Kartu opsi mengikuti design system Stitch: resting = border tipis + badge
// huruf abu; terpilih = border 2px primary, latar biru muda, badge solid.
const optionCard = (checked: boolean) =>
  cn(
    "flex w-full items-start gap-3 rounded-xl border bg-card px-4 py-3.5 text-left transition-colors hover:border-primary/40 hover:bg-primary-soft/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/25 disabled:pointer-events-none disabled:opacity-60",
    checked && "border-primary bg-primary-soft shadow-[0_0_0_1px_var(--primary)] hover:bg-primary-soft",
  );

export function QuestionView({ number, question, response, disabled, onChange }: Props) {
  const hint = HINT[question.type];
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

      {hint && (
        <p className="flex items-center gap-2 rounded-lg bg-primary-soft px-3 py-2 text-sm font-medium text-primary">
          <Info className="size-4 shrink-0" aria-hidden /> {hint}
        </p>
      )}

      {question.type === "pg" && (
        <SingleChoice number={number} question={question} response={response} disabled={disabled} onChange={onChange} />
      )}
      {question.type === "pgk_mcma" && (
        <MultipleChoice number={number} question={question} response={response} disabled={disabled} onChange={onChange} />
      )}
      {question.type === "pgk_kategori" && (
        <CategoryChoice number={number} question={question} response={response} disabled={disabled} onChange={onChange} />
      )}
    </div>
  );
}

function LetterBadge({ option, checked, square }: { option: ExamOption; checked: boolean; square?: boolean }) {
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center bg-muted text-sm font-bold text-muted-foreground",
        square ? "rounded-md" : "rounded-full",
        checked && "bg-primary text-primary-foreground",
      )}
    >
      {checked && square ? <Check className="size-4" aria-hidden /> : option.label}
    </span>
  );
}

function SingleChoice({ number, question, response, disabled, onChange }: Props) {
  const selected = response?.type === "pg" ? response.optionId : null;
  return (
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
            onClick={() => onChange(checked ? null : { type: "pg", optionId: option.id })}
            className={optionCard(checked)}
          >
            <LetterBadge option={option} checked={checked} />
            <RichHtml html={option.html} className="pt-1" />
          </button>
        );
      })}
    </div>
  );
}

function MultipleChoice({ number, question, response, disabled, onChange }: Props) {
  const selected = new Set(response?.type === "pgk_mcma" ? response.optionIds : []);
  const toggle = (id: number) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    // Simpan sesuai urutan opsi supaya payload stabil.
    const optionIds = question.options.map((o) => o.id).filter((o) => next.has(o));
    onChange(optionIds.length > 0 ? { type: "pgk_mcma", optionIds } : null);
  };
  return (
    <div role="group" aria-label={`Pilihan jawaban soal ${number} (boleh lebih dari satu)`} className="flex flex-col gap-3">
      {question.options.map((option) => {
        const checked = selected.has(option.id);
        return (
          <button
            key={option.id}
            type="button"
            role="checkbox"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => toggle(option.id)}
            className={optionCard(checked)}
          >
            <LetterBadge option={option} checked={checked} square />
            <RichHtml html={option.html} className="pt-1" />
          </button>
        );
      })}
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {selected.size} opsi dipilih
      </p>
    </div>
  );
}

function CategoryChoice({ number, question, response, disabled, onChange }: Props) {
  const labels = question.categoryLabels ?? ["Benar", "Salah"];
  const chosen = new Map(response?.type === "pgk_kategori" ? response.answers.map((a) => [a.optionId, a.category]) : []);
  const set = (optionId: number, category: string) => {
    const next = new Map(chosen);
    // Klik kategori yang sama lagi = kosongkan pernyataan itu.
    if (next.get(optionId) === category) next.delete(optionId);
    else next.set(optionId, category);
    const answers = question.options
      .filter((o) => next.has(o.id))
      .map((o) => ({ optionId: o.id, category: next.get(o.id)! }));
    onChange(answers.length > 0 ? { type: "pgk_kategori", answers } : null);
  };

  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="hidden grid-cols-[1fr_auto] items-center gap-4 border-b bg-muted/50 px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase sm:grid">
        <span>Pernyataan</span>
        <span className="flex w-64 justify-around">
          {labels.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </span>
      </div>
      <ul className="divide-y">
        {question.options.map((option) => {
          const value = chosen.get(option.id);
          return (
            <li key={option.id} className={cn("flex flex-col gap-3 px-4 py-3.5 sm:grid sm:grid-cols-[1fr_auto] sm:items-center sm:gap-4", value && "bg-primary-soft/40")}>
              <div className="flex items-start gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                  {option.label}
                </span>
                <RichHtml html={option.html} className="pt-0.5" />
              </div>
              <div
                role="radiogroup"
                aria-label={`Soal ${number}, pernyataan ${option.label}`}
                className="grid grid-cols-2 gap-2 sm:w-64"
              >
                {labels.map((label) => {
                  const checked = value === label;
                  return (
                    <button
                      key={label}
                      type="button"
                      role="radio"
                      aria-checked={checked}
                      disabled={disabled}
                      onClick={() => set(option.id, label)}
                      className={cn(
                        "flex min-h-10 items-center justify-center gap-1.5 rounded-lg border bg-card px-3 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/25 disabled:pointer-events-none disabled:opacity-60",
                        checked && "border-primary bg-primary text-primary-foreground hover:text-primary-foreground",
                      )}
                    >
                      {checked && <Check className="size-4" aria-hidden />}
                      {label}
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="border-t bg-muted/30 px-4 py-2 text-sm text-muted-foreground" aria-live="polite">
        {chosen.size} dari {question.options.length} pernyataan dijawab
      </p>
    </div>
  );
}
