import type { Metadata } from "next";
import Link from "next/link";
import { School } from "lucide-react";
import { JoinClassForm } from "@/components/classroom/student-panels";
import { Button } from "@/components/ui/button";
import { normalizeClassCode } from "@/lib/classroom";
import { getSession, requireUser } from "@/server/auth/session";
import { findClassByCode } from "@/server/services/classroom";

export const metadata: Metadata = { title: "Gabung Kelas" };
export const dynamic = "force-dynamic";

// Link undangan kelas dari guru. Belum login → daftar/masuk dulu lalu kembali ke sini.
// Bergabung tetap lewat tombol (persetujuan siswa), bukan otomatis saat link dibuka.
export default async function GabungKelasPage({ params }: PageProps<"/gabung/[code]">) {
  const code = normalizeClassCode((await params).code);
  const path = `/gabung/${code}`;
  const session = await getSession();
  if (session) await requireUser(path); // akun menunggu konfirmasi / tanpa jenjang → diarahkan dulu
  const cls = code ? await findClassByCode(code) : null;
  const next = encodeURIComponent(path);

  return (
    <div className="surface-card flex flex-col gap-5 p-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-primary-soft text-primary">
          <School className="size-6" aria-hidden />
        </span>
        {cls ? (
          <>
            <h1 className="text-xl font-bold">Gabung ke kelas {cls.name}</h1>
            <p className="text-sm text-muted-foreground">
              Guru: <strong className="text-foreground">{cls.teacherName}</strong> · Jenjang {cls.jenjang}
            </p>
            <p className="text-sm text-muted-foreground">Setelah bergabung, gurumu bisa melihat skor tes & latihanmu dan memberi tugas.</p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold">Kode kelas tidak ditemukan</h1>
            <p className="text-sm text-muted-foreground">Periksa lagi link atau kode kelas dari gurumu.</p>
          </>
        )}
      </div>

      {cls && cls.archivedAt && <p className="text-center text-sm text-destructive">Kelas ini sudah diarsipkan dan tidak menerima anggota baru.</p>}

      {cls && !cls.archivedAt && session && <JoinClassForm initialCode={code} redirectTo="/kelas" />}

      {cls && !cls.archivedAt && !session && (
        <div className="flex flex-col gap-2">
          <p className="text-center text-sm text-muted-foreground">Daftar akun dulu (gratis), atau masuk bila sudah punya akun.</p>
          <Button nativeButton={false} render={<Link href={`/daftar?next=${next}`} />}>
            Daftar akun
          </Button>
          <Button variant="outline" nativeButton={false} render={<Link href={`/masuk?next=${next}`} />}>
            Sudah punya akun? Masuk
          </Button>
        </div>
      )}

      {session && (
        <Button variant="link" nativeButton={false} render={<Link href="/kelas" />}>
          Ke menu Kelas
        </Button>
      )}
    </div>
  );
}
