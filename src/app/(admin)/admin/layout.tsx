import type { Metadata } from "next";
import { AdminShell } from "@/components/layout/admin-shell";
import { requireAdmin } from "@/server/auth/session";

// Halaman akun & admin tidak perlu diindeks mesin pencari.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin("/admin");
  return <AdminShell user={{ name: user.name, email: user.email }}>{children}</AdminShell>;
}
