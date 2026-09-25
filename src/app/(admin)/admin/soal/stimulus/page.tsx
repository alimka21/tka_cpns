import type { Metadata } from "next";
import { BookOpenText, Plus } from "lucide-react";
import { StimulusForm } from "@/components/admin/stimulus-form";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { listStimuli } from "@/server/queries/question-bank";
import { formatDate } from "@/lib/format";
import { QUESTION_TYPE_META } from "@/lib/question-forms";

export const metadata: Metadata = { title: "Stimulus" };

export default async function AdminStimulusPage() {
  const stimuli = await listStimuli();
  return (
    <div className="flex flex-col gap-8">
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
        {stimuli.length === 0 && (
          <li className="surface-card px-6 py-12 text-center text-sm text-muted-foreground">
            Belum ada stimulus. Buat lewat &ldquo;Stimulus baru&rdquo; di atas, atau lewat sheet Stimulus saat import Excel.
          </li>
        )}
        {stimuli.map((st) => {
          const questions = st.questions;
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
                          {q.order}
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
