import { and, count, desc, eq, gt, inArray, isNull, like, lte, not, or, sql, type SQL } from "drizzle-orm";
import { normalizePhone } from "@/lib/identity";
import type { UserFilters } from "@/lib/user-filters";
import { EXPIRING_DAYS, USERS_PAGE_SIZE } from "@/lib/user-filters";
import { db } from "@/server/db";
import { entitlements, memberships, testPackages, users } from "@/server/db/schema";

export type AdminUserRow = {
  id: number;
  name: string;
  email: string;
  username: string | null;
  phone: string | null;
  province: string | null;
  schoolName: string | null;
  role: "student" | "admin";
  jenjang: "SD" | "SMP" | "SMA" | null;
  status: "active" | "pending" | "rejected";
  createdAt: string;
  /** Akses paket per-paket lama (entitlements) — informasi tambahan. */
  premiumCount: number;
  /** Premium (membership) aktif saat ini. */
  premium: {
    active: boolean;
    /** Akhir masa aktif terjauh; null = selamanya (bila active). */
    endsAt: string | null;
    /** Sisa hari (dibulatkan ke atas) sampai `endsAt`; null = selamanya / tidak aktif. */
    daysLeft: number | null;
    /** Cakupan jenjang aktif, mis. ["SMP"] atau ["Semua"]. */
    scopes: string[];
    source: "purchase" | "admin_manual" | null;
    /** Premium terakhir yang sudah berakhir (untuk status "Kedaluwarsa"). */
    lastEndedAt: string | null;
  };
};

export type AdminUsersPage = {
  rows: AdminUserRow[];
  /** Jumlah baris yang cocok dengan filter (untuk paginasi). */
  total: number;
  /** Hitungan per tab status — mengikuti filter lain kecuali status. */
  statusCounts: { all: number; pending: number; active: number; rejected: number };
  /** Statistik seluruh user (tanpa filter). */
  stats: { users: number; students: number; premium: number; free: number; expiring: number; pending: number };
};

/** Daftar user dengan filter & paginasi di server (Manajemen User). Akses = membership Premium aktif. */
export async function listUsersAdmin(f: UserFilters = {}): Promise<AdminUsersPage> {
  const now = new Date();
  const soon = new Date(now.getTime() + EXPIRING_DAYS * 86_400_000);
  const own = and(eq(memberships.userId, users.id), isNull(memberships.revokedAt));
  const activeM = and(own, or(isNull(memberships.endsAt), gt(memberships.endsAt, now)));
  const hasActive = sql`exists (select 1 from ${memberships} where ${activeM})`;
  const isStudent = eq(users.role, "student");
  const access: Record<NonNullable<UserFilters["akses"]>, SQL> = {
    premium: and(isStudent, hasActive)!,
    free: and(isStudent, not(hasActive))!,
    // Aktif, tapi tidak ada membership yang berlaku melewati `soon`.
    expiring: and(isStudent, hasActive, sql`not exists (select 1 from ${memberships} where ${and(own, or(isNull(memberships.endsAt), gt(memberships.endsAt, soon)))})`)!,
    expired: and(isStudent, not(hasActive), sql`exists (select 1 from ${memberships} where ${and(own, lte(memberships.endsAt, now))})`)!,
  };
  const term = f.q ? `%${f.q.replace(/[%_\\]/g, (c) => `\\${c}`)}%` : null;
  // "0812 3456…" dicari sebagai 62812… (bentuk tersimpan).
  const phoneTerm = f.q ? normalizePhone(f.q) : null;
  const base = [
    term && or(like(users.name, term), like(users.email, term), like(users.username, term), like(users.schoolName, term), phoneTerm ? like(users.phone, `${phoneTerm}%`) : undefined),
    f.role && eq(users.role, f.role),
    f.jenjang && (f.jenjang === "none" ? isNull(users.jenjang) : eq(users.jenjang, f.jenjang)),
    f.akses && access[f.akses],
  ].filter((c): c is SQL => Boolean(c));
  const where = and(...base, f.status ? eq(users.status, f.status) : undefined);
  const page = f.hal ?? 1;

  const [rows, [{ n }], perStatus, [st]] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        username: users.username,
        phone: users.phone,
        province: users.province,
        schoolName: users.schoolName,
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
        students: sql<number>`sum(${isStudent})`,
        pending: sql<number>`sum(${users.status} = 'pending')`,
        premium: sql<number>`sum(${access.premium})`,
        expiring: sql<number>`sum(${access.expiring})`,
      })
      .from(users),
  ]);

  // Rincian membership hanya untuk baris di halaman ini.
  const ids = rows.map((r) => r.id);
  const ms = ids.length
    ? await db
        .select({ userId: memberships.userId, jenjang: memberships.jenjang, endsAt: memberships.endsAt, grantedBy: memberships.grantedBy, createdAt: memberships.createdAt })
        .from(memberships)
        .where(and(inArray(memberships.userId, ids), isNull(memberships.revokedAt)))
    : [];
  const premiumOf = (userId: number): AdminUserRow["premium"] => {
    const mine = ms.filter((m) => m.userId === userId);
    const active = mine.filter((m) => m.endsAt == null || m.endsAt > now);
    const ended = mine.filter((m) => m.endsAt != null && m.endsAt <= now).map((m) => m.endsAt!.getTime());
    const latest = [...active].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
    const forever = active.some((m) => m.endsAt == null);
    const until = forever ? null : active.reduce<Date | null>((mx, m) => (!mx || m.endsAt! > mx ? m.endsAt : mx), null);
    return {
      active: active.length > 0,
      endsAt: until?.toISOString() ?? null,
      daysLeft: until ? Math.ceil((until.getTime() - now.getTime()) / 86_400_000) : null,
      scopes: [...new Set(active.map((m) => m.jenjang ?? "Semua"))],
      source: latest?.grantedBy ?? null,
      lastEndedAt: ended.length ? new Date(Math.max(...ended)).toISOString() : null,
    };
  };

  const by = Object.fromEntries(perStatus.map((r) => [r.status, Number(r.n)])) as Record<string, number>;
  const students = Number(st.students ?? 0);
  const premium = Number(st.premium ?? 0);
  return {
    rows: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString(), premiumCount: Number(r.premiumCount), premium: premiumOf(r.id) })),
    total: Number(n),
    statusCounts: {
      all: (by.pending ?? 0) + (by.active ?? 0) + (by.rejected ?? 0),
      pending: by.pending ?? 0,
      active: by.active ?? 0,
      rejected: by.rejected ?? 0,
    },
    stats: { users: Number(st.users), students, premium, free: students - premium, expiring: Number(st.expiring ?? 0), pending: Number(st.pending ?? 0) },
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
