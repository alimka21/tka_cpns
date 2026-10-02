// Info login kata sandi milik akun (akun Google-only tidak punya kata sandi).

import { and, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { accounts } from "@/server/db/schema";

/** Akun punya login email/password (bukan hanya Google)? */
export async function hasCredentialPassword(userId: number) {
  const [row] = await db
    .select({ password: accounts.password })
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.providerId, "credential")))
    .limit(1);
  return Boolean(row?.password);
}
