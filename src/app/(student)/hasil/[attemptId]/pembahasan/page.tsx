import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { BookOpenText, ChevronRight } from "lucide-react";
import { ReportQuestionButton, reportTargetOf } from "@/components/hasil/report-question-button";
import { ReviewCard } from "@/components/hasil/review-card";
import { RichHtml } from "@/components/tes/rich-html";
import { QuestionImage } from "@/components/tes/question-image";
import { cn } from "@/lib/utils";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { attempts } from "@/server/db/schema";
import { reviewStatus } from "@/lib/review";
import { getAttemptReview } from "@/server/queries/attempt-review";

export const metadata: Metadata = { title: "Pembahasan" };
export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "semua", label: "Semua" },
  { key: "salah", label: "Salah" },
  { key: "kosong", label: "Kosong" },
  { key: "benar", label: "Benar" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];


export default async function PembahasanPage({ params, searchParams }: PageProps<"/hasil/[attemptId]/pembahasan">) {
  const { attemptId: attemptIdParam } = await params;
  const attemptId = Number(attemptIdParam);
  if (!Number.isInteger(attemptId) || attemptId <= 0) notFound();

  const { user } = await requireUser(`/hasil/${attemptId}/pembahasan`);

  // Kunci tidak boleh terlihat selama attempt berjalan → kembalikan ke ujian.
  const [attemptRow] = await db.select({ testPackageId: attempts.testPackageId, status: attempts.status }).from(attempts).where(eq(attempts.id, attemptId));
  if (attemptRow?.status === "in_progress") redirect(`/tes/${attemptRow.testPackageId}`);

  const review = await getAttemptReview(attemptId, Number(user.id));
  if (!review) notFound();

  const { filter: filterParam } = await searchParams;
  const filter: FilterKey = FILTERS.some((f) => f.key === filterParam) ? (filterParam as FilterKey) : "semua";
  const counts = { semua: review.items.length, benar: 0, salah: 0, kosong: 0 };
  for (const item of review.items) counts[reviewStatus(item)]++;
  const visible = filter === "semua" ? review.items : review.items.filter((i) => reviewStatus(i) === filter);
  const stimuli = new Map(review.stimuli.map((s) => [s.id, s]));

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground">
          Dashboard
        </Link>
        <ChevronRight className="size-4" aria-hidden />
        <Link href={`/hasil/${attemptId}`} className="hover:text-foreground">
          Hasil Tes
        </Link>
        <ChevronRight className="size-4" aria-hidden />
        <span className="font-medium text-foreground">Pembahasan</span>
      </nav>

      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-[1.75rem]">Pembahasan: {review.packageTitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Bandingkan jawabanmu dengan kunci, lalu baca pembahasannya. Mulai dari soal yang salah supaya paling efektif.
        </p>
      </header>

      <nav aria-label="Saring soal" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "semua" ? `/hasil/${attemptId}/pembahasan` : `/hasil/${attemptId}/pembahasan?filter=${f.key}`}
            aria-current={filter === f.key ? "page" : undefined}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              filter === f.key ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
            )}
          >
            {f.label} <span className="tabular-nums opacity-80">({counts[f.key]})</span>
          </Link>
        ))}
      </nav>

      {visible.length === 0 ? (
        <p className="surface-card px-6 py-10 text-center text-sm text-muted-foreground">Tidak ada soal di kategori ini.</p>
      ) : (
        <ol className="flex flex-col gap-6">
          {visible.map((item, idx) => {
            const stimulus = item.stimulusId != null ? stimuli.get(item.stimulusId) : undefined;
            const prev = visible[idx - 1];
            const showStimulus = stimulus && prev?.stimulusId !== item.stimulusId;
            return (
              <li key={item.questionId} className="flex flex-col gap-3">
                {showStimulus && (
                  <details className="surface-card group p-5" open>
                    <summary className="flex cursor-pointer items-center gap-2 font-semibold">
                      <BookOpenText className="size-4 text-primary" aria-hidden /> Stimulus: {stimulus.title}
                    </summary>
                    <div className="mt-3 leading-relaxed">
                      <RichHtml html={stimulus.html} />
                      {stimulus.imageUrl && <QuestionImage src={stimulus.imageUrl} alt={`Gambar stimulus ${stimulus.title}`} className="mt-4" />}
                    </div>
                  </details>
                )}
                <ReviewCard item={item} footer={<ReportQuestionButton target={reportTargetOf(item)} />} />
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
