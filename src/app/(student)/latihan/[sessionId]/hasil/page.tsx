import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpenText, ChevronRight, Dumbbell, PlayCircle } from "lucide-react";
import { ReportQuestionButton, reportTargetOf } from "@/components/hasil/report-question-button";
import { ReviewCard } from "@/components/hasil/review-card";
import { RichHtml } from "@/components/tes/rich-html";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DIAGNOSIS_STATUS, formatDateTime, scoreTone } from "@/lib/format";
import { requireUser } from "@/server/auth/session";
import { getPracticeChanges, getPracticeSession, type PracticeSubtopicChange } from "@/server/queries/practice";
import type { SubtopicDiagnosis } from "@/server/services/diagnosis";

export const metadata: Metadata = { title: "Ringkasan Latihan" };
export const dynamic = "force-dynamic";

export default async function LatihanHasilPage({ params }: PageProps<"/latihan/[sessionId]/hasil">) {
  const { sessionId: raw } = await params;
  const sessionId = Number(raw);
  if (!Number.isInteger(sessionId) || sessionId <= 0) notFound();

  const { user } = await requireUser(`/latihan/${sessionId}/hasil`);
  const userId = Number(user.id);
  const session = await getPracticeSession(sessionId, userId);
  if (!session) notFound();

  const changes = await getPracticeChanges(userId, session);
  const answered = session.items.filter((i) => i.review);
  const correct = answered.filter((i) => i.review!.isCorrect).length;
  const score = answered.length ? Math.round((correct / answered.length) * 100) : 0;
  const tone = scoreTone(score);
  const stimuli = new Map(session.stimuli.map((s) => [s.id, s]));
  const reviews = answered.map((i) => i.review!);

  return (
    <div className="flex flex-col gap-8">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/latihan" className="hover:text-foreground">
          Latihan
        </Link>
        <ChevronRight className="size-4" aria-hidden />
        <span className="font-medium text-foreground">Ringkasan</span>
      </nav>

      {session.status === "in_progress" && (
        <section className="surface-card flex flex-col gap-3 border-primary/40 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">Latihan ini belum selesai — {session.items.length - answered.length} soal belum dijawab.</p>
          <Button nativeButton={false} render={<Link href={`/latihan/${sessionId}`} />}>
            <PlayCircle aria-hidden /> Lanjutkan
          </Button>
        </section>
      )}

      <section aria-label="Skor latihan" className="surface-card grid gap-6 p-6 sm:p-8 lg:grid-cols-[auto_1fr] lg:items-center lg:gap-12">
        <div className="flex flex-col items-start gap-2">
          <Badge variant="info">
            <Dumbbell aria-hidden /> Latihan Kelemahan
          </Badge>
          <span className="mt-2 text-sm font-medium text-muted-foreground">Benar</span>
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-extrabold tracking-tight text-primary tabular-nums">{correct}</span>
            <span className="text-lg text-muted-foreground">/ {answered.length} soal</span>
          </div>
          {answered.length > 0 && <Badge variant={tone.variant}>{score}% · {tone.label}</Badge>}
          <span className="text-xs text-muted-foreground">
            {formatDateTime(session.completedAt ?? session.startedAt)}
            {session.status === "abandoned" && " · tidak diselesaikan"}
          </span>
        </div>

        <div>
          <h1 className="text-xl font-bold">Perubahan kemampuanmu</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Diagnosa subdomain sebelum dan sesudah latihan ini (±20 soal terbaru, tes & latihan).
          </p>
          <ul className="mt-4 flex flex-col divide-y">
            {changes.map((c) => (
              <ChangeRow key={c.subtopicId} change={c} />
            ))}
          </ul>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <Button size="lg" nativeButton={false} render={<Link href="/latihan" />}>
          Latihan lagi <ArrowRight aria-hidden />
        </Button>
        <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/progres" />}>
          Lihat progres
        </Button>
      </div>

      {reviews.length > 0 && (
        <section aria-labelledby="pembahasan-heading" className="flex flex-col gap-4">
          <h2 id="pembahasan-heading" className="text-xl font-bold">
            Pembahasan
          </h2>
          <ol className="flex flex-col gap-6">
            {reviews.map((item, idx) => {
              const stimulus = item.stimulusId != null ? stimuli.get(item.stimulusId) : undefined;
              const showStimulus = stimulus && reviews[idx - 1]?.stimulusId !== item.stimulusId;
              return (
                <li key={`${item.questionId}-${idx}`} className="flex flex-col gap-3">
                  {showStimulus && (
                    <details className="surface-card group p-5">
                      <summary className="flex cursor-pointer items-center gap-2 font-semibold">
                        <BookOpenText className="size-4 text-primary" aria-hidden /> Bacaan: {stimulus.title}
                      </summary>
                      <div className="mt-3 leading-relaxed">
                        <RichHtml html={stimulus.html} />
                      </div>
                    </details>
                  )}
                  <ReviewCard item={item} footer={<ReportQuestionButton target={reportTargetOf(item)} />} />
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </div>
  );
}

function StatusChip({ d }: { d: SubtopicDiagnosis | null }) {
  const meta = DIAGNOSIS_STATUS[d ? d.status : "untested"];
  return (
    <span className="flex items-center gap-1.5">
      {d && <span className="font-bold tabular-nums">{d.accuracy}%</span>}
      <Badge variant={meta.variant}>{meta.label}</Badge>
    </span>
  );
}

function ChangeRow({ change: c }: { change: PracticeSubtopicChange }) {
  const diff = c.before && c.after ? c.after.accuracy - c.before.accuracy : null;
  return (
    <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <div className="font-semibold">{c.name}</div>
        <div className="text-xs text-muted-foreground tabular-nums">
          {c.answered > 0 ? `${c.correct}/${c.answered} benar di latihan ini` : "Belum ada soal terjawab di latihan ini"}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <StatusChip d={c.before} />
        <ArrowRight className="size-4 text-muted-foreground" aria-label="menjadi" />
        <StatusChip d={c.after} />
        {diff != null && diff !== 0 && (
          <span className={diff > 0 ? "text-xs font-semibold text-success-strong" : "text-xs font-semibold text-destructive"}>
            {diff > 0 ? "naik" : "turun"} {Math.abs(diff)} poin
          </span>
        )}
      </div>
    </li>
  );
}
