import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Check, Crown, Lock } from "lucide-react";
import { BrandMark } from "@/components/brand/logo";
import { ExamShell } from "@/components/tes/exam-shell";
import { Button } from "@/components/ui/button";
import type { ExamAnswerState } from "@/lib/exam";
import { saveAnswerAction, submitAttemptAction } from "@/server/actions/attempts";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { attemptAnswers, attempts } from "@/server/db/schema";
import { getPackageDetailCached } from "@/server/queries/packages";
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

  const pkg = await getPackageDetailCached(packageId);
  if (!pkg) notFound();

  const started = await startOrResumeAttempt(userId, packageId, user.role === "admin" ? null : (user.jenjang ?? null), user.role === "admin");
  if (!started.ok && started.reason) {
    return <PremiumGate reason={started.reason} message={started.error} />;
  }
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

/** Halaman ajakan Premium saat paket terkunci (paket Premium / kuota gratis mapel habis). */
function PremiumGate({ reason, message }: { reason: "premium" | "free_quota"; message: string }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-primary-soft to-background px-4 py-10">
      <div className="surface-card flex w-full max-w-md flex-col items-center gap-5 p-6 text-center sm:p-8">
        <BrandMark className="h-8 w-auto" />
        <span className="flex size-14 items-center justify-center rounded-full bg-warning-soft text-warning-strong">
          <Lock className="size-6" aria-hidden />
        </span>
        <div>
          <h1 className="text-xl font-extrabold sm:text-2xl">{reason === "free_quota" ? "Kuota gratis mapel ini sudah terpakai" : "Paket ini khusus Premium"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        </div>
        <ul className="flex w-full flex-col gap-2 rounded-xl bg-muted/60 p-4 text-left text-sm">
          {["Semua paket tes Premium di jenjangmu", "Pembahasan lengkap setiap soal", "Statistik kelemahan per subtopik", "Latihan kelemahan otomatis"].map((b) => (
            <li key={b} className="flex items-start gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-success-strong" aria-hidden /> {b}
            </li>
          ))}
        </ul>
        <div className="flex w-full flex-col gap-2">
          <Button size="lg" variant="cta" className="w-full" nativeButton={false} render={<Link href="/langganan" />}>
            <Crown aria-hidden /> Tingkatkan ke Premium
          </Button>
          <Button variant="ghost" className="w-full" nativeButton={false} render={<Link href="/dashboard" />}>
            Kembali ke Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
