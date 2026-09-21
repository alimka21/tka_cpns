# Log Keputusan (ADR Ringkas)

Tambahkan entri baru di **atas** (terbaru dulu). Satu entri = beberapa
baris saja. Ini menggantikan penjelasan panjang di chat supaya sesi
Claude Code berikutnya tahu "kenapa" tanpa baca ulang riwayat percakapan.

Format:
```
## YYYY-MM-DD — Judul singkat
Keputusan: ...
Alasan: ...
Alternatif yang ditolak: ...
```

---

## 2026-09-21 — Stack awal & scope fase 1
Keputusan: Next.js + TypeScript + Tailwind/shadcn + MySQL/Drizzle,
deploy ke Hostinger Node.js hosting dari GitHub. Payment gateway di-skip
dulu, entitlement premium diisi manual oleh admin. Gemini API key
disimpan per-user (terenkripsi), tidak pakai key server global.
Alasan: sesuai paket hosting Hostinger yang dimiliki user, dan supaya
biaya AI ditanggung masing-masing user/admin, bukan menumpuk di satu
akun Gemini.
Alternatif yang ditolak: Nuxt/SvelteKit (fungsional serupa, dipilih
Next.js karena ekosistem & referensi lebih luas untuk kolaborasi ke
depan).
