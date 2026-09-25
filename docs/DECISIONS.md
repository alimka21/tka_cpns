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

## 2026-09-25 — Better Auth dengan ID serial & tabel auth terpisah
Keputusan: Better Auth memakai `generateId: "serial"` (id INT
auto-increment) dan tabel `users`/`sessions`/`accounts`/`verifications`.
Password disimpan Better Auth di `accounts.password` (scrypt); kolom
`users.password_hash` dihapus. `role` adalah additionalField dengan
`input: false` — tidak bisa diisi dari form daftar; admin ditetapkan lewat
`npm run user:role` (yang juga menghapus sesi lama). Proteksi di layout
(redirect) + cek ulang di setiap server action/route admin.
Alasan: FK yang sudah ada (questions.created_by, stimuli.created_by, dst.)
sudah INT; mengikuti skema bawaan Better Auth menghindari adapter kustom.
Alternatif yang ditolak: id string bawaan Better Auth (harus mengubah semua
FK ke varchar); menyimpan hash sendiri di users (menduplikasi logika auth).

## 2026-09-25 — Aturan bentuk soal PGK & soal grup stimulus
Keputusan: (1) Penskoran semua bentuk *benar penuh atau 0* — PGK MCMA
benar bila himpunan pilihan persis sama dengan kunci; PGK Kategori benar
bila semua pernyataan sesuai kunci. (2) MCMA: 4–5 opsi, kunci 1 s.d.
(jumlah opsi − 1). (3) Kategori: 3–5 pernyataan, pasangan Benar/Salah
atau Sesuai/Tidak Sesuai. (4) Satu stimulus boleh dipakai soal lintas
subdomain; analisis tetap per subdomain soal. Jawaban disimpan sebagai
JSON `attempt_answers.response` (bukan `selected_option_id`). Enum
`single_choice` → `pg` lewat migrasi 3 langkah (0004 tambah, 0005 data,
0006 hapus nilai lama) supaya aman bila tabel sudah berisi.
Alasan: kerangka BSKAP menyerahkan penskoran PGK ke pengelola dan
menyarankan benar penuh; aturan biner paling mudah dijelaskan ke siswa
dan konsisten dengan skor 0–100 yang sudah ada. Batas jumlah kunci MCMA
mencegah soal yang bisa dijawab "pilih semua".
Alternatif yang ditolak: skor parsial proporsional (menambah kerumitan
pelaporan & bisa menguntungkan tebakan acak); kolom jawaban terpisah per
bentuk (skema lebih lebar, validasi tersebar).

## 2026-09-24 — Kerangka asesmen TKA jadi sumber hierarki konten
Keputusan: `asesmen/tka-{sd,smp,sma}.json` (transkripsi kerangka BSKAP)
menjadi sumber kebenaran. Loader `src/server/asesmen/` memvalidasi &
menormalkan (4 varian bentuk level kognitif, preset SMA). Skema DB jadi 4
tingkat: categories(jenjang) → subjects(mata uji, baru) → topics(=domain)
→ subtopics(=subdomain), semua dengan `code` unik; `questions` dapat
`cognitive_level`. Import Excel pakai `kode_subdomain` (bukan nama
topik/subtopik). Isi JSON tidak diubah — transkripsi regulasi.
Alasan: kode baku membuat import, analisis, dan prompt AI presisi tanpa
salah ketik nama; kerangka sendiri mewajibkan soal tertaut ke subdomain.
Nama tabel topics/subtopics dipertahankan + migrasi dua langkah (0002
tambah, 0003 hapus kolom lama) supaya drizzle-kit tidak meminta konfirmasi
rename interaktif dan migrasi lama yang mungkin sudah jalan tidak disentuh.
Alternatif yang ditolak: menyalin cakupan/batasan ke kolom DB (duplikasi
data, rawan tidak sinkron); rename tabel ke domains/subdomains (butuh
rename interaktif + ubah semua kode analitik tanpa manfaat fungsional).

## 2026-09-24 — UI mengikuti Stitch "Web Tes Premium", konten disesuaikan TKA
Keputusan: 10 layar proyek Stitch "Web Tes Premium Landing Page"
diimplementasikan ke kode (peta di `docs/UI_UX.md` §8). Token: Plus
Jakarta Sans, radius card 16px, warna tetap dari UI_UX §2 (amber di kode
bernama `cta`). Semua konten CPNS/SNBT/BKN, statistik pengguna, testimoni,
dan harga dari mockup Stitch dibuang; diganti copy TKA SD/SMP/SMA yang
faktual. Proyek Stitch lain (CMS sekolah, portfolio, dsb.) tidak dipakai.
Halaman tanpa DB memakai `src/lib/demo-data.ts` + banner "data contoh";
pengerjaan tes dipindah ke grup route `(exam)` tanpa navigasi situs.
Import Excel sudah berfungsi sampai tahap pratinjau (server action).
Alasan: mockup Stitch dibuat sebelum scope CPNS dihapus dan berisi angka
contoh yang akan jadi klaim palsu kalau tayang.
Alternatif yang ditolak: menyalin HTML Stitch apa adanya (Tailwind CDN,
Material Symbols, konten CPNS) — tidak konsisten dengan shadcn/lucide dan
scope proyek.

---

## 2026-09-24 — Rumus KaTeX dirender di server
Keputusan: Teks soal/opsi diubah jadi HTML di server (`renderMathToHtml`,
teks biasa di-escape) dan dikirim ke client sebagai `html`. Komponen
client `RichHtml` hanya menampilkan HTML + memuat CSS KaTeX.
Alasan: library KaTeX ±270 KB (chunk JS terbesar) tidak lagi dikirim ke
browser peserta; CSS KaTeX hanya dimuat di halaman yang memakainya.
Catatan: preview rumus live di form admin nanti boleh pakai KaTeX di
client — itu halaman admin, bukan halaman ujian.
Alternatif yang ditolak: render KaTeX di client (lebih lambat di HP
murah milik siswa).

## 2026-09-24 — Fokus TKA sekolah saja, CPNS dihapus
Keputusan: Scope produk hanya TKA siswa SD/SMP/SMA. Semua bagian CPNS
dihapus: mode skor `twk_tiu`/`tkp`, tipe soal `tkp_weighted`, kolom
`question_options.score_weight`, dan field `scoring_mode` di paket tes.
Skor tinggal satu aturan: benar +1 (atau `points_override`), salah/kosong
0. `is_correct` jadi NOT NULL default false. Hierarki konten dipakai
sebagai Jenjang → Mata pelajaran → Materi (tabel tetap `categories` →
`topics` → `subtopics`).
Alasan: permintaan pemilik produk — fokus ke satu pasar.
Catatan: menggantikan "Catatan skor" TKP/TWK di entri sebelumnya. Kolom
`questions.type` tetap ada supaya tipe soal TKA lain (mis. pilihan ganda
kompleks) bisa ditambah tanpa ubah struktur.

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
