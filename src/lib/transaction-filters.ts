// Filter halaman Transaksi (admin) dari query string — satu sumber nama parameter
// untuk halaman server & komponen client.

import { z } from "zod";

export const TRANSACTIONS_PAGE_SIZE = 30;

/** Tab status: `pending` (default) = perlu tindakan, `closed` = kedaluwarsa/gagal/dibatalkan/dikembalikan. */
export const TRANSACTION_TABS = ["pending", "paid", "closed", "all"] as const;
export type TransactionTab = (typeof TRANSACTION_TABS)[number];
export const TRANSACTION_PERIODS = ["today", "7d", "30d", "month"] as const;
export type TransactionPeriod = (typeof TRANSACTION_PERIODS)[number];

export const transactionFilterSchema = z.object({
  status: z.enum(TRANSACTION_TABS).optional().catch(undefined),
  periode: z.enum(TRANSACTION_PERIODS).optional().catch(undefined),
  q: z.string().trim().max(100).optional().catch(undefined),
  hal: z.coerce.number().int().min(1).max(10000).optional().catch(undefined),
});

export type TransactionFilters = z.infer<typeof transactionFilterSchema>;

export function parseTransactionFilters(params: Record<string, string | string[] | undefined>): TransactionFilters {
  const flat = Object.fromEntries(Object.entries(params).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v || undefined]));
  return transactionFilterSchema.parse(flat);
}

export function transactionsHref(filters: Partial<Record<keyof TransactionFilters, string | number | undefined>>) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) if (v !== undefined && v !== "") qs.set(k, String(v));
  const s = qs.toString();
  return s ? `/admin/transaksi?${s}` : "/admin/transaksi";
}

/** "Rp27.023", "27.023", "27023" → 27023; selain angka nominal → null. */
export function parseAmountQuery(q: string): number | null {
  const digits = q.replace(/^rp\.?\s*/i, "").replace(/[.,\s]/g, "");
  return /^\d{3,9}$/.test(digits) ? Number(digits) : null;
}

const WIB_OFFSET_MS = 7 * 3_600_000;

/** Awal hari (00.00 WIB) untuk `now`, sebagai Date UTC. */
export function startOfDayWib(now: Date) {
  const wib = new Date(now.getTime() + WIB_OFFSET_MS);
  return new Date(Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth(), wib.getUTCDate()) - WIB_OFFSET_MS);
}

/** Awal bulan kalender (tgl 1, 00.00 WIB). */
export function startOfMonthWib(now: Date) {
  const wib = new Date(now.getTime() + WIB_OFFSET_MS);
  return new Date(Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth(), 1) - WIB_OFFSET_MS);
}

export function periodStart(period: TransactionPeriod | undefined, now: Date): Date | null {
  if (!period) return null;
  if (period === "today") return startOfDayWib(now);
  if (period === "month") return startOfMonthWib(now);
  return new Date(startOfDayWib(now).getTime() - (period === "7d" ? 6 : 29) * 86_400_000);
}
