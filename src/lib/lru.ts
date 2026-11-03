/**
 * Cache LRU sederhana di memori proses, dibatasi total ukuran (byte). Map menjaga
 * urutan sisip → entri paling lama dipakai ada di depan. Hostinger menjalankan satu
 * proses Node, jadi cache ini berlaku untuk semua request (hilang saat restart).
 */
export class ByteLru<V> {
  private map = new Map<string, { value: V; size: number }>();
  private total = 0;

  constructor(
    private readonly maxBytes: number,
    private readonly maxEntrySize = maxBytes,
  ) {}

  get(key: string): V | undefined {
    const hit = this.map.get(key);
    if (!hit) return undefined;
    this.map.delete(key);
    this.map.set(key, hit);
    return hit.value;
  }

  set(key: string, value: V, size: number) {
    this.delete(key);
    if (size > this.maxEntrySize || size > this.maxBytes) return;
    this.map.set(key, { value, size });
    this.total += size;
    for (const [k, v] of this.map) {
      if (this.total <= this.maxBytes) break;
      this.map.delete(k);
      this.total -= v.size;
    }
  }

  delete(key: string) {
    const hit = this.map.get(key);
    if (!hit) return;
    this.map.delete(key);
    this.total -= hit.size;
  }

  /** Hapus semua entri yang kuncinya diawali `prefix` (mis. semua versi satu id). */
  deletePrefix(prefix: string) {
    for (const key of [...this.map.keys()]) if (key.startsWith(prefix)) this.delete(key);
  }

  get size() {
    return this.map.size;
  }

  get bytes() {
    return this.total;
  }
}
