/**
 * Pembatas jumlah permintaan sederhana di memori (jendela tetap per kunci). Hostinger
 * menjalankan satu proses Node, jadi cukup untuk endpoint ringan; hitungan hilang saat restart.
 */
export class FixedWindowLimiter {
  private hits = new Map<string, { start: number; count: number }>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly maxKeys = 10_000,
  ) {}

  /** Catat satu permintaan. `ok: false` = melebihi batas; `retryAfter` dalam detik. */
  take(key: string, now = Date.now()): { ok: boolean; remaining: number; retryAfter: number } {
    let entry = this.hits.get(key);
    if (!entry || now - entry.start >= this.windowMs) {
      if (!entry && this.hits.size >= this.maxKeys) this.prune(now);
      entry = { start: now, count: 0 };
      this.hits.set(key, entry);
    }
    entry.count += 1;
    const retryAfter = Math.max(1, Math.ceil((entry.start + this.windowMs - now) / 1000));
    return { ok: entry.count <= this.limit, remaining: Math.max(0, this.limit - entry.count), retryAfter };
  }

  private prune(now: number) {
    for (const [k, v] of this.hits) if (now - v.start >= this.windowMs) this.hits.delete(k);
    // Masih penuh (serangan banyak kunci) → kosongkan saja; lebih aman daripada memori tumbuh.
    if (this.hits.size >= this.maxKeys) this.hits.clear();
  }
}
