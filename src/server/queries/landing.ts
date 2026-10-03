// Data landing page (publik). Hanya angka & teks yang memang ada di DB —
// jangan pernah menampilkan klaim yang tidak berasal dari data asli.

import { countDistinct, eq, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { questions, testPackages } from "@/server/db/schema";
import { getSetting, type Testimonial } from "@/server/services/app-settings";

export type LandingStats = { questions: number; packages: number; subjects: number };

export async function getLandingData(): Promise<{ stats: LandingStats | null; testimonials: Testimonial[] }> {
  // DB tidak tersedia (mis. saat build) → landing tetap tampil tanpa angka/testimoni.
  try {
    const [[q], [p], testimonials] = await Promise.all([
      db.select({ n: sql<number>`count(*)` }).from(questions).where(eq(questions.status, "published")),
      db
        .select({ n: sql<number>`count(*)`, subjects: countDistinct(testPackages.subjectId) })
        .from(testPackages)
        .where(eq(testPackages.status, "published")),
      getSetting("landing.testimonials"),
    ]);
    return {
      stats: { questions: Number(q?.n ?? 0), packages: Number(p?.n ?? 0), subjects: Number(p?.subjects ?? 0) },
      testimonials: testimonials.filter((t) => t.visible),
    };
  } catch {
    return { stats: null, testimonials: [] };
  }
}
