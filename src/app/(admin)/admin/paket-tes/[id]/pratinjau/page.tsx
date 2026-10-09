import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpenText, ChevronRight, CircleAlert, CircleCheck, Clock, FileQuestion, Flag, Pencil, Settings2, Sparkles, TriangleAlert, X } from "lucide-react";
import { ApproveQuestionButton } from "@/components/admin/package-preview/approve-question-button";
import { StudentPreview } from "@/components/admin/package-preview/student-preview";
import { PackageStatusButton } from "@/components/admin/package-list-actions";
import { ReviewCard } from "@/components/hasil/review-card";
import { QuestionImage } from "@/components/tes/question-image";
import { RichHtml } from "@/components/tes/rich-html";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { requireAdmin } from "@/server/auth/session";
import { loadPreviewMeta, type PreviewQuestionMeta } from "@/server/queries/package-preview";
import { getPackageDetail, listSubjects } from "@/server/queries/packages";
import { renderRichText, toExamQuestion, toExamStimulus } from "@/server/services/math-render";
import { packageRuleReport } from "@/server/services/package-rules-check";
import { buildReviewItem } from "@/server/services/review";

export const metadata: Metadata = { title: "Pratinjau Paket" };
export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "semua", label: "Semua", match: () => true },
  { key: "tinjau", label: "Perlu tinjauan", match: (m: PreviewQuestionMeta) => m.status !== "published" },
  { key: "ai", label: "Buatan AI", match: (m: PreviewQuestionMeta) => m.generatedBy === "ai" },
  { key: "tanpa-pembahasan", label: "Tanpa pembahasan", match: (m: PreviewQuestionMeta) => !m.explanation?.trim() },
  { key: "dilaporkan", label: "Dilaporkan", match: (m: PreviewQuestionMeta) => m.openReports > 0 },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

const STATUS_BADGE = {
  published: { variant: "success", label: "Tayang" },
  pending_review: { variant: "warning", label: "Menunggu tinjauan" },
  draft: { variant: "muted", label: "Draf" },
} as const;
const SOURCE_LABEL = { ai: "Buatan AI", import: "Impor", manual: "Manual" } as const;
const DIFFICULTY_LABEL = { easy: "Mudah", medium: "Sedang", hard: "Sulit" } as const;

export default async function PratinjauPaketPage({ params, searchParams }: PageProps<"/admin/paket-tes/[id]/pratinjau">) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) notFound();
  await requireAdmin(`/admin/paket-tes/${id}/pratinjau`);

  const pkg = await getPackageDetail(id);
  if (!pkg) notFound();
  const questionIds = pkg.questions.map((q) => q.id);
  const [meta, report, subjects] = await Promise.all([
    loadPreviewMeta(questionIds),
    packageRuleReport({ categoryId: pkg.categoryId, subjectId: pkg.subjectId, durationMinutes: pkg.durationMinutes, questionIds }),
    listSubjects(),
  ]);
  const subjectName = subjects.find((s) => s.id === pkg.subjectId)?.name;

  const sp = await searchParams;
  const mode = sp.mode === "siswa" ? "siswa" : "kunci";
  const filter: FilterKey = FILTERS.some((f) => f.key === sp.filter) ? (sp.filter as FilterKey) : "semua";
  const base = `/admin/paket-tes/${id}/pratinjau`;

  const metas = pkg.questions.map((q) => meta.get(q.id)!);
  const pending = metas.filter((m) => m.status !== "published").length;
  const noExplanation = metas.filter((m) => !m.explanation?.trim()).length;
  const reported = metas.filter((m) => m.openReports > 0).length;
  const aiCount = metas.filter((m) => m.generatedBy === "ai").length;
  const counts = Object.fromEntries(FILTERS.map((f) => [f.key, metas.filter((m) => f.match(m)).length])) as Record<FilterKey, number>;

  const verdict = !report.publishable
    ? { tone: "danger", icon: X, title: "Belum bisa diterbitkan", text: "Ada aturan wajib paket yang belum terpenuhi." }
    : reported > 0 || noExplanation > 0
      ? { tone: "warning", icon: TriangleAlert, title: "Bisa diterbitkan, tapi ada yang perlu dicek", text: "Aturan wajib terpenuhi. Periksa catatan di bawah sebelum launching." }
      : { tone: "success", icon: CircleCheck, title: "Siap diterbitkan", text: "Aturan wajib terpenuhi dan semua soal punya pembahasan." };
  const VerdictIcon = verdict.icon;

  const stimuli = new Map(pkg.stimuli.map((s) => [s.id, s]));

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/admin/paket-tes" className="hover:text-foreground">
          Paket Tes
        </Link>
        <ChevronRight className="size-4" aria-hidden />
        <Link href={`/admin/paket-tes/${id}`} className="hover:text-foreground">
          {pkg.title}
        </Link>
        <ChevronRight className="size-4" aria-hidden />
        <span className="font-medium text-foreground">Pratinjau</span>
      </nav>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info">{pkg.categoryCode}</Badge>
            {subjectName && <Badge variant="muted">{subjectName}</Badge>}
            <Badge variant={pkg.status === "published" ? "success" : "muted"}>{pkg.status === "published" ? "Tayang" : "Draft"}</Badge>
            {pkg.isPremium && <Badge variant="warning">Premium</Badge>}
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-[1.75rem]">Pratinjau: {pkg.title}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <FileQuestion className="size-4" aria-hidden /> {pkg.questions.length} soal
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="size-4" aria-hidden /> {pkg.durationMinutes} menit
            </span>
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-start gap-2">
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/admin/soal?paket=${id}`} />}>
            <FileQuestion aria-hidden /> Soal di Bank
          </Button>
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/admin/paket-tes/${id}`} />}>
            <Settings2 aria-hidden /> Kelola paket
          </Button>
          <PackageStatusButton id={id} status={pkg.status} />
        </div>
      </header>

      {/* Kesiapan terbit */}
      <section className="surface-card flex flex-col gap-4 p-5 sm:p-6" aria-labelledby="kesiapan">
        <div
          className={cn(
            "flex items-start gap-3 rounded-xl p-4",
            verdict.tone === "danger" && "bg-destructive/10 text-destructive",
            verdict.tone === "warning" && "bg-warning/15 text-warning-strong",
            verdict.tone === "success" && "bg-success/15 text-success-strong",
          )}
        >
          <VerdictIcon className="mt-0.5 size-5 shrink-0" aria-hidden />
          <div>
            <h2 id="kesiapan" className="font-bold">
              {verdict.title}
            </h2>
            <p className="text-sm opacity-90">{verdict.text}</p>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Menunggu tinjauan" value={pending} hint={pending ? "ikut terbit saat paket diterbitkan" : "semua sudah tayang"} warn={pending > 0} />
          <Stat label="Tanpa pembahasan" value={noExplanation} warn={noExplanation > 0} />
          <Stat label="Laporan terbuka" value={reported} warn={reported > 0} />
          <Stat label="Buatan AI" value={aiCount} hint="periksa kunci & pembahasannya" />
        </dl>

        <div className="grid gap-4 md:grid-cols-2">
          <RuleList title="Aturan wajib" checks={report.required} strict />
          <RuleList title="Saran (tidak memblokir)" checks={report.recommended} />
        </div>
      </section>

      {/* Mode */}
      <nav aria-label="Mode pratinjau" className="flex flex-wrap gap-2 border-b pb-3">
        {(
          [
            { key: "kunci", label: "Tinjau kunci & pembahasan" },
            { key: "siswa", label: "Tampilan siswa" },
          ] as const
        ).map((m) => (
          <Link
            key={m.key}
            href={m.key === "kunci" ? base : `${base}?mode=siswa`}
            aria-current={mode === m.key ? "page" : undefined}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
              mode === m.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {m.label}
          </Link>
        ))}
      </nav>

      {mode === "siswa" ? (
        <StudentPreview
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
          stimuli={pkg.stimuli.map((s) => toExamStimulus(s))}
          durationMinutes={pkg.durationMinutes}
        />
      ) : (
        <>
          <nav aria-label="Saring soal" className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <Link
                key={f.key}
                href={f.key === "semua" ? base : `${base}?filter=${f.key}`}
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

          {/* Lompat ke nomor soal; kuning = belum tayang, merah = dilaporkan. */}
          <div className="flex flex-wrap gap-1.5" aria-label="Lompat ke soal">
            {pkg.questions.map((q, i) => {
              const m = meta.get(q.id)!;
              return (
                <a
                  key={q.id}
                  href={`#soal-${i + 1}`}
                  title={`${STATUS_BADGE[m.status].label}${m.openReports ? " · dilaporkan" : ""}`}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-md border text-xs font-semibold tabular-nums hover:bg-muted",
                    m.status !== "published" && "border-warning bg-warning/15",
                    m.openReports > 0 && "border-destructive bg-destructive/10 text-destructive",
                  )}
                >
                  {i + 1}
                </a>
              );
            })}
          </div>

          <ol className="flex flex-col gap-6">
            {pkg.questions.map((q, i) => {
              const m = meta.get(q.id)!;
              if (!FILTERS.find((f) => f.key === filter)!.match(m)) return null;
              const stimulus = q.stimulusId != null ? stimuli.get(q.stimulusId) : undefined;
              const showStimulus = stimulus && (filter !== "semua" || pkg.questions[i - 1]?.stimulusId !== q.stimulusId);
              const item = buildReviewItem(q, null, i + 1, m.subtopicName, m.explanation);
              const status = STATUS_BADGE[m.status];
              return (
                <li key={q.id} id={`soal-${i + 1}`} className="flex scroll-mt-20 flex-col gap-3">
                  {showStimulus && (
                    <details className="surface-card p-5" open={filter === "semua"}>
                      <summary className="flex cursor-pointer items-center gap-2 font-semibold">
                        <BookOpenText className="size-4 text-primary" aria-hidden /> Stimulus: {stimulus.title}
                      </summary>
                      <div className="mt-3 leading-relaxed">
                        <RichHtml html={renderRichText(stimulus.content)} />
                        {stimulus.imageUrl && <QuestionImage src={stimulus.imageUrl} alt={`Gambar stimulus ${stimulus.title}`} className="mt-4" />}
                      </div>
                    </details>
                  )}
                  <ReviewCard
                    item={item}
                    keyOnly
                    heading={`Soal ${i + 1}`}
                    footer={
                      <div className="flex flex-col gap-3 border-t pt-4">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <Badge variant={status.variant}>{status.label}</Badge>
                          <Badge variant={m.generatedBy === "ai" ? "info" : "outline"}>
                            {m.generatedBy === "ai" && <Sparkles aria-hidden />} {SOURCE_LABEL[m.generatedBy]}
                          </Badge>
                          {m.cognitiveLevel && <Badge variant="outline">{m.cognitiveLevel}</Badge>}
                          <Badge variant="outline">{DIFFICULTY_LABEL[m.difficulty]}</Badge>
                          <span className="text-muted-foreground">{m.topicName}</span>
                          {m.openReports > 0 && (
                            <Badge variant="danger">
                              <Flag aria-hidden /> {m.openReports} laporan
                            </Badge>
                          )}
                          {!m.explanation?.trim() && (
                            <Badge variant="warning">
                              <CircleAlert aria-hidden /> Tanpa pembahasan
                            </Badge>
                          )}
                          <span className="text-muted-foreground">#{q.id}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <ApproveQuestionButton id={q.id} published={m.status === "published"} />
                          <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/admin/soal/${q.id}`} target="_blank" />}>
                            <Pencil aria-hidden /> Edit soal
                          </Button>
                          {m.openReports > 0 && (
                            <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/admin/laporan" target="_blank" />}>
                              Lihat laporan
                            </Button>
                          )}
                        </div>
                      </div>
                    }
                  />
                </li>
              );
            })}
          </ol>
          {counts[filter] === 0 && <p className="surface-card px-6 py-10 text-center text-sm text-muted-foreground">Tidak ada soal di kategori ini.</p>}
        </>
      )}
    </div>
  );
}

function Stat({ label, value, hint, warn }: { label: string; value: number; hint?: string; warn?: boolean }) {
  return (
    <div className={cn("rounded-xl border p-3", warn && "border-warning bg-warning/10")}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-xl font-bold tabular-nums">{value}</dd>
      {hint && <dd className="text-xs text-muted-foreground">{hint}</dd>}
    </div>
  );
}

function RuleList({ title, checks, strict }: { title: string; checks: { ok: boolean; label: string; detail: string }[]; strict?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="flex flex-col gap-1.5 text-sm">
        {checks.map((c) => (
          <li key={c.label} className="flex items-start gap-2">
            {c.ok ? (
              <CircleCheck className="mt-0.5 size-4 shrink-0 text-success-strong" aria-label="Terpenuhi" />
            ) : strict ? (
              <X className="mt-0.5 size-4 shrink-0 text-destructive" aria-label="Belum terpenuhi" />
            ) : (
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning-strong" aria-label="Saran belum terpenuhi" />
            )}
            <span>
              <span className={cn(!c.ok && strict && "font-semibold text-destructive")}>{c.label}</span>
              <span className="block text-xs text-muted-foreground">{c.detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
