import type { Metadata } from "next";
import { UsersTable } from "@/components/admin/users-table";
import { PageHeader } from "@/components/layout/page-header";
import { requireAdmin } from "@/server/auth/session";
import { listUsersAdmin } from "@/server/queries/users";

export const metadata: Metadata = { title: "Manajemen User" };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const { user } = await requireAdmin("/admin/users");
  const users = await listUsersAdmin();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Manajemen User"
        description="Kelola akun siswa & admin. Akses premium diatur per paket di halaman Paket Tes."
      />
      <UsersTable users={users} currentUserId={Number(user.id)} />
    </div>
  );
}
