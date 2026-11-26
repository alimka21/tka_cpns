import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { JoinClassForm, LeaveClassButton } from "@/components/classroom/student-panels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PHASE } from "@/lib/classroom";
import { formatDateTime } from "@/lib/format";
import { formatScore } from "@/lib/score-display";
import { requireUser } from "@/server/auth/session";
import { isPremiumUser } from "@/server/services/access";
import { listStudentClasses, teacherInfo } from "@/server/services/classroom";

export const metadata: Metadata = { title: "Kelas Saya" };
export const dynamic = "force-dynamic";

export default async function KelasPage() {
  const { user } = await requireUser("/kelas");
  const userId = Number(user.id);
  const jenjang = user.jenjang ?? null;
  const premium = await isPremiumUser({ id: userId, role: user.role }, jenjang);
  const [classes, teacher] = await Promise.all([listStudentClasses({ id: userId, jenjang }, premium), teacherInfo(userId)]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-[1.75rem]">Kelas Saya</h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          Gabung ke kelas gurumu dengan kode kelas. Setelah bergabung, gurumu bisa melihat skor tes & latihanmu dan memberi tugas.
        </p>
      </header>

      <section className="surface-card p-5">
        <JoinClassForm />
        <p className="mt-2 text-xs text-muted-foreground">Kode kelas berbeda dengan kode guru yang diisi saat daftar. Minta kode kelas ke gurumu.</p>
      </section>

      {classes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Kamu belum bergabung ke kelas mana pun.</p>
      ) : (
        classes.map((c) => (
          <section key={c.id} className="surface-card flex flex-col gap-4 p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold">{c.name}</h2>
                <p className="text-sm text-muted-foreground">Guru: {c.teacherName}</p>
              </div>
              <LeaveClassButton classId={c.id} name={c.name} />
            </div>
            {c.assignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada tugas dari guru.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {c.assignments.map((a) => (
                  <li key={a.id} className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{a.title}</h3>
                        {a.score ? <Badge variant="success">Selesai</Badge> : <Badge variant={PHASE[a.phase].variant}>{PHASE[a.phase].label}</Badge>}
                        {a.isPremium && <Badge variant="warning">Premium</Badge>}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {a.subjectName ? `${a.subjectName} · ` : ""}Mulai {formatDateTime(a.startsAt)}
                        {a.dueAt ? ` · Batas ${formatDateTime(a.dueAt)}` : ""}
                      </p>
                      {a.note && <p className="mt-1 text-sm">{a.note}</p>}
                    </div>
                    <div className="shrink-0">
                      {a.score ? (
                        <span className="text-sm">
                          Skor <strong className="tabular-nums">{formatScore(a.score.value)}</strong>
                        </span>
                      ) : a.locked ? (
                        <Button size="sm" variant="cta" nativeButton={false} render={<Link href="/langganan" />}>
                          <Lock aria-hidden /> Buka dengan Premium
                        </Button>
                      ) : a.phase === "open" ? (
                        <Button size="sm" nativeButton={false} render={<Link href={`/tes/${a.testPackageId}`} />}>
                          Kerjakan <ArrowRight aria-hidden />
                        </Button>
                      ) : a.phase === "upcoming" ? (
                        <span className="text-sm text-muted-foreground">Dibuka {formatDateTime(a.startsAt)}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Tidak dikerjakan</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))
      )}

      {!teacher.isTeacher && user.role !== "admin" && (
        <p className="text-sm text-muted-foreground">
          Anda guru?{" "}
          <Link href="/guru" className="font-semibold text-primary hover:underline">
            Buka Ruang Guru
          </Link>{" "}
          untuk membuat kelas.
        </p>
      )}
    </div>
  );
}
