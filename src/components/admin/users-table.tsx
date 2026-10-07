"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Clock, Copy, KeyRound, Crown, GraduationCap, Search, Settings, Trash2, Users, X } from "lucide-react";
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
import { approveAllPendingAction, deleteUserAction, resetUserPasswordAction, setUserJenjangAction, setUserStatusAction } from "@/server/actions/users";
import { USERS_PAGE_SIZE, usersHref, type UserFilters } from "@/lib/user-filters";
import type { AdminUserRow, AdminUsersPage } from "@/server/queries/users";

type Role = AdminUserRow["role"];
type Status = AdminUserRow["status"];
type StatusTab = "all" | Status;

const statusMeta: Record<Status, { label: string; variant: "success" | "warning" | "danger" }> = {
  active: { label: "Aktif", variant: "success" },
  pending: { label: "Menunggu", variant: "warning" },
  rejected: { label: "Ditolak", variant: "danger" },
};
const jenjangFilterItems = { all: "Semua jenjang", SD: "SD", SMP: "SMP", SMA: "SMA", none: "Belum memilih" };

const roleLabel: Record<Role, string> = { student: "Siswa", admin: "Admin" };
const roleFilterItems = { all: "Semua role", ...roleLabel };
const accessFilterItems = { all: "Semua akses", premium: "Premium", free: "Gratis" };

/** Tabel user — filter & paginasi di server lewat query string (lib/user-filters). */
export function UsersTable({
  data,
  filters,
  currentUserId,
  requireApproval,
}: {
  data: AdminUsersPage;
  filters: UserFilters;
  currentUserId: number;
  requireApproval: boolean;
}) {
  const router = useRouter();
  const [navPending, startNav] = useTransition();
  const [bulkPending, startBulk] = useTransition();
  const [query, setQuery] = useState(filters.q ?? "");
  const { rows, total, statusCounts, stats } = data;
  const page = filters.hal ?? 1;
  const pageCount = Math.max(1, Math.ceil(total / USERS_PAGE_SIZE));

  /** Ganti satu/lebih filter; paginasi kembali ke halaman 1 kecuali `hal` diubah. */
  const go = (patch: Partial<Record<keyof UserFilters, string | number | undefined>>) =>
    startNav(() => router.replace(usersHref({ ...filters, hal: undefined, ...patch }), { scroll: false }));

  // Pencarian: kirim ke server setelah berhenti mengetik.
  useEffect(() => {
    const q = query.trim();
    if (q === (filters.q ?? "")) return;
    const t = setTimeout(() => go({ q: q || undefined }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const tab: StatusTab = filters.status ?? "all";
  const from = total === 0 ? 0 : (page - 1) * USERS_PAGE_SIZE + 1;

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total user" value={String(stats.users)} icon={Users} />
        <StatCard label="Siswa" value={String(stats.students)} icon={GraduationCap} tone="muted" />
        <StatCard label="Punya akses premium" value={String(stats.premium)} icon={Crown} tone="cta" />
        <StatCard label="Menunggu konfirmasi" value={String(stats.pending)} icon={Clock} tone="success" />
      </div>

      {stats.pending > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-warning/40 bg-warning-soft p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-sm font-semibold text-warning-strong">
            <Clock className="size-4" aria-hidden /> {stats.pending} pendaftar baru menunggu konfirmasi.
          </p>
          <div className="flex gap-2">
            {tab !== "pending" && (
              <Button size="sm" variant="outline" onClick={() => go({ status: "pending" })}>
                Lihat
              </Button>
            )}
            <Button
              size="sm"
              disabled={bulkPending}
              onClick={() =>
                startBulk(async () => {
                  if (!window.confirm(`Setujui semua ${stats.pending} pendaftar?`)) return;
                  await approveAllPendingAction();
                  router.refresh();
                })
              }
            >
              <Check aria-hidden /> Setujui semua
            </Button>
          </div>
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

      <section className={cn("surface-card overflow-hidden transition-opacity", navPending && "opacity-60")} aria-busy={navPending}>
        <nav aria-label="Status akun" className="flex gap-1 overflow-x-auto border-b px-4 pt-2 sm:px-5">
          {(["all", "pending", "active", "rejected"] as StatusTab[]).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={tab === t}
              onClick={() => go({ status: t === "all" ? undefined : t })}
              className={cn(
                "-mb-px border-b-2 px-3 py-2 text-sm font-semibold whitespace-nowrap",
                tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t === "all" ? "Semua" : statusMeta[t].label} <span className="tabular-nums opacity-70">({statusCounts[t]})</span>
            </button>
          ))}
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
              maxLength={100}
              className="pl-10"
            />
          </div>
          <div className="flex gap-3">
            <Select items={roleFilterItems} value={filters.role ?? "all"} onValueChange={(v) => go({ role: v === "all" ? undefined : String(v) })}>
              <SelectTrigger className="w-full sm:w-36" aria-label="Filter role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua role</SelectItem>
                <SelectItem value="student">Siswa</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select items={jenjangFilterItems} value={filters.jenjang ?? "all"} onValueChange={(v) => go({ jenjang: v === "all" ? undefined : String(v) })}>
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
            <Select items={accessFilterItems} value={filters.akses ?? "all"} onValueChange={(v) => go({ akses: v === "all" ? undefined : String(v) })}>
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
                <th className="px-5 py-3">Jenjang</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Terdaftar</th>
                <th className="px-5 py-3">Akses premium</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((user) => (
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
                    <span className="inline-flex items-center gap-1">
                      <ResetPassword user={user} disabled={user.id === currentUserId} />
                      <DeleteUser user={user} disabled={user.id === currentUserId} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile & tablet: kartu per user (docs/UI_UX.md §5) */}
        <ul className="divide-y lg:hidden">
          {rows.map((user) => (
            <li key={user.id} className="flex flex-col gap-4 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <UserIdentity user={user} />
                <span className="flex items-center gap-1">
                  <ResetPassword user={user} disabled={user.id === currentUserId} />
                  <DeleteUser user={user} disabled={user.id === currentUserId} />
                </span>
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

        {rows.length === 0 && (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">Tidak ada user yang cocok dengan filter.</p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t px-5 py-3 text-xs text-muted-foreground">
          <span>
            Menampilkan {from}–{from === 0 ? 0 : from + rows.length - 1} dari {total} user
          </span>
          {pageCount > 1 && (
            <span className="flex items-center gap-2">
              <Button variant="outline" size="xs" disabled={page <= 1 || navPending} onClick={() => go({ hal: page - 1 > 1 ? page - 1 : undefined })}>
                <ChevronLeft aria-hidden /> Sebelumnya
              </Button>
              <span className="tabular-nums">
                Hal. {page} / {pageCount}
              </span>
              <Button variant="outline" size="xs" disabled={page >= pageCount || navPending} onClick={() => go({ hal: page + 1 })}>
                Berikutnya <ChevronRight aria-hidden />
              </Button>
            </span>
          )}
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

/**
 * Atur ulang kata sandi: sistem membuat kata sandi sementara & menampilkannya
 * SEKALI di sini untuk diberikan ke user. Tidak disimpan dalam bentuk teks.
 */
function ResetPassword({ user, disabled }: { user: AdminUserRow; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  return (
    <AlertDialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        // Kata sandi hanya hidup selama dialog terbuka.
        if (!o) {
          setPassword(null);
          setError(null);
          setCopied(false);
        }
      }}
    >
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            title={disabled ? "Ganti kata sandimu sendiri di Profil" : "Atur ulang kata sandi"}
            aria-label={`Atur ulang kata sandi ${user.name}`}
            className="text-muted-foreground hover:text-primary"
          >
            <KeyRound aria-hidden />
          </Button>
        }
      />
      <AlertDialogContent>
        {password ? (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Kata sandi sementara {user.name}</AlertDialogTitle>
              <AlertDialogDescription>
                Berikan kata sandi ini ke {user.email}. Kata sandi <strong>hanya ditampilkan sekarang</strong> — tidak
                disimpan dan tidak bisa dilihat lagi. Minta user menggantinya di Profil setelah masuk.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
              <code className="flex-1 font-mono text-lg font-bold tracking-wider select-all" aria-label="Kata sandi sementara">
                {password}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  await navigator.clipboard?.writeText(password).catch(() => {});
                  setCopied(true);
                }}
              >
                <Copy aria-hidden /> {copied ? "Tersalin" : "Salin"}
              </Button>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Selesai</AlertDialogCancel>
            </AlertDialogFooter>
          </>
        ) : (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Atur ulang kata sandi?</AlertDialogTitle>
              <AlertDialogDescription>
                Sistem membuat kata sandi sementara baru untuk {user.name} ({user.email}). Kata sandi lama langsung tidak
                berlaku dan user dikeluarkan dari semua perangkat.
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
                    const result = await resetUserPasswordAction(user.id);
                    if (!result.ok) setError(result.error);
                    else setPassword(result.password);
                  });
                }}
              >
                {pending ? "Memproses…" : "Buat kata sandi sementara"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
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
