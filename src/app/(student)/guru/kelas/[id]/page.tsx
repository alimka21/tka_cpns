import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { ArrowLeft, ClipboardList, Crown, Gauge, Lock, Users } from "lucide-react";
import { AssignmentForm, ClassSettings, ClassShare, DeleteAssignmentButton, RemoveMemberButton } from "@/components/classroom/teacher-panels";
import { StatCard } from "@/components/layout/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { classShareMessage, joinLink, PHASE } from "@/lib/classroom";
import { formatDate, formatDateTime } from "@/lib/format";
import { averageScore, formatScore, type ScoreView } from "@/lib/score-display";
import { SITE_URL } from "@/lib/site";
import { cn } from "@/lib/utils";
import { requireUser } from "@/server/auth/session";
import { isPremiumUser } from "@/server/services/access";
import { classWeakSubtopics, getClassOverview, getOwnedClass, packageChoicesFor, teacherInfo } from "@/server/services/classroom";

export const metadata: Metadata = { title: "Kelas" };
export const dynamic = "force-dynamic";

const TABS = [
  ["siswa", "Siswa"],
  ["tugas", "Tugas"],
  ["kelemahan", "Kelemahan kelas"],
  ["pengaturan", "Pengaturan"],
] as const;
type Tab = (typeof TABS)[number][0];

function Score({ score }: { score: Pick<ScoreView, "value" | "scale"> | null }) {
  if (!score) return <span className="text-muted-foreground">—</span>;
  return <span className="font-semibold tabular-nums">{formatScore(score.value)}</span>;
}

export default async function KelasGuruPage({ params, searchParams }: PageProps<"/guru/kelas/[id]">) {
  const { id } = await params;
  const classId = Number(id);
  const { user } = await requireUser(`/guru/kelas/${id}`);
  const teacherId = Number(user.id);
  if (!Number.isInteger(classId) || classId <= 0) notFound();
  if (!(await teacherInfo(teacherId)).isTeacher) redirect("/guru");
  const cls = await getOwnedClass(teacherId, classId);
  if (!cls) notFound();

  const sp = await searchParams;
  const tab: Tab = TABS.some(([k]) => k === sp.tab) ? (sp.tab as Tab) : "siswa";
  const [{ roster, assignments }, teacherPremium] = await Promise.all([getClassOverview(cls), isPremiumUser({ id: teacherId, role: user.role }, cls.jenjang)]);

  const link = joinLink(SITE_URL, cls.joinCode);
  const qrPng = await QRCode.toDataURL(link, { width: 480, margin: 1 });
  const premiumCount = roster.filter((r) => r.premium).length;
  const classAvg = averageScore(roster.flatMap((r) => (r.average ? [{ ...r.average, position: 0, category: null, istimewa: false }] : [])));
  const activeAssignments = assignments.filter((a) => a.phase !== "closed").length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Button variant="link" className="self-start px-0" nativeButton={false} render={<Link href="/guru" />}>
          <ArrowLeft aria-hidden /> Semua kelas
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-[1.75rem]">{cls.name}</h1>
          <Badge variant="info">{cls.jenjang}</Badge>
          {cls.archivedAt && <Badge variant="muted">Diarsipkan</Badge>}
        </div>
      </div>

      <section className="surface-card p-5">
        <ClassShare code={cls.joinCode} link={link} waText={classShareMessage(cls.name, cls.joinCode, link)} qrPng={qrPng} archived={cls.archivedAt != null} />
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Siswa" value={String(roster.length)} icon={Users} />
        <StatCard label="Siswa Premium" value={String(premiumCount)} icon={Crown} tone="cta" hint={`${roster.length - premiumCount} akun gratis`} />
        <StatCard label="Rata-rata skor tes" value={classAvg ? formatScore(classAvg.value) : "—"} icon={Gauge} tone="success" hint="Rata-rata per siswa" />
        <StatCard label="Tugas aktif" value={String(activeAssignments)} icon={ClipboardList} tone="muted" hint={`${assignments.length} tugas total`} />
      </div>

      <nav aria-label="Bagian kelas" className="flex flex-wrap gap-1 border-b">
        {TABS.map(([key, label]) => (
          <Link
            key={key}
            href={`/guru/kelas/${cls.id}?tab=${key}`}
            aria-current={tab === key ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 border-transparent px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground",
              tab === key && "border-primary text-primary",
            )}
          >
            {label}
          </Link>
        ))}
      </nav>

      {tab === "siswa" && (
        <section className="surface-card overflow-x-auto p-0">
          {roster.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">Belum ada siswa. Bagikan kode atau link kelas di atas.</p>
          ) : (
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Siswa</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Tes</th>
                  <th className="px-4 py-3 text-right">Latihan</th>
                  <th className="px-4 py-3 text-right">Rata-rata</th>
                  <th className="px-4 py-3 text-right">Tes terakhir</th>
                  <th className="px-4 py-3">Aktivitas terakhir</th>
                  <th className="px-2 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {roster.map((r) => (
                  <tr key={r.userId}>
                    <td className="px-4 py-3">
                      <Link href={`/guru/kelas/${cls.id}/siswa/${r.userId}`} className="font-semibold text-primary hover:underline">
                        {r.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {r.username ? `@${r.username}` : ""}
                        {r.school ? ` · ${r.school}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={r.premium ? "warning" : "muted"}>{r.premium ? "Premium" : "Gratis"}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{r.testCount}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{r.practiceCount}</td>
                    <td className="px-4 py-3 text-right">
                      <Score score={r.average} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Score score={r.last} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{r.lastActivity ? formatDate(r.lastActivity) : "Belum ada"}</td>
                    <td className="px-2 py-3 text-right">
                      <RemoveMemberButton classId={cls.id} userId={r.userId} name={r.name} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {tab === "tugas" && <AssignmentsTab classId={cls.id} jenjang={cls.jenjang} assignments={assignments} nonPremiumCount={roster.length - premiumCount} />}

      {tab === "kelemahan" &&
        (teacherPremium ? (
          <WeaknessTab userIds={roster.map((r) => r.userId)} />
        ) : (
          <section className="surface-card flex flex-col items-start gap-3 p-5">
            <p className="flex items-center gap-2 font-bold">
              <Lock className="size-4" aria-hidden /> Analisis kelemahan kelas khusus guru Premium
            </p>
            <p className="text-sm text-muted-foreground">
              Lihat subdomain yang paling banyak membuat siswa Anda kesulitan, digabung dari seluruh tes dan latihan mereka.
            </p>
            <Button variant="cta" nativeButton={false} render={<Link href="/langganan" />}>
              Lihat Premium
            </Button>
          </section>
        ))}

      {tab === "pengaturan" && (
        <section className="surface-card flex flex-col gap-3 p-5">
          <h2 className="font-bold">Pengaturan kelas</h2>
          <p className="text-sm text-muted-foreground">Dibuat {formatDate(cls.createdAt.toISOString())}.</p>
          <ClassSettings classId={cls.id} name={cls.name} archived={cls.archivedAt != null} />
        </section>
      )}
    </div>
  );
}

async function AssignmentsTab({
  classId,
  jenjang,
  assignments,
  nonPremiumCount,
}: {
  classId: number;
  jenjang: "SD" | "SMP" | "SMA";
  assignments: Awaited<ReturnType<typeof getClassOverview>>["assignments"];
  nonPremiumCount: number;
}) {
  const packages = await packageChoicesFor(jenjang);
  return (
    <div className="flex flex-col gap-6">
      <section className="surface-card flex flex-col gap-3 p-5">
        <div>
          <h2 className="font-bold">Buat tugas</h2>
          <p className="text-sm text-muted-foreground">
            Tugas tampil di menu Kelas siswa. Hanya tes yang dimulai setelah waktu mulai (dan dikumpulkan sebelum batas waktu) yang dihitung.
          </p>
        </div>
        <AssignmentForm classId={classId} packages={packages} nonPremiumCount={nonPremiumCount} />
      </section>

      {assignments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada tugas.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {assignments.map((a) => (
            <li key={a.id} className="surface-card p-5">
              <details>
                <summary className="flex cursor-pointer list-none flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold">{a.title}</h3>
                      <Badge variant={PHASE[a.phase].variant}>{PHASE[a.phase].label}</Badge>
                      {a.isPremium && <Badge variant="warning">Premium</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {a.subjectName ? `${a.subjectName} · ` : ""}Mulai {formatDateTime(a.startsAt)}
                      {a.dueAt ? ` · Batas ${formatDateTime(a.dueAt)}` : ""}
                    </p>
                    {a.note && <p className="mt-1 text-sm">{a.note}</p>}
                  </div>
                  <span className="text-sm font-semibold tabular-nums">
                    {a.done}/{a.results.length} selesai
                  </span>
                </summary>
                <ul className="mt-4 divide-y border-t text-sm">
                  {a.results.map((r) => (
                    <li key={r.userId} className="flex items-center justify-between gap-3 py-2">
                      <span>{r.name}</span>
                      {r.score ? (
                        <span className="flex items-center gap-2">
                          <Score score={r.score} />
                          <span className="text-xs text-muted-foreground">{r.submittedAt ? formatDateTime(r.submittedAt) : ""}</span>
                        </span>
                      ) : r.locked ? (
                        <Badge variant="muted">Terkunci (akun gratis)</Badge>
                      ) : (
                        <Badge variant="outline">Belum</Badge>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex justify-end">
                  <DeleteAssignmentButton classId={classId} assignmentId={a.id} title={a.title} />
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

async function WeaknessTab({ userIds }: { userIds: number[] }) {
  const rows = await classWeakSubtopics(userIds);
  if (rows.length === 0) {
    return <p className="surface-card p-5 text-sm text-muted-foreground">Belum cukup data. Analisis muncul setelah siswa mengerjakan tes atau latihan.</p>;
  }
  return (
    <section className="surface-card overflow-x-auto p-0">
      <p className="border-b p-4 text-sm text-muted-foreground">
        Diurutkan dari akurasi rata-rata terendah. Status tiap siswa dihitung dari ±20 soal terbaru per subdomain (tes + latihan).
      </p>
      <table className="w-full min-w-[720px] text-sm">
        <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Subdomain</th>
            <th className="px-4 py-3 text-right">Akurasi rata-rata</th>
            <th className="px-4 py-3 text-right">Perlu latihan</th>
            <th className="px-4 py-3 text-right">Cukup</th>
            <th className="px-4 py-3 text-right">Kuat</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.slice(0, 40).map((r) => (
            <tr key={r.subtopicId}>
              <td className="px-4 py-3">
                <p className="font-medium leading-snug">{r.name}</p>
                <p className="text-xs text-muted-foreground">
                  {r.subject} · {r.domain}
                </p>
              </td>
              <td className={cn("px-4 py-3 text-right font-semibold tabular-nums", r.avgAccuracy < 50 ? "text-destructive" : r.avgAccuracy < 75 ? "text-warning-strong" : "text-success-strong")}>
                {r.avgAccuracy}%
              </td>
              <td className="px-4 py-3 text-right tabular-nums">{r.weak}</td>
              <td className="px-4 py-3 text-right tabular-nums">{r.fair}</td>
              <td className="px-4 py-3 text-right tabular-nums">{r.strong}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
