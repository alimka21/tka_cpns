import type { Metadata } from "next";
import { CreateUserForm } from "@/components/admin/create-user-form";
import { UsersTable } from "@/components/admin/users-table";
import { PageHeader } from "@/components/layout/page-header";
import { parseUserFilters } from "@/lib/user-filters";
import { requireAdmin } from "@/server/auth/session";
import { listUsersAdmin } from "@/server/queries/users";
import { getSetting } from "@/server/services/app-settings";

export const metadata: Metadata = { title: "Manajemen User" };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { user } = await requireAdmin("/admin/users");
  const filters = parseUserFilters(await searchParams);
  const [data, requireApproval] = await Promise.all([listUsersAdmin(filters), getSetting("registration.requireApproval")]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Manajemen User"
        description="Kelola akun siswa & admin: tambah akun siswa, konfirmasi pendaftar baru, jenjang, dan akses. Akses premium diatur per paket di halaman Paket Tes."
      />
      <CreateUserForm />
      <UsersTable data={data} filters={filters} currentUserId={Number(user.id)} requireApproval={requireApproval} />
    </div>
  );
}
