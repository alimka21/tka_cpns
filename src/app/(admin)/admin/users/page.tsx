"use client";

import { useState } from "react";
import { Crown, GraduationCap, Search, ShieldCheck, Trash2, Users } from "lucide-react";
import { DemoDataNotice, PageHeader } from "@/components/layout/page-header";
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
import { Switch } from "@/components/ui/switch";
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
import { demoUsers, type DemoUser } from "@/lib/demo-data";
import { formatDate } from "@/lib/format";

type Role = DemoUser["role"];
type RoleFilter = "all" | Role;
type AccessFilter = "all" | "premium" | "free";

const roleItems: Record<Role, string> = { student: "Siswa", admin: "Admin" };
const roleFilterItems: Record<RoleFilter, string> = { all: "Semua role", ...roleItems };
const accessFilterItems: Record<AccessFilter, string> = { all: "Semua akses", premium: "Premium", free: "Gratis" };

// TODO Fase 1: ganti state lokal dengan query tabel `users` + server action
// untuk ubah role, hapus, dan beri/cabut entitlement premium.
export default function AdminUsersPage() {
  const [users, setUsers] = useState<DemoUser[]>(demoUsers);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [accessFilter, setAccessFilter] = useState<AccessFilter>("all");

  const q = query.trim().toLowerCase();
  const visible = users.filter(
    (u) =>
      (q === "" || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) &&
      (roleFilter === "all" || u.role === roleFilter) &&
      (accessFilter === "all" || (accessFilter === "premium") === u.premium),
  );

  const update = (id: number, patch: Partial<DemoUser>) =>
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  const remove = (id: number) => setUsers((prev) => prev.filter((u) => u.id !== id));

  return (
    <div className="flex flex-col gap-8">
      <DemoDataNotice>Data contoh — perubahan di halaman ini belum tersimpan ke database.</DemoDataNotice>
      <PageHeader
        title="Manajemen User"
        description="Kelola akun siswa & admin, serta aktifkan akses premium secara manual (belum ada payment gateway)."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total user" value={String(users.length)} icon={Users} />
        <StatCard label="Siswa" value={String(users.filter((u) => u.role === "student").length)} icon={GraduationCap} tone="muted" />
        <StatCard label="Akses premium" value={String(users.filter((u) => u.premium).length)} icon={Crown} tone="cta" />
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

        {/* Desktop: tabel */}
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/50 text-left text-xs font-semibold text-muted-foreground uppercase">
              <tr>
                <th className="px-5 py-3">Nama</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Jenjang</th>
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
                    <RoleSelect user={user} onChange={(role) => update(user.id, { role })} />
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{user.jenjang ?? "—"}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-muted-foreground">{formatDate(user.createdAt)}</td>
                  <td className="px-5 py-3.5">
                    <PremiumToggle user={user} onChange={(premium) => update(user.id, { premium })} />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <DeleteUser user={user} onConfirm={() => remove(user.id)} />
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
                <DeleteUser user={user} onConfirm={() => remove(user.id)} />
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
                <RoleSelect user={user} onChange={(role) => update(user.id, { role })} />
                <PremiumToggle user={user} onChange={(premium) => update(user.id, { premium })} />
                <span className="text-muted-foreground">
                  {user.jenjang ?? "—"} · {formatDate(user.createdAt)}
                </span>
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

function UserIdentity({ user }: { user: DemoUser }) {
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
          {user.role === "admin" && <Badge variant="info">Admin</Badge>}
        </div>
        <div className="truncate text-xs text-muted-foreground">{user.email}</div>
      </div>
    </div>
  );
}

function RoleSelect({ user, onChange }: { user: DemoUser; onChange: (role: Role) => void }) {
  return (
    <Select items={roleItems} value={user.role} onValueChange={(v) => onChange(v as Role)}>
      <SelectTrigger size="sm" className="w-28" aria-label={`Role ${user.name}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="student">Siswa</SelectItem>
        <SelectItem value="admin">Admin</SelectItem>
      </SelectContent>
    </Select>
  );
}

function PremiumToggle({ user, onChange }: { user: DemoUser; onChange: (premium: boolean) => void }) {
  return (
    <div className="flex items-center gap-2.5">
      <Switch
        checked={user.premium}
        onCheckedChange={onChange}
        label={`Akses premium ${user.name}`}
      />
      <span className={user.premium ? "text-sm font-semibold text-success" : "text-sm text-muted-foreground"}>
        {user.premium ? "Premium" : "Gratis"}
      </span>
    </div>
  );
}

function DeleteUser({ user, onConfirm }: { user: DemoUser; onConfirm: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label={`Hapus ${user.name}`} className="text-muted-foreground hover:text-destructive">
            <Trash2 aria-hidden />
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus user ini?</AlertDialogTitle>
          <AlertDialogDescription>
            {user.name} ({user.email}) akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Hapus</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
