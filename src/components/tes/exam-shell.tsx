"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Flag, GraduationCap, LayoutGrid, X } from "lucide-react";
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
import type {
  ExamAnswerState,
  ExamQuestion,
  SaveAnswerFn,
  SubmitAttemptFn,
} from "@/lib/exam";
import { cn } from "@/lib/utils";
import { ExamTimer } from "./exam-timer";
import { QuestionNavigator } from "./question-navigator";
import { QuestionView } from "./question-view";

const AUTOSAVE_DEBOUNCE_MS = 400;
const AUTOSAVE_RETRY_MS = 3000;

type SaveStatus = "idle" | "saving" | "saved" | "error";

// Ukuran teks soal bisa diperbesar; minimum tetap 16px (docs/UI_UX.md §2.2).
const FONT_SCALES = [
  { id: "md", label: "Teks normal", buttonClass: "text-xs", textClass: "text-base" },
  { id: "lg", label: "Teks besar", buttonClass: "text-sm", textClass: "text-lg" },
  { id: "xl", label: "Teks sangat besar", buttonClass: "text-base", textClass: "text-xl" },
] as const;
type FontScaleId = (typeof FONT_SCALES)[number]["id"];

type Props = {
  title: string;
  questions: ExamQuestion[];
  initialAnswers: Record<number, ExamAnswerState>;
  endsAt: string;
  serverNow: string;
  saveAnswer: SaveAnswerFn;
  submitAttempt: SubmitAttemptFn;
};

export function ExamShell({
  title,
  questions,
  initialAnswers,
  endsAt,
  serverNow,
  saveAnswer,
  submitAttempt,
}: Props) {
  const router = useRouter();
  const [answers, setAnswers] = useState(initialAnswers);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [phase, setPhase] = useState<"active" | "submitting" | "done">("active");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [fontScale, setFontScale] = useState<FontScaleId>("md");

  // Jawaban terbaru yang belum terkirim, per soal.
  const pending = useRef(new Map<number, ExamAnswerState>());
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const inFlight = useRef(new Set<Promise<unknown>>());
  const submitStarted = useRef(false);

  const sendAnswerRef = useRef<(questionId: number) => Promise<void>>(async () => {});

  const scheduleSend = useCallback((questionId: number, delayMs: number) => {
    clearTimeout(timers.current.get(questionId));
    timers.current.set(
      questionId,
      setTimeout(() => {
        timers.current.delete(questionId);
        void sendAnswerRef.current(questionId);
      }, delayMs),
    );
  }, []);

  const sendAnswer = useCallback(
    async (questionId: number) => {
      const state = pending.current.get(questionId);
      if (!state) return;
      pending.current.delete(questionId);
      setSaveStatus("saving");
      const request = saveAnswer({ questionId, ...state }).catch(() => ({ ok: false }));
      inFlight.current.add(request);
      const result = await request;
      inFlight.current.delete(request);
      if (!result.ok) {
        // Kembalikan ke antrean & coba lagi otomatis, kecuali user sudah
        // mengubah jawaban lagi (perubahan baru itu yang akan terkirim).
        if (!pending.current.has(questionId)) {
          pending.current.set(questionId, state);
          scheduleSend(questionId, AUTOSAVE_RETRY_MS);
        }
        setSaveStatus("error");
      } else if (pending.current.size === 0 && inFlight.current.size === 0) {
        setSaveStatus("saved");
      }
    },
    [saveAnswer, scheduleSend],
  );

  useEffect(() => {
    sendAnswerRef.current = sendAnswer;
  }, [sendAnswer]);

  const queueSave = useCallback(
    (questionId: number, state: ExamAnswerState) => {
      pending.current.set(questionId, state);
      scheduleSend(questionId, AUTOSAVE_DEBOUNCE_MS);
    },
    [scheduleSend],
  );

  const flushSaves = useCallback(async () => {
    timers.current.forEach(clearTimeout);
    timers.current.clear();
    await Promise.all([...pending.current.keys()].map(sendAnswer));
    await Promise.all(inFlight.current);
  }, [sendAnswer]);

  useEffect(() => {
    const currentTimers = timers.current;
    return () => currentTimers.forEach(clearTimeout);
  }, []);

  // Peringatkan kalau menutup tab sementara ada jawaban yang belum terkirim.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (phase === "active" && (pending.current.size > 0 || inFlight.current.size > 0)) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [phase]);

  const updateAnswer = (questionId: number, patch: Partial<ExamAnswerState>) => {
    if (phase !== "active") return;
    const next: ExamAnswerState = {
      selectedOptionId: answers[questionId]?.selectedOptionId ?? null,
      isFlagged: answers[questionId]?.isFlagged ?? false,
      ...patch,
    };
    setAnswers((prev) => ({ ...prev, [questionId]: next }));
    queueSave(questionId, next);
  };

  const submit = useCallback(async () => {
    // Cegah submit ganda (klik + timer habis bersamaan).
    if (submitStarted.current) return;
    submitStarted.current = true;
    setPhase("submitting");
    setSubmitError(null);
    await flushSaves();
    const result = await submitAttempt().catch(() => ({
      ok: false,
      error: "Koneksi terputus.",
      redirectTo: undefined,
    }));
    if (!result.ok) {
      setSubmitError(result.error ?? "Gagal mengumpulkan jawaban.");
      submitStarted.current = false;
      setPhase("active");
      return;
    }
    setPhase("done");
    if (result.redirectTo) router.push(result.redirectTo);
  }, [flushSaves, submitAttempt, router]);

  const question = questions[currentIndex];
  const answer = answers[question.id];
  const answeredCount = questions.filter((q) => answers[q.id]?.selectedOptionId != null).length;
  const flaggedCount = questions.filter((q) => answers[q.id]?.isFlagged).length;
  const unansweredCount = questions.length - answeredCount;
  const locked = phase !== "active";

  const goTo = (index: number) => {
    setCurrentIndex(index);
    setPaletteOpen(false);
  };

  const navigator = (
    <QuestionNavigator
      questionIds={questions.map((q) => q.id)}
      answers={answers}
      currentIndex={currentIndex}
      onSelect={goTo}
    />
  );

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <span className="hidden size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground sm:flex">
            <GraduationCap className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-bold sm:text-base">{title}</h1>
            <p className="text-xs text-muted-foreground">
              {answeredCount}/{questions.length} dijawab
              <SaveIndicator status={saveStatus} />
            </p>
          </div>
          <ExamTimer endsAt={endsAt} serverNow={serverNow} onExpire={() => void submit()} />
          <Button className="hidden sm:inline-flex" disabled={locked} onClick={() => setConfirmOpen(true)}>
            <CheckCircle2 aria-hidden />
            {phase === "submitting" ? "Mengumpulkan…" : "Selesai"}
          </Button>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-6 px-4 py-6 pb-28 sm:px-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:px-8 lg:pb-8">
        <div className="flex flex-col gap-4">
          {submitError && (
            <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive-soft px-4 py-3 text-sm text-destructive">
              {submitError} Coba kumpulkan lagi.
            </p>
          )}
          {phase === "done" && (
            <p role="status" className="rounded-lg border border-success/40 bg-success-soft px-4 py-3 text-sm text-success">
              Jawaban sudah dikumpulkan. Mengalihkan ke hasil…
            </p>
          )}

          <section aria-label={`Soal ${currentIndex + 1}`} className="surface-card flex flex-col gap-6 p-5 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-primary px-3 py-1 text-sm font-bold text-primary-foreground tabular-nums">
                  Soal {currentIndex + 1}
                </span>
                <span className="text-sm text-muted-foreground">dari {questions.length}</span>
                {answer?.isFlagged && (
                  <span className="flex items-center gap-1 rounded-full bg-warning-soft px-2.5 py-0.5 text-xs font-semibold text-warning-strong">
                    <Flag className="size-3" aria-hidden /> Ragu-ragu
                  </span>
                )}
              </div>
              <div role="group" aria-label="Ukuran teks soal" className="flex items-center gap-1">
                {FONT_SCALES.map((scale) => (
                  <button
                    key={scale.id}
                    type="button"
                    aria-pressed={fontScale === scale.id}
                    aria-label={scale.label}
                    onClick={() => setFontScale(scale.id)}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-md border font-semibold text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/25",
                      scale.buttonClass,
                      fontScale === scale.id && "border-primary bg-primary-soft text-primary",
                    )}
                  >
                    A
                  </button>
                ))}
              </div>
            </div>

            <div className={FONT_SCALES.find((f) => f.id === fontScale)?.textClass}>
              <QuestionView
                number={currentIndex + 1}
                question={question}
                answer={answer}
                disabled={locked}
                onSelectOption={(selectedOptionId) => updateAnswer(question.id, { selectedOptionId })}
              />
            </div>
          </section>

          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              aria-label="Soal sebelumnya"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((i) => i - 1)}
            >
              <ArrowLeft aria-hidden /> <span className="hidden sm:inline">Sebelumnya</span>
            </Button>
            <Button
              variant="outline"
              disabled={locked}
              aria-pressed={answer?.isFlagged ?? false}
              className={cn(
                "border-cta bg-warning-soft text-warning-strong hover:bg-warning-soft/70 hover:text-warning-strong",
                answer?.isFlagged && "bg-cta text-cta-foreground hover:bg-cta-hover hover:text-cta-foreground",
              )}
              onClick={() => updateAnswer(question.id, { isFlagged: !answer?.isFlagged })}
            >
              <Flag aria-hidden />
              {answer?.isFlagged ? "Batal ragu-ragu" : "Ragu-ragu"}
            </Button>
            {currentIndex < questions.length - 1 ? (
              <Button onClick={() => setCurrentIndex((i) => i + 1)}>
                Berikutnya <ArrowRight aria-hidden />
              </Button>
            ) : (
              <Button variant="cta" disabled={locked} onClick={() => setConfirmOpen(true)}>
                Kumpulkan <CheckCircle2 aria-hidden />
              </Button>
            )}
          </div>
        </div>

        {/* Palet nomor soal — desktop */}
        <aside className="hidden lg:block">
          <div className="surface-card sticky top-24 flex flex-col gap-5 p-5">
            <div>
              <h2 className="font-bold">Nomor Soal</h2>
              <p className="text-xs text-muted-foreground">Klik nomor untuk melompat.</p>
            </div>
            {navigator}
            <Button variant="cta" disabled={locked} onClick={() => setConfirmOpen(true)}>
              {phase === "submitting" ? "Mengumpulkan…" : "Kumpulkan jawaban"}
            </Button>
          </div>
        </aside>
      </div>

      {/* Bar bawah mobile: buka palet nomor soal sebagai bottom sheet */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-2 border-t bg-card px-4 py-3 lg:hidden">
        <Button variant="outline" className="flex-1" aria-expanded={paletteOpen} onClick={() => setPaletteOpen(true)}>
          <LayoutGrid aria-hidden /> Nomor soal ({answeredCount}/{questions.length})
        </Button>
        <Button variant="cta" disabled={locked} onClick={() => setConfirmOpen(true)}>
          Selesai
        </Button>
      </div>

      {paletteOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Nomor soal">
          <button
            type="button"
            aria-label="Tutup"
            className="absolute inset-0 bg-foreground/30"
            onClick={() => setPaletteOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[80dvh] overflow-y-auto rounded-t-2xl bg-card p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold">Nomor Soal</h2>
              <Button variant="ghost" size="icon-sm" aria-label="Tutup" onClick={() => setPaletteOpen(false)}>
                <X aria-hidden />
              </Button>
            </div>
            {navigator}
          </div>
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kumpulkan jawaban sekarang?</AlertDialogTitle>
            <AlertDialogDescription>
              Setelah dikumpulkan, jawaban tidak bisa diubah lagi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <dl className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="flex flex-col-reverse rounded-lg bg-primary-soft p-2 text-primary">
              <dt className="text-xs">Dijawab</dt>
              <dd className="text-lg font-bold">{answeredCount}</dd>
            </div>
            <div className="flex flex-col-reverse rounded-lg bg-warning-soft p-2 text-warning-strong">
              <dt className="text-xs">Ragu-ragu</dt>
              <dd className="text-lg font-bold">{flaggedCount}</dd>
            </div>
            <div className="flex flex-col-reverse rounded-lg bg-muted p-2 text-muted-foreground">
              <dt className="text-xs">Kosong</dt>
              <dd className="text-lg font-bold">{unansweredCount}</dd>
            </div>
          </dl>
          <AlertDialogFooter>
            <AlertDialogCancel>Periksa lagi</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmOpen(false);
                void submit();
              }}
            >
              Ya, kumpulkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;
  const text = {
    saving: "Menyimpan…",
    saved: "Tersimpan",
    error: "Gagal menyimpan — periksa koneksi, akan dicoba lagi",
  }[status];
  return (
    <span aria-live="polite" className={cn("ml-2", status === "error" && "text-destructive")}>
      · {text}
    </span>
  );
}
