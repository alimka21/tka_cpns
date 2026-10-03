// Pengaturan sistem (tabel app_settings). Setiap key punya default & skema
// Zod di sini — nilai di DB yang rusak/tidak dikenal jatuh ke default.

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/server/db";
import { appSettings } from "@/server/db/schema";

/** Testimoni landing page — diisi admin dari testimoni ASLI (bukan karangan). */
export const testimonialSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter.").max(80),
  /** Mis. "Siswa kelas 12, SMAN 1 Bandung" atau "Orang tua siswa". */
  role: z.string().trim().max(120).default(""),
  quote: z.string().trim().min(10, "Isi testimoni minimal 10 karakter.").max(400, "Isi testimoni maksimal 400 karakter."),
  visible: z.boolean().default(true),
});
export type Testimonial = z.infer<typeof testimonialSchema>;

const SETTINGS = {
  /** Pendaftar baru (siswa) berstatus `pending` sampai dikonfirmasi admin. */
  "registration.requireApproval": { schema: z.boolean(), default: false },
  "landing.testimonials": { schema: z.array(testimonialSchema).max(12), default: [] as Testimonial[] },
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
