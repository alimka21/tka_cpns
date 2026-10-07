// Tab "Soal & Pembahasan" halaman hasil: satu soal per halaman (pagination),
// panel nomor berwarna sesuai status, saring benar/salah/kosong. Server
// component — navigasi lewat query string (?tab=pembahasan&filter=…&no=…).

import Link from "next/link";
import { BookOpenText, ChevronLeft, ChevronRight } from "lucide-react";
import { ReportQuestionButton } from "@/components/hasil/report-question-button";
import { reportTargetOf } from "@/lib/report-target";
import { ReviewCard } from "@/components/hasil/review-card";
import { QuestionImage } from "@/components/tes/question-image";
import { RichHtml } from "@/components/tes/rich-html";
import { Button } from "@/components/ui/button";
import { reviewStatus, type ReviewItem } from "@/lib/review";
import { cn } from "@/lib/utils";

export const REVIEW_FILTERS = [
  { key: "semua", label: "Semua" },
  { key: "salah", label: "Salah" },
  { key: "kosong", label: "Kosong" },
  { key: "benar", label: "Benar" },
] as const;
export type ReviewFilter = (typeof REVIEW_FILTERS)[number]["key"];

const STATUS_CELL = {
  benar: "border-success/40 bg-success-soft text-success-strong",
  salah: "border-destructive/40 bg-destructive-soft text-destructive",
  kosong: "border-border bg-muted text-muted-foreground",
} as const;

export function ReviewPager({
  attemptId,
  items,
  stimuli,
  filter,
  number,
}: {
  attemptId: number;
  items: ReviewItem[];
  stimuli: {
    id: number;
    title: string;
    html: string;
    imageUrl: string | null;
  }[];
  filter: ReviewFilter;
  /** Nomor soal asli (1..n) yang dibuka. */
  number: number | null;
}) {
  const href = (f: ReviewFilter, no?: number) => {
    const q = new URLSearchParams({ tab: "pembahasan" });
    if (f !== "semua") q.set("filter", f);
    if (no != null) q.set("no", String(no));
    return `/hasil/${attemptId}?${q}`;
  };
  const counts = { semua: items.length, benar: 0, salah: 0, kosong: 0 };
  for (const item of items) counts[reviewStatus(item)]++;
  const visible =
    filter === "semua"
      ? items
      : items.filter((i) => reviewStatus(i) === filter);
  const index = Math.max(
    0,
    visible.findIndex((i) => i.number === number),
  );
  const current = visible[index];
  const prev = visible[index - 1];
  const next = visible[index + 1];
  const stimulus =
    current?.stimulusId != null
      ? stimuli.find((s) => s.id === current.stimulusId)
      : undefined;

  return (
    <div className="flex flex-col gap-5">
      <nav aria-label="Saring soal" className="flex flex-wrap gap-2">
        {REVIEW_FILTERS.map((f) => (
          <Link
            key={f.key}
            href={href(f.key)}
            scroll={false}
            aria-current={filter === f.key ? "page" : undefined}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              filter === f.key
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:bg-muted",
            )}
          >
            {f.label}{" "}
            <span className="tabular-nums opacity-80">({counts[f.key]})</span>
          </Link>
        ))}
      </nav>

      {!current ? (
        <p className="surface-card px-6 py-10 text-center text-sm text-muted-foreground">
          Tidak ada soal di kategori ini.
        </p>
      ) : (
        <>
          <nav aria-label="Nomor soal" className="surface-card p-4">
            <ol className="grid grid-cols-[repeat(auto-fill,minmax(2.5rem,1fr))] gap-2">
              {visible.map((item) => {
                const status = reviewStatus(item);
                const active = item.number === current.number;
                return (
                  <li key={item.questionId}>
                    <Link
                      href={href(filter, item.number)}
                      scroll={false}
                      aria-current={active ? "page" : undefined}
                      aria-label={`Soal ${item.number}, ${status === "benar" ? "benar" : status === "salah" ? "salah" : "tidak dijawab"}`}
                      className={cn(
                        "flex h-10 items-center justify-center rounded-lg border text-sm font-bold tabular-nums transition-shadow hover:shadow-sm",
                        STATUS_CELL[status],
                        active &&
                          "ring-2 ring-primary ring-offset-2 ring-offset-card",
                      )}
                    >
                      {item.number}
                    </Link>
                  </li>
                );
              })}
            </ol>
            <ul
              className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"
              aria-label="Keterangan warna"
            >
              <li className="flex items-center gap-1.5">
                <span
                  className="size-3 rounded border border-success/40 bg-success-soft"
                  aria-hidden
                />{" "}
                Benar
              </li>
              <li className="flex items-center gap-1.5">
                <span
                  className="size-3 rounded border border-destructive/40 bg-destructive-soft"
                  aria-hidden
                />{" "}
                Salah
              </li>
              <li className="flex items-center gap-1.5">
                <span className="size-3 rounded border bg-muted" aria-hidden />{" "}
                Kosong
              </li>
            </ul>
          </nav>

          <Pager
            at={index + 1}
            total={visible.length}
            prevHref={prev && href(filter, prev.number)}
            nextHref={next && href(filter, next.number)}
          />

          {stimulus && (
            <details className="surface-card group p-5" open>
              <summary className="flex cursor-pointer items-center gap-2 font-semibold">
                <BookOpenText className="size-4 text-primary" aria-hidden />{" "}
                Stimulus: {stimulus.title}
              </summary>
              <div className="mt-3 leading-relaxed">
                <RichHtml html={stimulus.html} />
                {stimulus.imageUrl && (
                  <QuestionImage
                    src={stimulus.imageUrl}
                    alt={`Gambar stimulus ${stimulus.title}`}
                    className="mt-4"
                  />
                )}
              </div>
            </details>
          )}

          <ReviewCard
            item={current}
            footer={<ReportQuestionButton target={reportTargetOf(current)} />}
          />

          <Pager
            at={index + 1}
            total={visible.length}
            prevHref={prev && href(filter, prev.number)}
            nextHref={next && href(filter, next.number)}
          />
        </>
      )}
    </div>
  );
}

function Pager({
  at,
  total,
  prevHref,
  nextHref,
}: {
  at: number;
  total: number;
  prevHref?: string;
  nextHref?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      {prevHref ? (
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={prevHref} scroll={false} />}
        >
          <ChevronLeft aria-hidden /> Sebelumnya
        </Button>
      ) : (
        <Button variant="outline" disabled>
          <ChevronLeft aria-hidden /> Sebelumnya
        </Button>
      )}
      <span className="text-sm text-muted-foreground tabular-nums">
        <span className="sm:hidden">
          {at}/{total}
        </span>
        <span className="hidden sm:inline">
          Soal {at} dari {total}
        </span>
      </span>
      {nextHref ? (
        <Button
          nativeButton={false}
          render={<Link href={nextHref} scroll={false} />}
        >
          Berikutnya <ChevronRight aria-hidden />
        </Button>
      ) : (
        <Button disabled>
          Berikutnya <ChevronRight aria-hidden />
        </Button>
      )}
    </div>
  );
}
