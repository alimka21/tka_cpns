"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">
            {answeredCount} dari {questions.length} soal dijawab
            <SaveIndicator status={saveStatus} />
          </p>
        </div>
        <ExamTimer endsAt={endsAt} serverNow={serverNow} onExpire={() => void submit()} />
      </div>

      {submitError && (
        <p role="alert" className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {submitError} Coba kumpulkan lagi.
        </p>
      )}
      {phase === "done" && (
        <p role="status" className="rounded-md bg-muted px-4 py-3 text-sm">
          Jawaban sudah dikumpulkan.
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_16rem]">
        <div className="flex flex-col gap-6">
          <QuestionView
            number={currentIndex + 1}
            question={question}
            answer={answer}
            disabled={locked}
            onSelectOption={(selectedOptionId) => updateAnswer(question.id, { selectedOptionId })}
          />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button
              variant="outline"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((i) => i - 1)}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              disabled={locked}
              aria-pressed={answer?.isFlagged ?? false}
              className={cn(answer?.isFlagged && "border-amber-500 bg-amber-400/20")}
              onClick={() => updateAnswer(question.id, { isFlagged: !answer?.isFlagged })}
            >
              {answer?.isFlagged ? "Batal ragu-ragu" : "Ragu-ragu"}
            </Button>
            {currentIndex < questions.length - 1 ? (
              <Button onClick={() => setCurrentIndex((i) => i + 1)}>Berikutnya</Button>
            ) : (
              <Button disabled={locked} onClick={() => setConfirmOpen(true)}>
                Kumpulkan
              </Button>
            )}
          </div>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
          <QuestionNavigator
            questionIds={questions.map((q) => q.id)}
            answers={answers}
            currentIndex={currentIndex}
            onSelect={setCurrentIndex}
          />
          <Button variant="secondary" disabled={locked} onClick={() => setConfirmOpen(true)}>
            {phase === "submitting" ? "Mengumpulkan…" : "Kumpulkan jawaban"}
          </Button>
        </aside>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kumpulkan jawaban sekarang?</AlertDialogTitle>
            <AlertDialogDescription>
              {unansweredCount > 0
                ? `Masih ada ${unansweredCount} soal belum dijawab. `
                : "Semua soal sudah dijawab. "}
              {flaggedCount > 0 && `${flaggedCount} soal masih ditandai ragu-ragu. `}
              Setelah dikumpulkan, jawaban tidak bisa diubah lagi.
            </AlertDialogDescription>
          </AlertDialogHeader>
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
