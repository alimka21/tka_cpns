// Atribusi kampanye saat pendaftaran (cookie `pk_attr` dari src/proxy.ts → user_attribution).
// Tidak pernah melempar error: pendaftaran tidak boleh gagal karena atribusi.

import { parseAttribution, type AttributionTouch } from "@/lib/attribution";
import { db } from "@/server/db";
import { userAttribution } from "@/server/db/schema";

/** Simpan atribusi user baru. Cookie kosong/rusak → tidak menyimpan apa pun. */
export async function saveSignupAttribution(userId: number, readCookie: () => string | null | undefined): Promise<void> {
  try {
    const attr = parseAttribution(readCookie());
    if (!attr || !Number.isInteger(userId) || userId <= 0) return;
    const first = columns(attr.first);
    const last = columns(attr.last);
    await db
      .insert(userAttribution)
      .values({
        userId,
        firstSource: first.source,
        firstMedium: first.medium,
        firstCampaign: first.campaign,
        firstContent: first.content,
        firstTerm: first.term,
        firstLandingPath: first.path,
        firstSeenAt: first.at,
        lastSource: last.source,
        lastMedium: last.medium,
        lastCampaign: last.campaign,
        lastContent: last.content,
        lastTerm: last.term,
        lastLandingPath: last.path,
        lastSeenAt: last.at,
        // Waktu dari JS (UTC) seperti users.created_at — bukan DEFAULT now() zona waktu server DB.
        createdAt: new Date(),
      })
      // Satu baris per user — panggilan ganda tidak mengubah yang sudah tercatat.
      .onDuplicateKeyUpdate({ set: { userId } });
  } catch (e) {
    console.error("[attribution] gagal menyimpan atribusi user", userId, e instanceof Error ? e.message : e);
  }
}

function columns(t: AttributionTouch) {
  return {
    source: t.source ?? null,
    medium: t.medium ?? null,
    campaign: t.campaign ?? null,
    content: t.content ?? null,
    term: t.term ?? null,
    path: t.path,
    at: new Date(t.at * 1000),
  };
}
