import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ExamShell } from "@/components/tes/exam-shell";
import type { ExamAnswerState } from "@/lib/exam";
import { saveAnswerAction, submitAttemptAction } from "@/server/actions/attempts";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { attemptAnswers, attempts } from "@/server/db/schema";
import { getPackageDetail } from "@/server/queries/packages";
import { startOrResumeAttempt } from "@/server/services/attempts";
import { toExamQuestion, toExamStimulus } from "@/server/services/math-render";

export const metadata: Metadata = { title: "Mengerjakan Tes" };
export const dynamic = "force-dynamic";

export default async function TesPackagePage({ params }: PageProps<"/tes/[packageId]">) {
  const { packageId: packageIdParam } = await params;
  const packageId = Number(packageIdParam);
  if (!Number.isInteger(packageId) || packageId <= 0) notFound();

  const { user } = await requireUser(`/tes/${packageId}`);
  const userId = Number(user.id);

  const pkg = await getPackageDetail(packageId);
  if (!pkg) notFound();

  const started = await startOrResumeAttempt(userId, packageId, user.role === "admin" ? null : (user.jenjang ?? null), user.role === "admin");
  if (!started.ok) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-xl font-bold">Tidak bisa memulai tes</h1>
        <p className="text-muted-foreground">{started.error}</p>
        <a href="/dashboard" className="font-semibold text-primary underline">
          Kembali ke Dashboard
        </a>
      </div>
    );
  }

  const [attempt] = await db.select().from(attempts).where(eq(attempts.id, started.attemptId));
  const savedAnswers = await db.select().from(attemptAnswers).where(eq(attemptAnswers.attemptId, started.attemptId));
  const initialAnswers: Record<number, ExamAnswerState> = {};
  for (const a of savedAnswers) {
    initialAnswers[a.questionId] = { response: a.response, isFlagged: a.isFlagged };
  }

  return (
    <ExamShell
      title={pkg.title}
      questions={pkg.questions.map((q) =>
        toExamQuestion({
          id: q.id,
          type: q.type,
          text: q.questionText,
          imageUrl: q.imageUrl,
          categoryLabels: q.categoryLabels,
          stimulusId: q.stimulusId,
          options: q.options.map((o) => ({ id: o.id, label: o.label, text: o.optionText })),
        }),
      )}
      stimuli={pkg.stimuli.map((s) => toExamStimulus({ id: s.id, title: s.title, content: s.content, imageUrl: s.imageUrl }))}
      initialAnswers={initialAnswers}
      endsAt={attempt.endsAt.toISOString()}
      serverNow={new Date().toISOString()}
      saveAnswer={saveAnswerAction.bind(null, started.attemptId)}
      submitAttempt={submitAttemptAction.bind(null, started.attemptId)}
    />
  );
}
