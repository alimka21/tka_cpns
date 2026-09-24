import type { Metadata } from "next";
import { AdminShell } from "@/components/layout/admin-shell";

// Halaman akun & admin tidak perlu diindeks mesin pencari.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
