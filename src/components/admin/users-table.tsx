"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Crown, GraduationCap, Search, ShieldCheck, Terminal, Trash2, Users } from "lucide-react";
import { StatCard } from "@/components/layout/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatDate } from "@/lib/format";
import { deleteUserAction } from "@/server/actions/users";
import type { AdminUserRow } from "@/server/queries/users";

type Role = AdminUserRow["role"];
type RoleFilter = "all" | Role;
type AccessFilter = "all" | "premium" | "free";

const roleLabel: Record<Role, string> = { student: "Siswa", admin: "Admin" };
const roleFilterItems: Record<RoleFilter, string> = { all: "Semua role", ...roleLabel };
const accessFilterItems: Record<AccessFilter, string> = { all: "Semua akses", premium: "Premium", free: "Gratis" };

export function UsersTable({ users, currentUserId }: { users: AdminUserRow[]; currentUserId: number }) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [accessFilter, setAccessFilter] = useState<AccessFilter>("all");

  const q = query.trim().toLowerCase();
  const visible = users.filter(
    (u) =>
      (q === "" || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) &&
      (roleFilter === "all" || u.role === roleFilter) &&
      (accessFilter === "all" || (accessFilter === "premium") === u.premiumCount > 0),
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total user" value={String(users.length)} icon={Users} />
        <StatCard label="Siswa" value={String(users.filter((u) => u.role === "student").length)} icon={GraduationCap} tone="muted" />
        <StatCard label="Punya akses premium" value={String(users.filter((u) => u.premiumCount > 0).length)} icon={Crown} tone="cta" />
        <StatCard label="Admin" value={String(users.filter((u) => u.role === "admin").length)} icon={ShieldCheck} tone="success" />
      </div>

      <section className="surface-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:p-5">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama atau email…"
              aria-label="Cari user"
              className="pl-10"
            />
          </div>
          <div className="flex gap-3">
            <Select items={roleFilterItems} value={roleFilter} onValueChange={(v) => setRoleFilter(v as RoleFilter)}>
              <SelectTrigger className="w-full sm:w-36" aria-label="Filter role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua role</SelectItem>
                <SelectItem value="student">Siswa</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select items={accessFilterItems} value={accessFilter} onValueChange={(v) => setAccessFilter(v as AccessFilter)}>
              <SelectTrigger className="w-full sm:w-40" aria-label="Filter akses">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua akses</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="free">Gratis</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <p className="flex items-start gap-2 border-b bg-primary-soft/50 px-5 py-3 text-xs text-muted-foreground">
          <Terminal className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Akses premium diberikan per paket di halaman{" "}
          <Link href="/admin/paket-tes" className="font-semibold text-primary underline">
            Paket Tes
          </Link>
          . Role admin hanya bisa diubah lewat terminal:{" "}
          <code className="rounded bg-muted px-1 py-0.5">npm run user:role -- email admin</code>.
        </p>

        {/* Desktop: tabel */}
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/50 text-left text-xs font-semibold text-muted-foreground uppercase">
              <tr>
                <th className="px-5 py-3">Nama</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Terdaftar</th>
                <th className="px-5 py-3">Akses premium</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {visible.map((user) => (
                <tr key={user.id} className="hover:bg-muted/40">
                  <td className="px-5 py-3.5">
                    <UserIdentity user={user} />
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant={user.role === "admin" ? "info" : "muted"}>{roleLabel[user.role]}</Badge>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-muted-foreground">{formatDate(user.createdAt)}</td>
                  <td className="px-5 py-3.5">
                    <PremiumCount count={user.premiumCount} />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <DeleteUser user={user} disabled={user.id === currentUserId} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile & tablet: kartu per user (docs/UI_UX.md §5) */}
        <ul className="divide-y lg:hidden">
          {visible.map((user) => (
            <li key={user.id} className="flex flex-col gap-4 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <UserIdentity user={user} />
                <DeleteUser user={user} disabled={user.id === currentUserId} />
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
                <Badge variant={user.role === "admin" ? "info" : "muted"}>{roleLabel[user.role]}</Badge>
                <PremiumCount count={user.premiumCount} />
                <span className="text-muted-foreground">{formatDate(user.createdAt)}</span>
              </div>
            </li>
          ))}
        </ul>

        {visible.length === 0 && (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">Tidak ada user yang cocok dengan filter.</p>
        )}
        <div className="border-t px-5 py-3 text-xs text-muted-foreground">
          Menampilkan {visible.length} dari {users.length} user
        </div>
      </section>
    </div>
  );
}

function UserIdentity({ user }: { user: AdminUserRow }) {
  const initials = user.name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("");
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">
        {initials}
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-2 font-semibold">
          <span className="truncate">{user.name}</span>
        </div>
        <div className="truncate text-xs text-muted-foreground">{user.email}</div>
      </div>
    </div>
  );
}

function PremiumCount({ count }: { count: number }) {
  if (count === 0) return <span className="text-sm text-muted-foreground">Gratis</span>;
  return (
    <span className="flex items-center gap-1.5 text-sm font-semibold text-success-strong">
      <Crown className="size-3.5" aria-hidden /> {count} paket
    </span>
  );
}

function DeleteUser({ user, disabled }: { user: AdminUserRow; disabled?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            title={disabled ? "Tidak bisa menghapus akunmu sendiri" : undefined}
            aria-label={`Hapus ${user.name}`}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 aria-hidden />
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus user ini?</AlertDialogTitle>
          <AlertDialogDescription>
            {user.name} ({user.email}) akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
            {error && <span className="mt-2 block font-semibold text-destructive">{error}</span>}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={(e) => {
              e.preventDefault();
              startTransition(async () => {
                const result = await deleteUserAction(user.id);
                if (!result.ok) setError(result.error);
                else router.refresh();
              });
            }}
          >
            {pending ? "Menghapus…" : "Hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
