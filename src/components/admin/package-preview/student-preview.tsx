"use client";

// Mode "Tampilan siswa": soal persis seperti di halaman ujian (komponen yang
// sama), tanpa kunci. Jawaban hanya di memori browser — tidak disimpan, timer
// tidak berjalan.

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Eye, RotateCcw } from "lucide-react";
import { QuestionView } from "@/components/tes/question-view";
import { StimulusPanel } from "@/components/tes/stimulus-panel";
import { Button } from "@/components/ui/button";
import { answerStatus, type AnswerResponse, type ExamQuestion, type ExamStimulus } from "@/lib/exam";
import { cn } from "@/lib/utils";

export function StudentPreview({
  questions,
  stimuli,
  durationMinutes,
}: {
  questions: ExamQuestion[];
  stimuli: ExamStimulus[];
  durationMinutes: number;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, AnswerResponse | null>>({});
  const stimulusById = useMemo(() => new Map(stimuli.map((s) => [s.id, s])), [stimuli]);
  const numbersByStimulus = useMemo(() => {
    const map = new Map<number, number[]>();
    questions.forEach((q, i) => q.stimulusId != null && map.set(q.stimulusId, [...(map.get(q.stimulusId) ?? []), i + 1]));
    return map;
  }, [questions]);

  if (questions.length === 0) {
    return <p className="surface-card px-6 py-10 text-center text-sm text-muted-foreground">Paket ini belum berisi soal.</p>;
  }
  const q = questions[index];
  const stimulus = q.stimulusId != null ? stimulusById.get(q.stimulusId) : undefined;
  const answered = questions.filter((x) => answerStatus(x, answers[x.id]) === "complete").length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-dashed bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5 font-semibold text-foreground">
          <Eye className="size-4" aria-hidden /> Pratinjau tampilan siswa
        </span>
        <span>Jawaban tidak disimpan & tidak dinilai.</span>
        <span className="flex items-center gap-1.5">
          <Clock className="size-4" aria-hidden /> Durasi tes {durationMinutes} menit (timer tidak berjalan)
        </span>
        <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setAnswers({})}>
          <RotateCcw aria-hidden /> Kosongkan jawaban
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_16rem]">
        <div className="flex min-w-0 flex-col gap-4">
          {stimulus && <StimulusPanel stimulus={stimulus} questionNumbers={numbersByStimulus.get(stimulus.id) ?? []} />}
          <section className="surface-card flex flex-col gap-5 p-5 sm:p-6" aria-label={`Soal ${index + 1}`}>
            <div className="text-sm font-semibold text-muted-foreground">
              Soal {index + 1} dari {questions.length}
            </div>
            <QuestionView
              key={q.id}
              number={index + 1}
              question={q}
              response={answers[q.id] ?? null}
              onChange={(r) => setAnswers((a) => ({ ...a, [q.id]: r }))}
            />
            <div className="flex items-center justify-between gap-2 border-t pt-4">
              <Button variant="outline" disabled={index === 0} onClick={() => setIndex(index - 1)}>
                <ChevronLeft aria-hidden /> Sebelumnya
              </Button>
              <Button variant="outline" disabled={index === questions.length - 1} onClick={() => setIndex(index + 1)}>
                Berikutnya <ChevronRight aria-hidden />
              </Button>
            </div>
          </section>
        </div>

        <aside className="surface-card flex h-fit flex-col gap-3 p-4" aria-label="Navigasi soal">
          <div className="text-sm font-semibold">
            Terjawab {answered}/{questions.length}
          </div>
          <div className="grid grid-cols-6 gap-1.5 lg:grid-cols-5">
            {questions.map((x, i) => {
              const status = answerStatus(x, answers[x.id]);
              return (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-current={i === index ? "step" : undefined}
                  aria-label={`Soal ${i + 1}`}
                  className={cn(
                    "flex h-9 items-center justify-center rounded-md border text-sm font-semibold tabular-nums transition-colors",
                    status === "complete" && "border-primary bg-primary text-primary-foreground",
                    status === "partial" && "border-dashed border-primary text-primary",
                    i === index && "ring-2 ring-ring/40 ring-offset-1",
                    x.stimulusId != null && "underline decoration-2 underline-offset-4",
                  )}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
