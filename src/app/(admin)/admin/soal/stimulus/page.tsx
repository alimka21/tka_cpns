import type { Metadata } from "next";
import { BookOpenText, Plus } from "lucide-react";
import { StimulusForm } from "@/components/admin/stimulus-form";
import { DemoDataNotice, PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { demoQuestions, demoStimuli } from "@/lib/demo-data";
import { formatDate } from "@/lib/format";
import { QUESTION_TYPE_META } from "@/lib/question-forms";

export const metadata: Metadata = { title: "Stimulus" };

// TODO: ganti data contoh dengan query tabel stimuli + questions.stimulus_id.
export default function AdminStimulusPage() {
  return (
    <div className="flex flex-col gap-8">
      <DemoDataNotice />
      <PageHeader
        title="Stimulus"
        description="Bacaan, tabel, atau grafik yang dipakai bersama oleh beberapa soal (soal grup). Soal dalam satu grup selalu tampil & masuk paket secara utuh."
      />

      <details className="surface-card group">
        <summary className="flex cursor-pointer list-none items-center gap-2 p-5 font-semibold text-primary">
          <Plus className="size-4 transition-transform group-open:rotate-45" aria-hidden /> Stimulus baru
        </summary>
        <div className="border-t p-5">
          <StimulusForm />
        </div>
      </details>

      <ul className="flex flex-col gap-4">
        {demoStimuli.map((st) => {
          const questions = demoQuestions
            .filter((q) => q.stimulusCode === st.code)
            .sort((a, b) => (a.stimulusOrder ?? 0) - (b.stimulusOrder ?? 0));
          return (
            <li key={st.id} className="surface-card flex flex-col gap-4 p-6">
              <div className="flex flex-wrap items-center gap-2">
                <BookOpenText className="size-4 text-primary" aria-hidden />
                <span className="font-mono text-xs font-semibold text-primary">{st.code}</span>
                <Badge variant={st.status === "published" ? "success" : "muted"}>
                  {st.status === "published" ? "Tayang" : "Draft"}
                </Badge>
                <span className="ml-auto text-xs text-muted-foreground">{formatDate(st.createdAt)}</span>
              </div>
              <div>
                <h2 className="text-lg font-bold">{st.title}</h2>
                <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{st.content}</p>
              </div>
              <div className="rounded-xl border">
                <div className="border-b bg-muted/40 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">
                  {questions.length} soal di grup ini
                </div>
                {questions.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-muted-foreground">Belum ada soal yang memakai stimulus ini.</p>
                ) : (
                  <ol className="divide-y">
                    {questions.map((q) => (
                      <li key={q.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                        <span className="flex size-6 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">
                          {q.stimulusOrder}
                        </span>
                        <Badge variant="info">{QUESTION_TYPE_META[q.type].short}</Badge>
                        <span className="min-w-0 flex-1 truncate">{q.text}</span>
                        <span className="text-xs text-muted-foreground">{q.subtopic}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
