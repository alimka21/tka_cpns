// Pembayaran manual: QRIS statis (GoPay Merchant) + kode unik di belakang nominal,
// lalu siswa mengirim bukti transfer ke WhatsApp admin dan admin mengonfirmasi
// di /admin/langganan. Dipakai selama QRIS payment gateway belum aktif
// (DECISIONS 2026-10-16). Fungsi di sini murni (aman untuk client & test).

/** Gambar QRIS statis di /public. */
export const MANUAL_QRIS_IMAGE = "/pembayaran/qris-pakar-tka.jpg";
export const MANUAL_QRIS_MERCHANT = "NURUL ALAMI, EDUKASI";

/** Nomor WhatsApp admin (format internasional tanpa +). Bisa ditimpa env NEXT_PUBLIC_ADMIN_WA. */
export const ADMIN_WA_NUMBER = (process.env.NEXT_PUBLIC_ADMIN_WA || "6285191537712").replace(/\D/g, "");

export function formatWaNumber(n = ADMIN_WA_NUMBER) {
  const local = n.startsWith("62") ? `0${n.slice(2)}` : n;
  return local.replace(/^(\d{4})(\d{4})(\d+)$/, "$1-$2-$3");
}

/** Kode unik 1–999 ditambahkan ke harga agar transfer mudah dicocokkan. */
export const UNIQUE_CODE_MAX = 999;

/**
 * Pilih kode unik sehingga `price + kode` tidak sama dengan nominal order manual
 * lain yang masih menunggu. `random` disuntik agar bisa dites.
 */
export function pickUniqueCode(price: number, takenAmounts: Iterable<number>, random: () => number = Math.random): number | null {
  const taken = new Set(takenAmounts);
  const free: number[] = [];
  for (let c = 1; c <= UNIQUE_CODE_MAX; c++) if (!taken.has(price + c)) free.push(c);
  if (free.length === 0) return null;
  return free[Math.floor(random() * free.length)];
}

export type ManualProofInfo = {
  name: string;
  province: string;
  school: string;
  account: string;
  planName: string;
  orderCode: string;
  amount: string;
};

/** Pesan WhatsApp formal untuk mengirim bukti transfer. */
export function manualProofMessage(i: ManualProofInfo) {
  return [
    "Yth. Admin Pakar TKA,",
    "",
    "Dengan hormat, saya telah melakukan pembayaran langganan Premium Pakar TKA dengan rincian sebagai berikut:",
    "",
    `Nama: ${i.name}`,
    `Asal Provinsi: ${i.province}`,
    `Nama Sekolah: ${i.school}`,
    `Akun: ${i.account}`,
    `Paket: ${i.planName}`,
    `Kode Order: ${i.orderCode}`,
    `Nominal Transfer: ${i.amount}`,
    "",
    "Bersama pesan ini saya lampirkan bukti transfer. Mohon bantuan Admin untuk mengaktifkan akses Premium pada akun saya.",
    "",
    "Atas perhatian dan bantuannya, saya ucapkan terima kasih.",
  ].join("\n");
}

export function waLink(text: string, number = ADMIN_WA_NUMBER) {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
