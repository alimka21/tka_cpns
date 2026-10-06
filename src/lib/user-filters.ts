// Filter Manajemen User (admin) dari query string — dipakai halaman server &
// komponen tabel (client) supaya nama parameter URL satu sumber.

import { z } from "zod";

export const USERS_PAGE_SIZE = 50;

export const userFilterSchema = z.object({
  status: z.enum(["pending", "active", "rejected"]).optional().catch(undefined),
  role: z.enum(["student", "admin"]).optional().catch(undefined),
  jenjang: z.enum(["SD", "SMP", "SMA", "none"]).optional().catch(undefined),
  akses: z.enum(["premium", "free"]).optional().catch(undefined),
  q: z.string().trim().max(100).optional().catch(undefined),
  hal: z.coerce.number().int().min(1).max(10000).optional().catch(undefined),
});

export type UserFilters = z.infer<typeof userFilterSchema>;

export function parseUserFilters(params: Record<string, string | string[] | undefined>): UserFilters {
  const flat = Object.fromEntries(Object.entries(params).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v || undefined]));
  return userFilterSchema.parse(flat);
}

/** URL Manajemen User dengan filter; `undefined`/kosong dibuang. */
export function usersHref(filters: Partial<Record<keyof UserFilters, string | number | undefined>>) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) if (v !== undefined && v !== "") qs.set(k, String(v));
  const s = qs.toString();
  return s ? `/admin/users?${s}` : "/admin/users";
}
