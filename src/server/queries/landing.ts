// Data landing page (publik). Hanya konten yang memang ada di DB — jangan
// pernah menampilkan klaim yang tidak berasal dari data asli.

import { and, asc, count, eq, gte, sql } from "drizzle-orm";
import { TEST_PLAN_MAX_PRICE } from "@/lib/plans";
import { db } from "@/server/db";
import { plans, questionExplanations, questions, testPackages } from "@/server/db/schema";
import { getSetting, type Testimonial } from "@/server/services/app-settings";

export type LandingPlan = { name: string; price: number; durationDays: number | null };
export type LandingStats = { packages: number; premiumPackages: number; questions: number };

export type LandingData = {
  testimonials: Testimonial[];
  /** Paket langganan aktif termurah (bukan paket uji coba) — harga Premium yang ditampilkan. */
  plan: LandingPlan | null;
  /** Angka nyata dari DB (dihitung setiap kunjungan): paket terbit & soal terbit berpembahasan di bank. */
  stats: LandingStats | null;
};

export async function getLandingData(): Promise<LandingData> {
  // DB tidak tersedia (mis. saat build) → landing tetap tampil tanpa data dinamis.
  try {
    const [testimonials, [plan], [pkg], [q]] = await Promise.all([
      getSetting("landing.testimonials"),
      db
        .select({ name: plans.name, price: plans.price, durationDays: plans.durationDays })
        .from(plans)
        .where(and(eq(plans.isActive, true), gte(plans.price, TEST_PLAN_MAX_PRICE)))
        .orderBy(asc(plans.price))
        .limit(1),
      db
        .select({ packages: count(), premium: sql<number>`COALESCE(SUM(${testPackages.isPremium}), 0)` })
        .from(testPackages)
        .where(eq(testPackages.status, "published")),
      // Soal terbit di bank yang punya pembahasan — dipakai paket tes & Latihan Kelemahan.
      db
        .select({ n: count() })
        .from(questions)
        .innerJoin(questionExplanations, eq(questionExplanations.questionId, questions.id))
        .where(and(eq(questions.status, "published"), sql`TRIM(${questionExplanations.explanationText}) <> ''`)),
    ]);
    return {
      testimonials: testimonials.filter((t) => t.visible),
      plan: plan ?? null,
      stats: { packages: Number(pkg.packages), premiumPackages: Number(pkg.premium), questions: Number(q.n) },
    };
  } catch {
    return { testimonials: [], plan: null, stats: null };
  }
}
