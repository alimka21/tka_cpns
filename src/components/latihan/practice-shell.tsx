"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, CircleCheck, Dumbbell, LoaderCircle, X } from "lucide-react";
import { ReviewCard } from "@/components/hasil/review-card";
import { QuestionView } from "@/components/tes/question-view";
import { StimulusPanel } from "@/components/tes/stimulus-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { answerStatus, type AnswerResponse, type ExamQuestion, type ExamStimulus } from "@/lib/exam";
import type { ReviewItem } from "@/lib/review";
import { cn } from "@/lib/utils";

export type PracticeShellItem = {
  itemId: number;
  subtopic: string;
  question: ExamQuestion;
  review: ReviewItem | null;
};

type Props = {
  items: PracticeShellItem[];
  stimuli: ExamStimulus[];
  answer: (input: { itemId: number; response: AnswerResponse }) => Promise<{ ok: true; review: ReviewItem } | { ok: false; error: string }>;
  finish: () => Promise<{ ok: true; redirectTo: string } | { ok: false; error: string }>;
};

/**
 * Mode latihan: tanpa timer; setiap soal langsung dinilai & menampilkan
 * kunci + pembahasan setelah siswa menekan "Periksa jawaban".
 */
export function PracticeShell({ items, stimuli, answer, finish }: Props) {
  const router = useRouter();
  const [reviews, setReviews] = useState<Record<number, ReviewItem>>(() =>
    Object.fromEntries(items.filter((i) => i.review).map((i) => [i.itemId, i.review!])),
  );
  const [responses, setResponses] = useState<Record<number, AnswerResponse | null>>({});
  const [index, setIndex] = useState(() => Math.max(0, items.findIndex((i) => !i.review)));
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [checking, startChecking] = useTransition();
  const [finishing, startFinishing] = useTransition();

  const item = items[index];
  const review = reviews[item.itemId];
  const response = responses[item.itemId] ?? null;
  const answeredCount = Object.keys(reviews).length;
  const correctCount = Object.values(reviews).filter((r) => r.isCorrect).length;
  const allAnswered = answeredCount === items.length;
  const stimulus = stimuli.find((s) => s.id === item.question.stimulusId) ?? null;
  const stimulusNumbers = stimulus ? items.flatMap((it, i) => (it.question.stimulusId === stimulus.id ? [i + 1] : [])) : [];
  const canCheck = answerStatus(item.question, response) === "complete";
  const nextUnanswered = items.findIndex((it, i) => i > index && !reviews[it.itemId]);

  function check() {
    if (!response) return;
    setError(null);
    startChecking(async () => {
      const result = await answer({ itemId: item.itemId, response }).catch(() => ({ ok: false as const, error: "Koneksi terputus. Coba lagi." }));
      if (!result.ok) setError(result.error);
      else setReviews((prev) => ({ ...prev, [item.itemId]: result.review }));
    });
  }

  function doFinish() {
    setConfirmOpen(false);
    setError(null);
    startFinishing(async () => {
      const result = await finish().catch(() => ({ ok: false as const, error: "Koneksi terputus. Coba lagi." }));
      if (!result.ok) setError(result.error);
      else router.push(result.redirectTo);
    });
  }

  function goTo(i: number) {
    setIndex(i);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <span className="hidden size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground sm:flex">
            <Dumbbell className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-bold sm:text-base">Latihan Kelemahan</h1>
            <p className="text-xs text-muted-foreground tabular-nums">
              {answeredCount}/{items.length} dijawab · {correctCount} benar
            </p>
          </div>
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/latihan" />}>
            Keluar
          </Button>
          <Button size="sm" disabled={finishing || answeredCount === 0} onClick={() => (allAnswered ? doFinish() : setConfirmOpen(true))}>
            {finishing ? <LoaderCircle className="animate-spin" aria-hidden /> : <CircleCheck aria-hidden />}
            Selesai
          </Button>
        </div>
        <div className="h-1 bg-muted" aria-hidden>
          <div className="h-1 bg-primary transition-all" style={{ width: `${(answeredCount / items.length) * 100}%` }} />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-6 sm:px-6">
        <nav aria-label="Nomor soal" className="flex flex-wrap gap-2">
          {items.map((it, i) => {
            const r = reviews[it.itemId];
            const state = r ? (r.isCorrect ? "benar" : "salah") : "belum dijawab";
            return (
              <button
                key={it.itemId}
                type="button"
                onClick={() => goTo(i)}
                aria-current={i === index ? "step" : undefined}
                aria-label={`Soal ${i + 1}: ${state}`}
                className={cn(
                  "flex size-9 items-center justify-center rounded-lg border text-sm font-semibold tabular-nums",
                  r?.isCorrect && "border-success-strong bg-success-strong text-white",
                  r && !r.isCorrect && "border-destructive bg-destructive text-white",
                  i === index && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                )}
              >
                {r ? r.isCorrect ? <Check className="size-4" aria-hidden /> : <X className="size-4" aria-hidden /> : i + 1}
              </button>
            );
          })}
        </nav>

        {stimulus && <StimulusPanel key={stimulus.id} stimulus={stimulus} questionNumbers={stimulusNumbers} />}

        {review ? (
          <ReviewCard item={{ ...review, number: index + 1 }} />
        ) : (
          <section aria-label={`Soal ${index + 1}`} className="surface-card flex flex-col gap-6 p-5 sm:p-8">
            <div className="flex flex-wrap items-center gap-2 border-b pb-4">
              <span className="rounded-lg bg-primary px-3 py-1 text-sm font-bold text-primary-foreground tabular-nums">
                Soal {index + 1}
              </span>
              <span className="text-sm text-muted-foreground">dari {items.length}</span>
              <Badge variant="outline" className="ml-auto max-w-full truncate">
                {item.subtopic}
              </Badge>
            </div>
            <QuestionView
              number={index + 1}
              question={item.question}
              response={response}
              disabled={checking}
              onChange={(next) => setResponses((prev) => ({ ...prev, [item.itemId]: next }))}
            />
          </section>
        )}

        {error && (
          <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive-soft px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between gap-3">
          <Button variant="outline" disabled={index === 0} onClick={() => goTo(index - 1)}>
            <ArrowLeft aria-hidden /> Sebelumnya
          </Button>
          {!review ? (
            <Button size="lg" disabled={!canCheck || checking} onClick={check}>
              {checking ? <LoaderCircle className="animate-spin" aria-hidden /> : <Check aria-hidden />}
              Periksa jawaban
            </Button>
          ) : allAnswered ? (
            <Button size="lg" variant="cta" disabled={finishing} onClick={doFinish}>
              {finishing ? "Menyimpan…" : "Lihat ringkasan"} <ArrowRight aria-hidden />
            </Button>
          ) : (
            <Button size="lg" onClick={() => goTo(nextUnanswered >= 0 ? nextUnanswered : items.findIndex((it) => !reviews[it.itemId]))}>
              Soal berikutnya <ArrowRight aria-hidden />
            </Button>
          )}
        </div>
        {!review && !canCheck && (
          <p className="text-right text-xs text-muted-foreground">
            {item.question.type === "pgk_kategori" ? "Isi semua pernyataan untuk memeriksa." : "Pilih jawaban untuk memeriksa."}
          </p>
        )}
      </main>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Selesaikan latihan sekarang?</AlertDialogTitle>
            <AlertDialogDescription>
              Masih ada {items.length - answeredCount} soal yang belum dijawab. Soal yang belum dijawab tidak dihitung ke
              diagnosamu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Lanjut latihan</AlertDialogCancel>
            <AlertDialogAction onClick={doFinish}>Ya, selesai</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
