"use client";

import { BookOpenText, ChevronDown } from "lucide-react";
import type { ExamStimulus } from "@/lib/exam";
import { RichHtml } from "./rich-html";
import { QuestionImage } from "./question-image";

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
      {stimulus.imageUrl && <QuestionImage src={stimulus.imageUrl} alt={`Gambar stimulus: ${stimulus.title}`} className="mt-4" />}
    </div>
  );
}

/**
 * Panel stimulus di ATAS soal (semua ukuran layar). Bisa dilipat. Isinya
 * tampil utuh TANPA scroll sendiri — halaman yang memanjang, lalu soal &
 * pilihan jawaban menyusul di bawahnya (permintaan pemilik produk 2026-10-16).
 */
export function StimulusPanel({ stimulus, questionNumbers, textClass }: Props & { textClass?: string }) {
  return (
    <details open className="surface-card group overflow-hidden">
      <summary className="flex cursor-pointer list-none items-center gap-3 border-b bg-muted/40 px-5 py-3 group-not-open:border-b-0 sm:px-6">
        <BookOpenText className="size-4 shrink-0 text-primary" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-semibold text-primary">Bacaan untuk soal {rangeText(questionNumbers)}</span>
          <span className="block truncate font-bold">{stimulus.title}</span>
        </span>
        <span className="text-xs font-semibold text-muted-foreground">
          <span className="group-open:hidden">Tampilkan</span>
          <span className="hidden group-open:inline">Sembunyikan</span>
        </span>
        <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className={`px-5 py-5 sm:px-6 ${textClass ?? ""}`}>
        <Body stimulus={stimulus} />
      </div>
    </details>
  );
}
