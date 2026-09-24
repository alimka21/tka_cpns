import type { Metadata } from "next";
import Link from "next/link";
import { StudentHeader } from "@/components/layout/student-header";
import { demoStudent } from "@/lib/demo-data";
import { SITE_NAME } from "@/lib/site";

// Halaman akun & admin tidak perlu diindeks mesin pencari.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  // TODO: ambil nama & status premium dari sesi Better Auth.
  const subtitle = `Siswa ${demoStudent.jenjang} · ${demoStudent.isPremium ? "Premium" : "Gratis"}`;
  return (
    <div className="flex flex-1 flex-col">
      <StudentHeader name={demoStudent.name} subtitle={subtitle} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">{children}</main>
      <footer className="border-t bg-card">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} {SITE_NAME}</span>
          <Link href="/" className="hover:text-foreground">
            Beranda
          </Link>
        </div>
      </footer>
    </div>
  );
}
