// Pemilihan harga Premium yang dipromosikan (landing page, popup upgrade).

/** Paket di bawah harga ini dianggap paket uji coba: tetap bisa dibeli bila
 *  aktif, tetapi tidak dipakai sebagai harga promosi. */
export const TEST_PLAN_MAX_PRICE = 5000;

/** Paket aktif termurah yang bukan paket uji coba. */
export function promotedPlan<T extends { price: number; isActive?: boolean }>(plans: T[]): T | undefined {
  return plans.filter((p) => p.isActive !== false && p.price >= TEST_PLAN_MAX_PRICE).sort((a, b) => a.price - b.price)[0];
}
