import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = { robots: { index: false, follow: true } };

// Layout Masuk/Daftar: kartu terpusat di atas latar lembut (docs/UI_UX.md §4.2).
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col bg-gradient-to-b from-primary-soft via-background to-background">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden /> Kembali ke Beranda
        </Link>
        <span className="hidden items-center gap-1.5 text-xs font-semibold text-muted-foreground sm:flex">
          <ShieldCheck className="size-4 text-success" aria-hidden /> Koneksi terenkripsi
        </span>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pt-4 pb-16 sm:items-center sm:pt-0">
        <div className="w-full max-w-md">{children}</div>
      </main>
      <footer className="px-4 pb-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {SITE_NAME}
      </footer>
    </div>
  );
}
