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

## 2026-09-24 — Fase 1 dikerjakan dari lapisan non-DB dulu
Keputusan: Logika skor/analitik dibuat sebagai fungsi murni yang menerima
data (bukan query DB), UI ujian menerima server action lewat props
(`saveAnswer`, `submitAttempt`). Tipe client (`src/lib/exam.ts`) sengaja
tanpa `isCorrect`/`scoreWeight`. Unit test pakai Vitest 4 (Vitest 5
bentrok peer `@types/node@20`).
Alasan: database belum tersambung; dengan pola ini, begitu tabel siap
tinggal tulis server action yang memanggil fungsi yang sudah teruji.
Catatan skor: mode TKP menganggap "benar" (`correct_count`) = memilih opsi
berbobot tertinggi; `points_override` hanya berlaku di mode `standard`
(TWK/TIU selalu +5 sesuai aturan resmi).
Alternatif yang ditolak: menunggu DB siap dulu — memblokir semua progres.

## 2026-09-21 — Scaffold pakai Next.js 16, bukan 15
Keputusan: Scaffold proyek dengan `create-next-app@latest` yang meng-install
Next.js 16.3.5 (React 19.2, Tailwind v4), bukan Next.js 15 seperti yang
tertulis di draft awal `docs/ARCHITECTURE.md`.
Alasan: Next 16 adalah rilis stabil terbaru saat scaffold dilakukan; tidak
ada kebutuhan fitur yang mengharuskan Next 15. `docs/ARCHITECTURE.md`
sudah diupdate mengikuti versi aktual.
Alternatif yang ditolak: downgrade manual ke Next 15 supaya persis sama
dengan draft dokumen awal — dilewati karena tidak ada manfaat konkret.

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
