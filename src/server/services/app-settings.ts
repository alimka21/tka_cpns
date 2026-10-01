// Pengaturan sistem (tabel app_settings). Setiap key punya default & skema
// Zod di sini — nilai di DB yang rusak/tidak dikenal jatuh ke default.

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/server/db";
import { appSettings } from "@/server/db/schema";

const SETTINGS = {
  /** Pendaftar baru (siswa) berstatus `pending` sampai dikonfirmasi admin. */
  "registration.requireApproval": { schema: z.boolean(), default: false },
} as const;

export type SettingKey = keyof typeof SETTINGS;
export type SettingValue<K extends SettingKey> = z.infer<(typeof SETTINGS)[K]["schema"]>;

export async function getSetting<K extends SettingKey>(key: K): Promise<SettingValue<K>> {
  const [row] = await db.select({ value: appSettings.value }).from(appSettings).where(eq(appSettings.key, key));
  const parsed = SETTINGS[key].schema.safeParse(row?.value);
  return (parsed.success ? parsed.data : SETTINGS[key].default) as SettingValue<K>;
}

export async function setSetting<K extends SettingKey>(key: K, value: SettingValue<K>, userId: number) {
  const valid = SETTINGS[key].schema.parse(value);
  await db
    .insert(appSettings)
    .values({ key, value: valid, updatedBy: userId })
    .onDuplicateKeyUpdate({ set: { value: valid, updatedBy: userId } });
}
