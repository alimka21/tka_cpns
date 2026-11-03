// Laporan atribusi kampanye (/admin/atribusi & API agen). HANYA agregat — tanpa nama,
// email, No. HP, atau data pribadi lain. Kohort = siswa yang MENDAFTAR di rentang
// tanggal; pembelian Premium = order `paid` milik siswa itu (kapan pun dibayar).

import { and, asc, count, desc, eq, gte, isNull, lt, or, sql } from "drizzle-orm";
import { conversionPercent, type AttributionModel, type AttributionRange } from "@/lib/attribution-report";
import { db } from "@/server/db";
import { leadMagnetDownloads, leadMagnets, orders, userAttribution, users } from "@/server/db/schema";

export type CampaignRow = {
  /** null = pendaftar tanpa UTM (langsung, organik, atau cookie hilang). */
  campaign: string | null;
  /** Kombinasi source/medium yang muncul untuk kampanye ini, mis. "instagram/dm". */
  channels: string[];
  signups: number;
  buyers: number;
  revenue: number;
  conversion: number;
};

export type LeadMagnetRow = {
  slug: string;
  title: string;
  isActive: boolean;
  downloads: number;
  /** Unduhan oleh akun yang dibuat ≤ 24 jam sebelum mengunduh. */
  downloadsByNewUsers: number;
  /** Pendaftar di rentang ini yang halaman pertamanya (first touch) = /materi/<slug>. */
  firstLandingSignups: number;
};

export type AttributionReport = {
  totals: { signups: number; attributed: number; buyers: number; revenue: number; conversion: number };
  campaigns: CampaignRow[];
  leadMagnets: LeadMagnetRow[];
};

const cohort = (range: AttributionRange) => and(eq(users.role, "student"), gte(users.createdAt, range.start), lt(users.createdAt, range.end));

export async function campaignReport(range: AttributionRange, model: AttributionModel): Promise<CampaignRow[]> {
  const t = model === "first"
    ? { campaign: userAttribution.firstCampaign, source: userAttribution.firstSource, medium: userAttribution.firstMedium }
    : { campaign: userAttribution.lastCampaign, source: userAttribution.lastSource, medium: userAttribution.lastMedium };
  const paid = db
    .select({ userId: orders.userId, revenue: sql<string>`sum(${orders.amount})`.as("revenue") })
    .from(orders)
    .where(eq(orders.status, "paid"))
    .groupBy(orders.userId)
    .as("paid");

  const rows = await db
    .select({
      campaign: t.campaign,
      channels: sql<string | null>`group_concat(distinct concat_ws('/', ${t.source}, ${t.medium}) order by 1 separator ',')`,
      signups: count(users.id),
      buyers: count(paid.userId),
      revenue: sql<string>`coalesce(sum(${paid.revenue}), 0)`,
    })
    .from(users)
    .leftJoin(userAttribution, eq(userAttribution.userId, users.id))
    .leftJoin(paid, eq(paid.userId, users.id))
    .where(cohort(range))
    .groupBy(t.campaign)
    .orderBy(desc(count(users.id)), asc(t.campaign));

  return rows.map((r) => {
    const signups = Number(r.signups);
    const buyers = Number(r.buyers);
    return {
      campaign: r.campaign,
      channels: r.channels ? r.channels.split(",").filter(Boolean) : [],
      signups,
      buyers,
      revenue: Number(r.revenue),
      conversion: conversionPercent(buyers, signups),
    };
  });
}

export async function leadMagnetReport(range: AttributionRange): Promise<LeadMagnetRow[]> {
  const newUser = sql`${users.createdAt} >= ${leadMagnetDownloads.createdAt} - interval 1 day`;
  const [magnets, downloads, landings] = await Promise.all([
    db.select({ id: leadMagnets.id, slug: leadMagnets.slug, title: leadMagnets.title, isActive: leadMagnets.isActive }).from(leadMagnets).orderBy(desc(leadMagnets.createdAt)),
    db
      .select({
        id: leadMagnetDownloads.leadMagnetId,
        downloads: count(leadMagnetDownloads.id),
        byNew: sql<string>`coalesce(sum(case when ${newUser} then 1 else 0 end), 0)`,
      })
      .from(leadMagnetDownloads)
      .leftJoin(users, eq(users.id, leadMagnetDownloads.userId))
      // Unduhan admin (mengecek materi) tidak dihitung; pengunjung tanpa login tetap dihitung.
      .where(
        and(
          gte(leadMagnetDownloads.createdAt, range.start),
          lt(leadMagnetDownloads.createdAt, range.end),
          or(isNull(leadMagnetDownloads.userId), eq(users.role, "student")),
        ),
      )
      .groupBy(leadMagnetDownloads.leadMagnetId),
    db
      .select({ path: userAttribution.firstLandingPath, n: count(users.id) })
      .from(users)
      .innerJoin(userAttribution, eq(userAttribution.userId, users.id))
      .where(and(cohort(range), sql`${userAttribution.firstLandingPath} like '/materi/%'`))
      .groupBy(userAttribution.firstLandingPath),
  ]);
  const downloadsOf = new Map(downloads.map((d) => [d.id, d]));
  const landingsOf = new Map(landings.map((l) => [l.path, Number(l.n)]));
  return magnets.map((m) => ({
    slug: m.slug,
    title: m.title,
    isActive: m.isActive,
    downloads: Number(downloadsOf.get(m.id)?.downloads ?? 0),
    downloadsByNewUsers: Number(downloadsOf.get(m.id)?.byNew ?? 0),
    firstLandingSignups: landingsOf.get(`/materi/${m.slug}`) ?? 0,
  }));
}

export async function attributionReport(range: AttributionRange, model: AttributionModel): Promise<AttributionReport> {
  const [campaigns, magnets] = await Promise.all([campaignReport(range, model), leadMagnetReport(range)]);
  const sum = (pick: (r: CampaignRow) => number, rows = campaigns) => rows.reduce((a, r) => a + pick(r), 0);
  const signups = sum((r) => r.signups);
  const buyers = sum((r) => r.buyers);
  return {
    totals: {
      signups,
      attributed: sum((r) => r.signups, campaigns.filter((r) => r.campaign !== null)),
      buyers,
      revenue: sum((r) => r.revenue),
      conversion: conversionPercent(buyers, signups),
    },
    campaigns,
    leadMagnets: magnets,
  };
}
