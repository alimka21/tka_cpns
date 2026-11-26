import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, ClipboardList, HandCoins, KeyRound, Users } from "lucide-react";
import { CreateClassForm, EnableTeacherButton } from "@/components/classroom/teacher-panels";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/server/auth/session";
import { listTeacherClasses, teacherInfo } from "@/server/services/classroom";

export const metadata: Metadata = { title: "Ruang Guru" };
export const dynamic = "force-dynamic";

const FEATURES = [
  [KeyRound, "Bagikan kode kelas", "Siswa daftar dulu, lalu memasukkan kode kelas Anda untuk terhubung."],
  [BarChart3, "Pantau progres", "Lihat skor tes, latihan, dan subdomain terlemah setiap siswa di kelas."],
  [ClipboardList, "Beri tugas", "Pilih paket tes dan atur kapan tugas dibuka untuk siswa."],
] as const;

export default async function GuruPage() {
  const { user } = await requireUser("/guru");
  const userId = Number(user.id);
  const info = await teacherInfo(userId);

  if (!info.isTeacher) {
    return (
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight sm:text-[1.75rem]">Ruang Guru</h1>
          <p className="mt-1 max-w-2xl text-muted-foreground">
            Untuk Bapak/Ibu guru: buat kelas, hubungkan siswa dengan kode kelas, pantau progres belajar mereka, dan berikan tugas paket tes.
          </p>
        </header>
        <ul className="grid gap-4 md:grid-cols-3">
          {FEATURES.map(([Icon, title, text]) => (
            <li key={title} className="surface-card flex flex-col gap-2 p-5">
              <Icon className="size-6 text-primary" aria-hidden />
              <h2 className="font-bold">{title}</h2>
              <p className="text-sm text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>
        <section className="surface-card flex flex-col gap-3 p-5">
          <p className="text-sm text-muted-foreground">
            Akun guru gratis. Siswa tetap memakai akunnya sendiri: paket Premium hanya bisa dikerjakan siswa yang sudah Premium.
          </p>
          {user.role === "admin" ? <p className="text-sm">Akun admin tidak perlu mengaktifkan akun guru.</p> : <EnableTeacherButton />}
        </section>
      </div>
    );
  }

  const classes = await listTeacherClasses(userId);
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-[1.75rem]">Ruang Guru</h1>
        <p className="max-w-2xl text-muted-foreground">
          Bagikan kode kelas ke siswa. Setelah siswa bergabung, progres belajarnya tampil di halaman kelas.
        </p>
      </header>

      {info.affiliateActive ? (
        <Link href="/afiliasi" className="surface-card flex items-center gap-3 p-4 text-sm hover:bg-muted/40">
          <HandCoins className="size-5 shrink-0 text-cta" aria-hidden />
          <span className="flex-1">
            <strong>Afiliasi Guru</strong> — kode afiliasi untuk pendaftaran siswa & komisi Anda. Ingat: kode afiliasi tidak memasukkan siswa ke kelas;
            siswa tetap perlu kode kelas.
          </span>
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      ) : (
        <p className="rounded-xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Ingin mendapat Premium gratis dan komisi dari siswa yang mendaftar? Hubungi admin Pakar TKA untuk bergabung sebagai Guru Afiliasi.
        </p>
      )}

      <section className="surface-card flex flex-col gap-3 p-5">
        <h2 className="font-bold">Buat kelas baru</h2>
        <CreateClassForm defaultJenjang={user.jenjang ?? "SD"} />
      </section>

      <section aria-labelledby="kelas-heading" className="flex flex-col gap-3">
        <h2 id="kelas-heading" className="text-lg font-bold">
          Kelas Anda
        </h2>
        {classes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada kelas. Buat kelas pertama di atas.</p>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {classes.map((c) => (
              <li key={c.id}>
                <Link href={`/guru/kelas/${c.id}`} className="surface-card flex h-full flex-col gap-3 p-5 transition-colors hover:bg-muted/40">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold leading-snug">{c.name}</h3>
                    <span className="flex shrink-0 gap-1">
                      <Badge variant="info">{c.jenjang}</Badge>
                      {c.archived && <Badge variant="muted">Arsip</Badge>}
                    </span>
                  </div>
                  <p className="font-mono text-lg font-bold tracking-[0.2em] text-primary">{c.joinCode}</p>
                  <p className="mt-auto flex gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="size-4" aria-hidden /> {c.members} siswa
                    </span>
                    <span className="flex items-center gap-1">
                      <ClipboardList className="size-4" aria-hidden /> {c.assignments} tugas
                    </span>
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
