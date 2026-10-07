// Batas akun gratis (keputusan pemilik produk 2026-10-07):
// - 1 paket tes GRATIS per mata pelajaran per jenjang (paket yang sama boleh
//   diulang; paket lain di mapel itu butuh Premium);
// - hasil tes: skor & kunci jawaban terlihat, tetapi pembahasan per soal dan
//   statistik kelemahan khusus Premium (konten terkunci TIDAK dikirim ke browser);
// - Latihan Kelemahan khusus Premium (sudah dicek di halaman & action latihan).

import { hasEntitlement } from "@/server/queries/packages";
import { getActiveMembership } from "@/server/services/billing";

export { freeUsageBySubject } from "@/server/queries/free-usage";

/** Premium untuk jenjang itu (membership aktif) atau admin. */
export async function isPremiumUser(user: { id: number; role?: string | null }, jenjang: string | null) {
  if (user.role === "admin") return true;
  return (await getActiveMembership(user.id, jenjang)) != null;
}

/** Boleh melihat pembahasan & statistik kelemahan hasil tes paket ini? */
export async function canSeeFullResults(user: { id: number; role?: string | null }, jenjang: string | null, testPackageId: number) {
  return (await isPremiumUser(user, jenjang)) || (await hasEntitlement(user.id, testPackageId));
}
