import { index, int, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";
import { users } from "./users";

// Grup: Atribusi kampanye (UTM). Hanya parameter kampanye — tanpa IP, perangkat,
// atau data pribadi lain (pengguna kebanyakan siswa di bawah umur).

/** Satu baris per user, diisi sekali saat pendaftaran dari cookie `pk_attr` (lib/attribution). */
export const userAttribution = mysqlTable(
  "user_attribution",
  {
    userId: int("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Touch pertama (tidak pernah ditimpa selama cookie berlaku 30 hari). */
    firstSource: varchar("first_source", { length: 64 }),
    firstMedium: varchar("first_medium", { length: 64 }),
    firstCampaign: varchar("first_campaign", { length: 64 }),
    firstContent: varchar("first_content", { length: 64 }),
    firstTerm: varchar("first_term", { length: 64 }),
    firstLandingPath: varchar("first_landing_path", { length: 255 }),
    firstSeenAt: timestamp("first_seen_at"),
    /** Touch terakhir sebelum mendaftar. */
    lastSource: varchar("last_source", { length: 64 }),
    lastMedium: varchar("last_medium", { length: 64 }),
    lastCampaign: varchar("last_campaign", { length: 64 }),
    lastContent: varchar("last_content", { length: 64 }),
    lastTerm: varchar("last_term", { length: 64 }),
    lastLandingPath: varchar("last_landing_path", { length: 255 }),
    lastSeenAt: timestamp("last_seen_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("user_attribution_first_campaign_idx").on(t.firstCampaign),
    index("user_attribution_last_campaign_idx").on(t.lastCampaign),
    index("user_attribution_first_landing_idx").on(t.firstLandingPath),
  ],
);
