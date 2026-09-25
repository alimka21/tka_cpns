"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenText,
  FileUp,
  FolderTree,
  LayoutGrid,
  Library,
  Menu,
  Package,
  Sparkles,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon; badge?: string };

const navItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutGrid },
  { href: "/admin/users", label: "Manajemen User", icon: Users },
  { href: "/admin/topik", label: "Kerangka Asesmen", icon: FolderTree },
  { href: "/admin/soal", label: "Bank Soal", icon: Library },
  { href: "/admin/soal/stimulus", label: "Stimulus", icon: BookOpenText },
  { href: "/admin/soal/import", label: "Import Soal", icon: FileUp },
  { href: "/admin/soal/generate-ai", label: "Generate AI", icon: Sparkles, badge: "Fase 2" },
  { href: "/admin/paket-tes", label: "Paket Tes", icon: Package },
];

// Item aktif = prefix terpanjang yang cocok, supaya /admin/soal/import tidak
// ikut menyalakan "Bank Soal".
function activeHref(pathname: string) {
  return navItems
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Menu mobile terbuka untuk path tertentu saja — otomatis tertutup saat pindah halaman.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (value: boolean) => setOpenOn(value ? pathname : null);
  const current = activeHref(pathname);

  const nav = (
    <nav aria-label="Menu admin" className="flex flex-col gap-1">
      {navItems.map(({ href, label, icon: Icon, badge }) => {
        const active = href === current;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/25 focus-visible:outline-none",
              active && "bg-primary-soft text-primary hover:bg-primary-soft hover:text-primary",
            )}
          >
            <Icon className="size-[18px] shrink-0" aria-hidden />
            <span className="flex-1">{label}</span>
            {badge && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
                {badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-full flex-1">
      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-8 border-r bg-sidebar px-4 py-6 lg:flex">
        <Logo href="/admin" caption="Admin Panel" className="px-2" />
        {nav}
      </aside>

      {/* Drawer mobile */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu admin">
          <button
            type="button"
            aria-label="Tutup menu"
            className="absolute inset-0 bg-foreground/30"
            onClick={() => setOpen(false)}
          />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col gap-8 bg-sidebar px-4 py-6 shadow-xl">
            <div className="flex items-center justify-between">
              <Logo href="/admin" caption="Admin Panel" className="px-2" />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup menu"
                className="flex size-10 items-center justify-center rounded-lg hover:bg-muted"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b bg-card/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Buka menu"
            className="-ml-2 flex size-10 items-center justify-center rounded-lg hover:bg-muted lg:hidden"
          >
            <Menu className="size-5" aria-hidden />
          </button>
          <span className="text-sm font-semibold lg:hidden">Admin Panel</span>
          <div className="ml-auto flex items-center gap-3">
            {/* TODO: ganti dengan data sesi Better Auth setelah auth aktif. */}
            <div className="hidden text-right sm:block">
              <div className="text-sm font-semibold leading-tight">Admin</div>
              <div className="text-xs text-muted-foreground">Administrator</div>
            </div>
            <span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              A
            </span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
