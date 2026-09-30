import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUp, ChevronDown, Dumbbell, TriangleAlert } from "lucide-react";
import { ScoreTrend } from "@/components/analytics/score-trend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DIAGNOSIS_STATUS, type DiagnosisStatusKey } from "@/lib/format";
import { cn } from "@/lib/utils";
import { requireUser } from "@/server/auth/session";
import { getStudentProgress, type PrioritySubdomain, type ProgressSubject } from "@/server/queries/progress";
import type { SubtopicDiagnosis } from "@/server/services/diagnosis";

export const metadata: Metadata = { title: "Progres Kemampuan" };
export const dynamic = "force-dynamic";

const LEGEND: DiagnosisStatusKey[] = ["baik", "cukup", "perlu_latihan", "insufficient", "untested"];

export default async function ProgresPage() {
  const { user } = await requireUser("/progres");
  const progress = await getStudentProgress(Number(user.id));

  if (progress.testCount === 0) {
    return (
      <div className="flex flex-col gap-6">
        <Header />
        <section className="surface-card flex flex-col items-center gap-4 px-6 py-16 text-center">
          <p className="max-w-md text-sm text-muted-foreground">
            Peta kemampuanmu muncul setelah kamu menyelesaikan tes pertama. Setiap tes memperbarui diagnosa per subdomain.
          </p>
          <Button nativeButton={false} render={<Link href="/dashboard#paket-heading" />}>
            Pilih paket tes <ArrowRight aria-hidden />
          </Button>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <Header />

      <section aria-label="Ringkasan" className="surface-card p-6 text-base leading-relaxed">
        <Summary progress={progress} />
      </section>

      {progress.priorities.length > 0 && (
        <section aria-labelledby="prioritas-heading" className="flex flex-col gap-4">
          <div>
            <h2 id="prioritas-heading" className="text-xl font-bold">
              Prioritas latihan
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Subdomain dengan akurasi terendah dari soal-soal terbarumu. Kuasai ini dulu supaya skor naik paling cepat.
            </p>
          </div>
          <ol className="grid gap-4 md:grid-cols-3">
            {progress.priorities.map((p, i) => (
              <li key={p.subtopicId} className="surface-card flex flex-col gap-2 p-5">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-destructive">
                  <TriangleAlert className="size-3.5" aria-hidden /> Prioritas #{i + 1}
                </span>
                <h3 className="font-bold leading-snug">{p.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {p.jenjang} · {p.subject} · {p.domain}
                </p>
                <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
                  <span className="text-2xl font-bold tabular-nums">{p.diagnosis.accuracy}%</span>
                  <StatusBadge status={p.diagnosis.status} />
                  <Delta diagnosis={p.diagnosis} />
                </div>
                <Button size="sm" variant="outline" className="mt-2" nativeButton={false} render={<Link href={`/latihan?sub=${p.subtopicId}`} />}>
                  <Dumbbell aria-hidden /> Latih subdomain ini
                </Button>
              </li>
            ))}
          </ol>
          <div>
            <Button nativeButton={false} render={<Link href="/latihan" />}>
              <Dumbbell aria-hidden /> Latihan ketiganya sekaligus
            </Button>
          </div>
        </section>
      )}

      {progress.scoreTrend.length > 1 && (
        <section className="surface-card p-6">
          <h2 className="text-lg font-bold">Tren skor tes</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {progress.scoreTrend.length} tes terakhir, skala 0–100. Arahkan kursor ke titik untuk detail.
          </p>
          <div className="mt-6">
            <ScoreTrend points={progress.scoreTrend} />
          </div>
        </section>
      )}

      <section aria-labelledby="peta-heading" className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="peta-heading" className="text-xl font-bold">
              Peta kemampuan per subdomain
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Akurasi dihitung dari ±20 soal terbaru tiap subdomain, supaya kemajuanmu cepat terlihat.
            </p>
          </div>
          <ul className="flex flex-wrap gap-2 text-xs" aria-label="Keterangan status">
            {LEGEND.map((s) => (
              <li key={s}>
                <Badge variant={DIAGNOSIS_STATUS[s].variant}>{DIAGNOSIS_STATUS[s].label}</Badge>
              </li>
            ))}
          </ul>
        </div>
        {progress.subjects.map((subject, i) => (
          <SubjectMap key={subject.id} subject={subject} defaultOpen={i === 0} />
        ))}
      </section>
    </div>
  );
}

function Header() {
  return (
    <header>
      <h1 className="text-2xl font-bold tracking-tight sm:text-[1.75rem]">Progres Kemampuan</h1>
      <p className="mt-1 text-muted-foreground">
        Diagnosa kekuatan dan kelemahanmu per subdomain dari seluruh tes dan latihan yang sudah kamu kerjakan.{" "}
        <Link href="/riwayat" className="font-semibold text-primary hover:underline">
          Lihat riwayat tes
        </Link>
      </p>
    </header>
  );
}

function Summary({
  progress,
}: {
  progress: { priorities: PrioritySubdomain[]; strongest: PrioritySubdomain | null; testCount: number; practiceCount: number };
}) {
  const weakest = progress.priorities[0];
  const strong = progress.strongest;
  const change = weakest?.diagnosis.previousAccuracy != null ? weakest.diagnosis.accuracy - weakest.diagnosis.previousAccuracy : null;
  return (
    <p>
      Dari <strong>{progress.testCount} tes</strong>
      {progress.practiceCount > 0 && (
        <>
          {" "}
          dan <strong>{progress.practiceCount} latihan</strong>
        </>
      )}{" "}
      yang sudah kamu kerjakan
      {strong ? (
        <>
          , kamu paling kuat di <strong>{strong.name}</strong> ({strong.diagnosis.accuracy}%)
        </>
      ) : (
        <>, belum ada subdomain yang mencapai kategori Baik</>
      )}
      .{" "}
      {weakest ? (
        <>
          Paling perlu dilatih: <strong>{weakest.name}</strong> ({weakest.diagnosis.accuracy}%)
          {change != null && change !== 0 && (
            <>
              {" "}
              — {change > 0 ? "naik" : "turun"} {Math.abs(change)} poin dari sebelumnya
            </>
          )}
          .
        </>
      ) : (
        <>
          {strong
            ? "Tidak ada subdomain yang berstatus Perlu latihan atau Cukup — pertahankan!"
            : "Soal per subdomain masih sedikit (minimal 3 soal) — kerjakan tes lagi supaya diagnosanya lebih akurat."}
        </>
      )}
    </p>
  );
}

function StatusBadge({ status }: { status: DiagnosisStatusKey }) {
  const meta = DIAGNOSIS_STATUS[status];
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

/** Perubahan akurasi dibanding sebelum tes terakhir — ikon + teks, bukan warna saja. */
function Delta({ diagnosis }: { diagnosis: SubtopicDiagnosis }) {
  if (diagnosis.previousAccuracy == null) return null;
  const diff = diagnosis.accuracy - diagnosis.previousAccuracy;
  if (diff === 0) return <span className="text-xs text-muted-foreground">tetap</span>;
  const Icon = diff > 0 ? ArrowUp : ArrowDown;
  return (
    <span className={cn("flex items-center gap-0.5 text-xs font-semibold tabular-nums", diff > 0 ? "text-success-strong" : "text-destructive")}>
      <Icon className="size-3.5" aria-hidden />
      {diff > 0 ? "naik" : "turun"} {Math.abs(diff)} poin
    </span>
  );
}

function SubjectMap({ subject, defaultOpen }: { subject: ProgressSubject; defaultOpen: boolean }) {
  return (
    <details open={defaultOpen} className="surface-card group">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5">
        <div>
          <div className="text-xs font-medium text-muted-foreground">TKA {subject.jenjang}</div>
          <h3 className="text-lg font-bold">{subject.name}</h3>
          <div className="text-xs text-muted-foreground">
            {subject.tested} dari {subject.total} subdomain sudah diuji
          </div>
        </div>
        <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="flex flex-col gap-6 border-t px-5 py-5">
        {subject.domains.map((domain) => (
          <div key={domain.id}>
            <h4 className="text-sm font-semibold">{domain.name}</h4>
            <ul className="mt-2 flex flex-col divide-y">
              {domain.subdomains.map((s) => {
                const d = s.diagnosis;
                return (
                  <li key={s.id} className="grid gap-2 py-3 sm:grid-cols-[minmax(0,1fr)_12rem_auto] sm:items-center sm:gap-6">
                    <span className={cn("text-sm", !d && "text-muted-foreground")}>{s.name}</span>
                    {d ? (
                      <div className="flex items-center gap-3">
                        <div className="h-2 flex-1 rounded-full bg-muted" aria-hidden>
                          <div className="h-2 rounded-full bg-primary" style={{ width: `${d.accuracy}%` }} />
                        </div>
                        <span className="w-10 text-right text-sm font-bold tabular-nums">{d.accuracy}%</span>
                      </div>
                    ) : (
                      <span className="hidden sm:block" />
                    )}
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      {d && <span className="text-xs text-muted-foreground tabular-nums">{d.windowQuestions} soal</span>}
                      {d && <Delta diagnosis={d} />}
                      <StatusBadge status={d ? d.status : "untested"} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </details>
  );
}
