import { and, count, desc, eq, gte, inArray, like, or, sql, type SQL } from "drizzle-orm";
import { normalizePhone } from "@/lib/identity";
import {
  parseAmountQuery,
  periodStart,
  startOfDayWib,
  startOfMonthWib,
  TRANSACTIONS_PAGE_SIZE,
  type TransactionFilters,
  type TransactionTab,
} from "@/lib/transaction-filters";
import { db } from "@/server/db";
import { orders, users, type OrderStatus } from "@/server/db/schema";
import { providerOfOrder, PROVIDER_LABEL, type PaymentProvider } from "@/server/services/payment-provider";

const CLOSED: OrderStatus[] = ["expired", "failed", "cancelled", "refunded"];

export type AdminTransactionRow = {
  id: number;
  orderCode: string;
  provider: PaymentProvider;
  providerLabel: string;
  planName: string;
  jenjang: string | null;
  durationDays: number | null;
  amount: number;
  /** Kode unik order QRIS manual (null untuk gateway). */
  uniqueCode: number | null;
  status: OrderStatus;
  paymentType: string | null;
  createdAt: string;
  paidAt: string | null;
  user: { id: number; name: string; email: string; username: string | null; phone: string | null; schoolName: string | null; province: string | null };
};

export type AdminTransactionsPage = {
  rows: AdminTransactionRow[];
  total: number;
  tabCounts: Record<TransactionTab, number>;
  stats: { pending: number; revenueToday: number; paidToday: number; revenueMonth: number; paidMonth: number; revenueAll: number; paidAll: number };
};

function tabWhere(tab: TransactionTab): SQL | undefined {
  if (tab === "pending") return eq(orders.status, "pending");
  if (tab === "paid") return eq(orders.status, "paid");
  if (tab === "closed") return inArray(orders.status, CLOSED);
  return undefined;
}

/** Transaksi dengan filter & paginasi di server (halaman /admin/transaksi). */
export async function listTransactionsAdmin(f: TransactionFilters = {}): Promise<AdminTransactionsPage> {
  const now = new Date();
  const tab = f.status ?? "pending";
  const term = f.q ? `%${f.q.replace(/[%_\\]/g, (c) => `\\${c}`)}%` : null;
  const amount = f.q ? parseAmountQuery(f.q) : null;
  const phone = f.q ? normalizePhone(f.q) : null;
  const since = periodStart(f.periode, now);
  const base = [
    term &&
      or(
        like(orders.orderCode, term),
        like(users.name, term),
        like(users.email, term),
        like(users.username, term),
        like(users.schoolName, term),
        phone ? like(users.phone, `${phone}%`) : undefined,
        amount != null ? eq(orders.amount, amount) : undefined,
      ),
    since && gte(orders.createdAt, since),
  ].filter((c): c is SQL => Boolean(c));
  const where = and(...base, tabWhere(tab));
  const page = f.hal ?? 1;
  const today = startOfDayWib(now);
  const month = startOfMonthWib(now);

  const [rows, [{ n }], perStatus, [st]] = await Promise.all([
    db
      .select({
        o: orders,
        user: { id: users.id, name: users.name, email: users.email, username: users.username, phone: users.phone, schoolName: users.schoolName, province: users.province },
      })
      .from(orders)
      .innerJoin(users, eq(users.id, orders.userId))
      .where(where)
      // Menunggu: terlama dulu (antrean verifikasi); lainnya: terbaru dulu.
      .orderBy(tab === "pending" ? orders.createdAt : desc(orders.createdAt), desc(orders.id))
      .limit(TRANSACTIONS_PAGE_SIZE)
      .offset((page - 1) * TRANSACTIONS_PAGE_SIZE),
    db.select({ n: count() }).from(orders).innerJoin(users, eq(users.id, orders.userId)).where(where),
    db
      .select({ status: orders.status, n: count() })
      .from(orders)
      .innerJoin(users, eq(users.id, orders.userId))
      .where(base.length ? and(...base) : undefined)
      .groupBy(orders.status),
    db
      .select({
        pending: sql<number>`sum(${orders.status} = 'pending')`,
        revenueToday: sql<number>`coalesce(sum(case when ${orders.status} = 'paid' and ${gte(orders.paidAt, today)} then ${orders.amount} end), 0)`,
        paidToday: sql<number>`sum(${orders.status} = 'paid' and ${gte(orders.paidAt, today)})`,
        revenueMonth: sql<number>`coalesce(sum(case when ${orders.status} = 'paid' and ${gte(orders.paidAt, month)} then ${orders.amount} end), 0)`,
        paidMonth: sql<number>`sum(${orders.status} = 'paid' and ${gte(orders.paidAt, month)})`,
        revenueAll: sql<number>`coalesce(sum(case when ${orders.status} = 'paid' then ${orders.amount} end), 0)`,
        paidAll: sql<number>`sum(${orders.status} = 'paid')`,
      })
      .from(orders),
  ]);

  const by = Object.fromEntries(perStatus.map((r) => [r.status, Number(r.n)])) as Partial<Record<OrderStatus, number>>;
  const closed = CLOSED.reduce((s, k) => s + (by[k] ?? 0), 0);
  return {
    rows: rows.map(({ o, user }) => {
      const provider = providerOfOrder(o.orderCode);
      const payload = (o.lastPayload ?? {}) as { uniqueCode?: unknown };
      return {
        id: o.id,
        orderCode: o.orderCode,
        provider,
        providerLabel: PROVIDER_LABEL[provider],
        planName: o.planName,
        jenjang: o.jenjang,
        durationDays: o.durationDays,
        amount: o.amount,
        uniqueCode: provider === "manual" && typeof payload.uniqueCode === "number" ? payload.uniqueCode : null,
        status: o.status,
        paymentType: o.paymentType,
        createdAt: o.createdAt.toISOString(),
        paidAt: o.paidAt?.toISOString() ?? null,
        user,
      };
    }),
    total: Number(n),
    tabCounts: { pending: by.pending ?? 0, paid: by.paid ?? 0, closed, all: (by.pending ?? 0) + (by.paid ?? 0) + closed },
    stats: {
      pending: Number(st.pending ?? 0),
      revenueToday: Number(st.revenueToday),
      paidToday: Number(st.paidToday ?? 0),
      revenueMonth: Number(st.revenueMonth),
      paidMonth: Number(st.paidMonth ?? 0),
      revenueAll: Number(st.revenueAll),
      paidAll: Number(st.paidAll ?? 0),
    },
  };
}

/** Jumlah transaksi menunggu (badge menu admin). */
export async function countPendingOrders() {
  const [row] = await db.select({ n: count() }).from(orders).where(eq(orders.status, "pending"));
  return Number(row?.n ?? 0);
}
