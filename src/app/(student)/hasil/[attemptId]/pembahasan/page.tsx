import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { BookOpenText, Check, ChevronRight, Minus, X } from "lucide-react";
import { RichHtml } from "@/components/tes/rich-html";
import { Badge } from "@/components/ui/badge";
import { QUESTION_TYPE_META } from "@/lib/question-forms";
import { cn } from "@/lib/utils";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { attempts } from "@/server/db/schema";
import { getAttemptReview, type ReviewItem, type ReviewOption } from "@/server/queries/attempt-review";

export const metadata: Metadata = { title: "Pembahasan" };
export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "semua", label: "Semua" },
  { key: "salah", label: "Salah" },
  { key: "kosong", label: "Kosong" },
  { key: "benar", label: "Benar" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

function itemStatus(item: ReviewItem): Exclude<FilterKey, "semua"> {
  if (item.isCorrect) return "benar";
  return item.completeness === "blank" ? "kosong" : "salah";
}

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
  for (const item of review.items) counts[itemStatus(item)]++;
  const visible = filter === "semua" ? review.items : review.items.filter((i) => itemStatus(i) === filter);
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
                      {stimulus.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element -- URL gambar bebas dari admin
                        <img src={stimulus.imageUrl} alt={`Gambar stimulus ${stimulus.title}`} className="mt-4 max-h-80 rounded-lg border" />
                      )}
                    </div>
                  </details>
                )}
                <ReviewCard item={item} />
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function ReviewCard({ item }: { item: ReviewItem }) {
  const status = itemStatus(item);
  const badge =
    status === "benar"
      ? { variant: "success" as const, icon: Check, label: "Benar" }
      : status === "salah"
        ? { variant: "danger" as const, icon: X, label: item.completeness === "partial" ? "Belum lengkap" : "Salah" }
        : { variant: "muted" as const, icon: Minus, label: "Tidak dijawab" };
  const Icon = badge.icon;

  return (
    <article aria-labelledby={`soal-${item.number}`} className="surface-card flex flex-col gap-5 p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id={`soal-${item.number}`} className="text-base font-bold">
          Soal {item.number}
        </h2>
        <Badge variant={badge.variant}>
          <Icon aria-hidden /> {badge.label}
        </Badge>
        <Badge variant="outline">{QUESTION_TYPE_META[item.type].short}</Badge>
        {item.subtopic && <span className="text-xs text-muted-foreground">{item.subtopic}</span>}
      </div>

      <div className="leading-relaxed">
        <RichHtml html={item.html} />
        {item.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- URL gambar bebas dari admin
          <img src={item.imageUrl} alt={`Gambar soal ${item.number}`} className="mt-4 max-h-80 rounded-lg border" />
        )}
      </div>

      {item.type === "pgk_kategori" ? <CategoryTable item={item} /> : <OptionList options={item.options} />}

      <div className="rounded-lg bg-primary-soft p-4">
        <h3 className="text-sm font-semibold text-primary">Pembahasan</h3>
        {item.explanationHtml ? (
          <div className="mt-2 text-sm leading-relaxed">
            <RichHtml html={item.explanationHtml} />
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Pembahasan untuk soal ini belum tersedia.</p>
        )}
      </div>
    </article>
  );
}

// Status tidak hanya lewat warna: setiap baris diberi teks "Kunci" / "Jawabanmu".
function OptionList({ options }: { options: ReviewOption[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {options.map((o) => {
        const wrongPick = o.chosen && !o.isKey;
        return (
          <li
            key={o.id}
            className={cn(
              "flex items-start gap-3 rounded-lg border p-3",
              o.isKey && "border-success/50 bg-success-soft",
              wrongPick && "border-destructive/40 bg-destructive-soft",
            )}
          >
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
                o.isKey && "border-success bg-success text-white",
                wrongPick && "border-destructive bg-destructive text-white",
              )}
            >
              {o.label}
            </span>
            <div className="flex flex-1 flex-col gap-1 pt-0.5">
              <RichHtml html={o.html} />
              {(o.isKey || o.chosen) && (
                <span className="flex flex-wrap gap-1.5">
                  {o.isKey && <Badge variant="success"><Check aria-hidden /> Kunci</Badge>}
                  {o.chosen && <Badge variant={o.isKey ? "success" : "danger"}>Jawabanmu</Badge>}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function CategoryTable({ item }: { item: ReviewItem }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/60 text-left">
          <tr>
            <th scope="col" className="p-3 font-semibold">Pernyataan</th>
            <th scope="col" className="p-3 font-semibold whitespace-nowrap">Jawabanmu</th>
            <th scope="col" className="p-3 font-semibold whitespace-nowrap">Kunci</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {item.options.map((o) => {
            const ok = o.chosenCategory != null && o.chosenCategory === o.keyCategory;
            return (
              <tr key={o.id}>
                <td className="p-3">
                  <RichHtml html={o.html} />
                </td>
                <td className="p-3 whitespace-nowrap">
                  {o.chosenCategory ? (
                    <Badge variant={ok ? "success" : "danger"}>
                      {ok ? <Check aria-hidden /> : <X aria-hidden />} {o.chosenCategory}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="p-3 font-semibold whitespace-nowrap">{o.keyCategory ?? "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
