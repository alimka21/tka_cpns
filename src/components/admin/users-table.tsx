"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Clock, Crown, GraduationCap, Search, Settings, Terminal, Trash2, Users, X } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { approveAllPendingAction, deleteUserAction, setUserJenjangAction, setUserStatusAction } from "@/server/actions/users";
import type { AdminUserRow } from "@/server/queries/users";

type Role = AdminUserRow["role"];
type RoleFilter = "all" | Role;
type AccessFilter = "all" | "premium" | "free";
type Status = AdminUserRow["status"];
type StatusTab = "all" | Status;
type JenjangFilter = "all" | "none" | "SD" | "SMP" | "SMA";

const statusMeta: Record<Status, { label: string; variant: "success" | "warning" | "danger" }> = {
  active: { label: "Aktif", variant: "success" },
  pending: { label: "Menunggu", variant: "warning" },
  rejected: { label: "Ditolak", variant: "danger" },
};
const jenjangFilterItems: Record<JenjangFilter, string> = { all: "Semua jenjang", SD: "SD", SMP: "SMP", SMA: "SMA", none: "Belum memilih" };

const roleLabel: Record<Role, string> = { student: "Siswa", admin: "Admin" };
const roleFilterItems: Record<RoleFilter, string> = { all: "Semua role", ...roleLabel };
const accessFilterItems: Record<AccessFilter, string> = { all: "Semua akses", premium: "Premium", free: "Gratis" };

export function UsersTable({
  users,
  currentUserId,
  requireApproval,
}: {
  users: AdminUserRow[];
  currentUserId: number;
  requireApproval: boolean;
}) {
  const router = useRouter();
  const pendingCount = users.filter((u) => u.status === "pending").length;
  const [tab, setTab] = useState<StatusTab>(pendingCount > 0 ? "pending" : "all");
  const [jenjangFilter, setJenjangFilter] = useState<JenjangFilter>("all");
  const [bulkPending, startBulk] = useTransition();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [accessFilter, setAccessFilter] = useState<AccessFilter>("all");

  const q = query.trim().toLowerCase();
  const visible = users.filter(
    (u) =>
      (q === "" || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) &&
      (roleFilter === "all" || u.role === roleFilter) &&
      (tab === "all" || u.status === tab) &&
      (jenjangFilter === "all" || (jenjangFilter === "none" ? u.jenjang == null : u.jenjang === jenjangFilter)) &&
      (accessFilter === "all" || (accessFilter === "premium") === u.premiumCount > 0),
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total user" value={String(users.length)} icon={Users} />
        <StatCard label="Siswa" value={String(users.filter((u) => u.role === "student").length)} icon={GraduationCap} tone="muted" />
        <StatCard label="Punya akses premium" value={String(users.filter((u) => u.premiumCount > 0).length)} icon={Crown} tone="cta" />
        <StatCard label="Menunggu konfirmasi" value={String(pendingCount)} icon={Clock} tone="success" />
      </div>

      {pendingCount > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-warning/40 bg-warning-soft p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-sm font-semibold text-warning-strong">
            <Clock className="size-4" aria-hidden /> {pendingCount} pendaftar baru menunggu konfirmasi.
          </p>
          <Button
            size="sm"
            disabled={bulkPending}
            onClick={() =>
              startBulk(async () => {
                if (!window.confirm(`Setujui semua ${pendingCount} pendaftar?`)) return;
                await approveAllPendingAction();
                router.refresh();
              })
            }
          >
            <Check aria-hidden /> Setujui semua
          </Button>
        </div>
      )}

      <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Settings className="size-4" aria-hidden />
        Konfirmasi pendaftar baru:{" "}
        <strong className={requireApproval ? "text-warning-strong" : "text-success-strong"}>{requireApproval ? "wajib (manual)" : "otomatis aktif"}</strong>
        <Link href="/admin/pengaturan" className="font-semibold text-primary hover:underline">
          Ubah
        </Link>
      </p>

      <section className="surface-card overflow-hidden">
        <nav aria-label="Status akun" className="flex gap-1 overflow-x-auto border-b px-4 pt-2 sm:px-5">
          {(["all", "pending", "active", "rejected"] as StatusTab[]).map((t) => {
            const n = t === "all" ? users.length : users.filter((u) => u.status === t).length;
            return (
              <button
                key={t}
                type="button"
                aria-pressed={tab === t}
                onClick={() => setTab(t)}
                className={cn(
                  "-mb-px border-b-2 px-3 py-2 text-sm font-semibold whitespace-nowrap",
                  tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {t === "all" ? "Semua" : statusMeta[t].label} <span className="tabular-nums opacity-70">({n})</span>
              </button>
            );
          })}
        </nav>
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
            <Select items={jenjangFilterItems} value={jenjangFilter} onValueChange={(v) => setJenjangFilter(v as JenjangFilter)}>
              <SelectTrigger className="w-full sm:w-40" aria-label="Filter jenjang">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(jenjangFilterItems).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
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
                <th className="px-5 py-3">Jenjang</th>
                <th className="px-5 py-3">Status</th>
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
                    <JenjangCell user={user} />
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusCell user={user} />
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
                <JenjangCell user={user} />
                <StatusCell user={user} />
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

function JenjangCell({ user }: { user: AdminUserRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  if (user.role === "admin") return <span className="text-muted-foreground">—</span>;
  return (
    <select
      aria-label={`Jenjang ${user.name}`}
      value={user.jenjang ?? ""}
      disabled={pending}
      onChange={(e) =>
        startTransition(async () => {
          await setUserJenjangAction({ userId: user.id, jenjang: e.target.value });
          router.refresh();
        })
      }
      className={cn("h-8 rounded-md border bg-card px-2 text-sm", !user.jenjang && "border-warning text-warning-strong")}
    >
      {!user.jenjang && <option value="">Belum memilih</option>}
      <option value="SD">SD</option>
      <option value="SMP">SMP</option>
      <option value="SMA">SMA</option>
    </select>
  );
}

function StatusCell({ user }: { user: AdminUserRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const set = (status: Status) =>
    startTransition(async () => {
      await setUserStatusAction({ userIds: [user.id], status });
      router.refresh();
    });
  const meta = statusMeta[user.status];
  if (user.role === "admin") return <Badge variant="success">Aktif</Badge>;
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <Badge variant={meta.variant}>{meta.label}</Badge>
      {user.status !== "active" && (
        <Button size="xs" disabled={pending} onClick={() => set("active")}>
          <Check aria-hidden /> Setujui
        </Button>
      )}
      {user.status === "pending" && (
        <Button size="xs" variant="outline" disabled={pending} onClick={() => set("rejected")}>
          <X aria-hidden /> Tolak
        </Button>
      )}
    </span>
  );
}
