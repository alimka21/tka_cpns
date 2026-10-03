"use server";

// Konten landing page yang dikelola admin (testimoni).

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminSession } from "@/server/auth/session";
import { setSetting, testimonialSchema } from "@/server/services/app-settings";

export async function saveTestimonialsAction(input: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: "Sesi admin berakhir. Silakan masuk lagi." };
  const parsed = z.array(testimonialSchema).max(12, "Maksimal 12 testimoni.").safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const row = typeof issue.path[0] === "number" ? `Testimoni ${issue.path[0] + 1}: ` : "";
    return { ok: false, error: row + issue.message };
  }
  await setSetting("landing.testimonials", parsed.data, Number(session.user.id));
  revalidatePath("/");
  revalidatePath("/admin/pengaturan");
  return { ok: true };
}
