import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Lock, TriangleAlert } from "lucide-react";
import { ScoreTrend } from "@/components/analytics/score-trend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DIAGNOSIS_STATUS, formatDateTime } from "@/lib/format";
import { formatScore } from "@/lib/score-display";
import { SCALE_LABEL } from "@/lib/score-scale";
import { eq } from "drizzle-orm";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { isPremiumUser } from "@/server/services/access";
import { getOwnedClass, isMemberOfOwnedClass, studentTestHistory, teacherInfo } from "@/server/services/classroom";
import { getStudentProgress } from "@/server/queries/progress";

export const metadata: Metadata = { title: "Progres Siswa" };
export const dynamic = "force-dynamic";

export default async function SiswaKelasPage({ params }: PageProps<"/guru/kelas/[id]/siswa/[userId]">) {
  const { id, userId: rawUserId } = await params;
  const classId = Number(id);
  const studentId = Number(rawUserId);
  const { user } = await requireUser(`/guru/kelas/${id}/siswa/${rawUserId}`);
  const teacherId = Number(user.id);
  if (!Number.isInteger(classId) || !Number.isInteger(studentId)) notFound();
  if (!(await teacherInfo(teacherId)).isTeacher) redirect("/guru");
  const cls = await getOwnedClass(teacherId, classId);
  // Data siswa hanya untuk guru kelas yang siswanya masih menjadi anggota.
  if (!cls || !(await isMemberOfOwnedClass(teacherId, classId, studentId))) notFound();

  const [[student], progress, history, teacherPremium, studentPremium] = await Promise.all([
    db.select({ name: users.name, username: users.username, school: users.schoolName, jenjang: users.jenjang }).from(users).where(eq(users.id, studentId)),
    getStudentProgress(studentId),
    studentTestHistory(studentId),
    isPremiumUser({ id: teacherId, role: user.role }, cls.jenjang),
    isPremiumUser({ id: studentId }, cls.jenjang),
  ]);
  if (!student) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Button variant="link" className="self-start px-0" nativeButton={false} render={<Link href={`/guru/kelas/${cls.id}`} />}>
          <ArrowLeft aria-hidden /> {cls.name}
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-[1.75rem]">{student.name}</h1>
          <Badge variant={studentPremium ? "warning" : "muted"}>{studentPremium ? "Premium" : "Akun gratis"}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {student.username ? `@${student.username} · ` : ""}
          {student.school ?? "-"} · {student.jenjang ?? "-"}
        </p>
      </div>

      <section className="surface-card p-5 text-sm leading-relaxed">
        Sudah menyelesaikan <strong>{progress.testCount} tes</strong> dan <strong>{progress.practiceCount} latihan</strong>.
      </section>

      {progress.scoreTrend.length > 1 && (
        <section className="surface-card p-6">
          <h2 className="text-lg font-bold">Tren skor tes</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {progress.scoreTrend.length} tes terakhir, skala {SCALE_LABEL[progress.scoreTrend[0].score.scale]} (simulasi).
          </p>
          <div className="mt-6">
            <ScoreTrend points={progress.scoreTrend} />
          </div>
        </section>
      )}

      {teacherPremium ? (
        <>
          {progress.priorities.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-bold">Prioritas latihan</h2>
              <ol className="grid gap-4 md:grid-cols-3">
                {progress.priorities.map((p, i) => (
                  <li key={p.subtopicId} className="surface-card flex flex-col gap-2 p-5">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-destructive">
                      <TriangleAlert className="size-3.5" aria-hidden /> Prioritas #{i + 1}
                    </span>
                    <h3 className="font-bold leading-snug">{p.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {p.subject} · {p.domain}
                    </p>
                    <span className="mt-auto text-2xl font-bold tabular-nums">{p.diagnosis.accuracy}%</span>
                  </li>
                ))}
              </ol>
            </section>
          )}
          {progress.subjects.map((s) => (
            <section key={s.id} className="surface-card overflow-x-auto p-0">
              <h2 className="border-b p-4 font-bold">
                {s.name} <span className="text-sm font-normal text-muted-foreground">· {s.tested}/{s.total} subdomain teruji</span>
              </h2>
              <table className="w-full min-w-[560px] text-sm">
                <tbody className="divide-y">
                  {s.domains.flatMap((d) =>
                    d.subdomains.map((sd) => {
                      const status = sd.diagnosis?.status ?? "untested";
                      return (
                        <tr key={sd.id}>
                          <td className="px-4 py-2.5">
                            <p className="leading-snug">{sd.name}</p>
                            <p className="text-xs text-muted-foreground">{d.name}</p>
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums">{sd.diagnosis ? `${sd.diagnosis.accuracy}%` : "—"}</td>
                          <td className="px-4 py-2.5 text-right">
                            <Badge variant={DIAGNOSIS_STATUS[status].variant}>{DIAGNOSIS_STATUS[status].label}</Badge>
                          </td>
                        </tr>
                      );
                    }),
                  )}
                </tbody>
              </table>
            </section>
          ))}
        </>
      ) : (
        <section className="surface-card flex flex-col items-start gap-3 p-5">
          <p className="flex items-center gap-2 font-bold">
            <Lock className="size-4" aria-hidden /> Peta kemampuan per subdomain khusus guru Premium
          </p>
          <p className="text-sm text-muted-foreground">Lihat subdomain terkuat & terlemah siswa ini beserta prioritas latihannya.</p>
          <Button variant="cta" nativeButton={false} render={<Link href="/langganan" />}>
            Lihat Premium
          </Button>
        </section>
      )}

      <section className="surface-card flex flex-col gap-3 p-5">
        <h2 className="font-bold">Riwayat tes</h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada tes yang selesai.</p>
        ) : (
          <ul className="divide-y text-sm">
            {history.map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-3 py-2.5">
                <div>
                  <p className="font-medium">{h.title}</p>
                  <p className="text-xs text-muted-foreground">{h.submittedAt ? formatDateTime(h.submittedAt) : ""}</p>
                </div>
                <span className="font-semibold tabular-nums">{formatScore(h.score.value)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
