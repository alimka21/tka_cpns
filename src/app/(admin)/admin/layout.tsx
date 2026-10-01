import type { Metadata } from "next";
import { AdminShell } from "@/components/layout/admin-shell";
import { requireAdmin } from "@/server/auth/session";
import { countPendingUsers } from "@/server/queries/users";
import { countOpenReports } from "@/server/services/question-reports";

// Halaman akun & admin tidak perlu diindeks mesin pencari.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin("/admin");
  const [openReports, pendingUsers] = await Promise.all([countOpenReports(), countPendingUsers()]);
  return (
    <AdminShell user={{ name: user.name, email: user.email }} counts={{ "/admin/laporan": openReports, "/admin/users": pendingUsers }}>
      {children}
    </AdminShell>
  );
}
