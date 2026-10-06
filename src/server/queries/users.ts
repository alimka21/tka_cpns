import { and, count, desc, eq, isNull, like, not, or, sql, type SQL } from "drizzle-orm";
import type { UserFilters } from "@/lib/user-filters";
import { USERS_PAGE_SIZE } from "@/lib/user-filters";
import { db } from "@/server/db";
import { entitlements, testPackages, users } from "@/server/db/schema";

export type AdminUserRow = {
  id: number;
  name: string;
  email: string;
  role: "student" | "admin";
  jenjang: "SD" | "SMP" | "SMA" | null;
  status: "active" | "pending" | "rejected";
  createdAt: string;
  premiumCount: number;
};

export type AdminUsersPage = {
  rows: AdminUserRow[];
  /** Jumlah baris yang cocok dengan filter (untuk paginasi). */
  total: number;
  /** Hitungan per tab status — mengikuti filter lain kecuali status. */
  statusCounts: { all: number; pending: number; active: number; rejected: number };
  /** Statistik seluruh user (tanpa filter). */
  stats: { users: number; students: number; premium: number; pending: number };
};

/** Daftar user dengan filter & paginasi di server (Manajemen User). */
export async function listUsersAdmin(f: UserFilters = {}): Promise<AdminUsersPage> {
  const hasEntitlement = sql`exists (select 1 from ${entitlements} where ${entitlements.userId} = ${users.id})`;
  const term = f.q ? `%${f.q.replace(/[%_\\]/g, (c) => `\\${c}`)}%` : null;
  const base = [
    term && or(like(users.name, term), like(users.email, term)),
    f.role && eq(users.role, f.role),
    f.jenjang && (f.jenjang === "none" ? isNull(users.jenjang) : eq(users.jenjang, f.jenjang)),
    f.akses && (f.akses === "premium" ? hasEntitlement : not(hasEntitlement)),
  ].filter((c): c is SQL => Boolean(c));
  const where = and(...base, f.status ? eq(users.status, f.status) : undefined);
  const page = f.hal ?? 1;

  const [rows, [{ n }], perStatus, [st]] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        jenjang: users.jenjang,
        status: users.status,
        createdAt: users.createdAt,
        premiumCount: sql<number>`(select count(*) from ${entitlements} where ${entitlements.userId} = ${users.id})`,
      })
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt), desc(users.id))
      .limit(USERS_PAGE_SIZE)
      .offset((page - 1) * USERS_PAGE_SIZE),
    db.select({ n: count() }).from(users).where(where),
    db
      .select({ status: users.status, n: count() })
      .from(users)
      .where(base.length ? and(...base) : undefined)
      .groupBy(users.status),
    db
      .select({
        users: count(),
        students: sql<number>`sum(${users.role} = 'student')`,
        pending: sql<number>`sum(${users.status} = 'pending')`,
        premium: sql<number>`sum(${hasEntitlement})`,
      })
      .from(users),
  ]);
  const by = Object.fromEntries(perStatus.map((r) => [r.status, Number(r.n)])) as Record<string, number>;
  return {
    rows: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString(), premiumCount: Number(r.premiumCount) })),
    total: Number(n),
    statusCounts: {
      all: (by.pending ?? 0) + (by.active ?? 0) + (by.rejected ?? 0),
      pending: by.pending ?? 0,
      active: by.active ?? 0,
      rejected: by.rejected ?? 0,
    },
    stats: { users: Number(st.users), students: Number(st.students ?? 0), premium: Number(st.premium ?? 0), pending: Number(st.pending ?? 0) },
  };
}

/** Jumlah paket premium yang tayang — dipakai sebagai penyebut "x dari y paket". */
export async function countPublishedPremiumPackages() {
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(testPackages)
    .where(eq(testPackages.isPremium, true));
  return Number(row?.n ?? 0);
}

/** Jumlah pendaftar yang menunggu konfirmasi (badge menu admin). */
export async function countPendingUsers() {
  const [row] = await db.select({ n: sql<number>`count(*)` }).from(users).where(eq(users.status, "pending"));
  return Number(row?.n ?? 0);
}
