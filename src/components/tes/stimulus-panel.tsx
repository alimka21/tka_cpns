"use client";

import { BookOpenText, ChevronDown } from "lucide-react";
import type { ExamStimulus } from "@/lib/exam";
import { RichHtml } from "./rich-html";

type Props = {
  stimulus: ExamStimulus;
  /** Nomor soal (1-based) yang memakai stimulus ini, mis. [5, 6, 7]. */
  questionNumbers: number[];
};

function rangeText(numbers: number[]) {
  if (numbers.length === 0) return "";
  const sorted = [...numbers].sort((a, b) => a - b);
  const contiguous = sorted.every((n, i) => i === 0 || n === sorted[i - 1] + 1);
  return contiguous && sorted.length > 1 ? `${sorted[0]}–${sorted[sorted.length - 1]}` : sorted.join(", ");
}

function Body({ stimulus }: { stimulus: ExamStimulus }) {
  return (
    <div className="leading-relaxed">
      <RichHtml html={stimulus.html} />
      {stimulus.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- URL gambar bebas dari admin
        <img
          src={stimulus.imageUrl}
          alt={`Gambar stimulus: ${stimulus.title}`}
          decoding="async"
          className="mt-4 max-h-96 rounded-lg border"
        />
      )}
    </div>
  );
}

/** Desktop lebar: kolom stimulus di samping soal, scroll sendiri. */
export function StimulusAside({ stimulus, questionNumbers }: Props) {
  return (
    <section
      aria-label={`Stimulus: ${stimulus.title}`}
      className="surface-card sticky top-24 hidden max-h-[calc(100dvh-8rem)] flex-col overflow-hidden xl:flex"
    >
      <header className="border-b bg-muted/40 px-6 py-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-primary">
          <BookOpenText className="size-4" aria-hidden /> Stimulus untuk soal {rangeText(questionNumbers)}
        </div>
        <h2 className="mt-1 font-bold">{stimulus.title}</h2>
      </header>
      <div className="overflow-y-auto px-6 py-5">
        <Body stimulus={stimulus} />
      </div>
    </section>
  );
}

/** HP/tablet & desktop sempit: bagian yang bisa dilipat di atas soal. */
export function StimulusCollapsible({ stimulus, questionNumbers }: Props) {
  return (
    <details open className="group rounded-xl border bg-muted/30 xl:hidden">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3">
        <BookOpenText className="size-4 shrink-0 text-primary" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-semibold text-primary">Stimulus untuk soal {rangeText(questionNumbers)}</span>
          <span className="block truncate font-semibold">{stimulus.title}</span>
        </span>
        <span className="text-xs font-semibold text-muted-foreground group-open:hidden">Baca</span>
        <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="max-h-[50dvh] overflow-y-auto border-t px-4 py-4">
        <Body stimulus={stimulus} />
      </div>
    </details>
  );
}
