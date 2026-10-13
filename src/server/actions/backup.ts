"use server";

// Backup database dari panel admin (tombol "Buat backup sekarang" & kirim email).

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/server/auth/session";
import { createBackup, emailBackup } from "@/server/services/db-backup";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

export async function createBackupAction(sendEmail: boolean): Promise<Result<{ message: string }>> {
  if (!(await getAdminSession())) return { ok: false, error: "Sesi admin berakhir. Silakan masuk lagi." };
  try {
    const r = await createBackup();
    const email = sendEmail ? await emailBackup(r).catch((e: Error) => ({ sent: false, note: e.message })) : null;
    revalidatePath("/admin/backup");
    const mb = (r.sizeBytes / 1024 / 1024).toFixed(2);
    return { ok: true, message: `Backup ${r.name} dibuat (${mb} MB, ${r.rows.toLocaleString("id-ID")} baris).${email ? ` Email: ${email.note}.` : ""}` };
  } catch (e) {
    console.error("[backup] gagal:", e instanceof Error ? e.message : e);
    return { ok: false, error: `Backup gagal: ${e instanceof Error ? e.message : "kesalahan tidak dikenal"}` };
  }
}
