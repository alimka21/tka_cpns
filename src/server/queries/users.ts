import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { entitlements, testPackages, users } from "@/server/db/schema";

export type AdminUserRow = {
  id: number;
  name: string;
  email: string;
  role: "student" | "admin";
  createdAt: string;
  premiumCount: number;
};

export async function listUsersAdmin(): Promise<AdminUserRow[]> {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      premiumCount: sql<number>`count(distinct ${entitlements.id})`,
    })
    .from(users)
    .leftJoin(entitlements, eq(entitlements.userId, users.id))
    .groupBy(users.id)
    .orderBy(desc(users.createdAt));
  return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString(), premiumCount: Number(r.premiumCount) }));
}

/** Jumlah paket premium yang tayang — dipakai sebagai penyebut "x dari y paket". */
export async function countPublishedPremiumPackages() {
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(testPackages)
    .where(eq(testPackages.isPremium, true));
  return Number(row?.n ?? 0);
}
