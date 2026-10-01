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

## 2026-10-01 — Aturan paket TKA ditegakkan sistem
Keputusan: setiap paket = 1 jenjang + 1 mata pelajaran (`test_packages.subject_id`,
migrasi 0015). Aturan di `docs/ATURAN_PAKET.md` / `lib/package-rules.ts`:
**wajib** (memblokir penerbitan, dicek ulang di server dengan data DB):
jumlah soal & durasi per mapel, PG sederhana 50–60%, semua soal dari mapel
paket; **disarankan** (peringatan): ada MCMA & Kategori, SMA mayoritas
berbasis stimulus/gambar & grup 3–5 soal. Durasi terisi otomatis & terkunci
sesuai aturan. Pasangan kategori **Ya/Tidak** ditambahkan (import: Y/T).
Cakupan materi (opsi B, dipilih pemilik produk setelah analisa): semua
**topik** wajib ≥1 soal; **subtopik wajib ≥80%** (100% disarankan); untuk
mapel < 2 soal/subtopik disarankan satu stimulus berisi subtopik berbeda.
Wajib 100% ditolak karena bertabrakan dengan grup stimulus 3–5 soal di
mapel padat (Antropologi 25 soal/17 subtopik). Mode AI grup kini bisa
multi-subtopik (`extraSubdomainCodes`, tiap soal `subtopicCode`).
Paket lama tanpa mapel tetap tampil, tetapi harus diberi mapel & memenuhi
aturan sebelum bisa diterbitkan ulang.
Alasan: permintaan pemilik produk — setiap paket harus sesuai format TKA resmi.
Alternatif yang ditolak: aturan hanya sebagai dokumen/peringatan (admin bisa
lupa); simpan aturan di DB (belum perlu diubah-ubah, cukup kode + dokumen).

## 2026-10-01 — API key Gemini divalidasi dengan tes ping, bukan format
Keputusan: tidak ada aturan format/awalan key (Google punya `AIza…` & `AQ.…`
dan bisa berubah). Saat disimpan, key di-ping ke Google
(`GET /v1beta/models?pageSize=1`, tanpa kuota generate, tidak bergantung
model). Di aplikasi hanya pengaman teknis: trim, 10–500 karakter, tanpa
spasi/baris baru/karakter tak terlihat (key dikirim sebagai header HTTP).
Error Google dibaca dari `error.details[].reason` (400 API_KEY_INVALID /
401 → key ditolak; 403 → API tidak aktif / key dibatasi; 429 → kuota).
Alasan: key asli user format `AQ.` ditolak regex lama padahal diterima Google.

## 2026-10-01 — Login Google (Better Auth social provider)
Keputusan: Google aktif hanya bila env `GOOGLE_CLIENT_ID`/`SECRET` diisi
(tombol disembunyikan bila tidak). `prompt=select_account`. Account linking
otomatis untuk Google (email terverifikasi) supaya tidak ada akun ganda.
Callback kembali ke `/masuk` yang mengarahkan sesuai role/status; akun baru
tanpa jenjang → `/pilih-jenjang`. Hook konfirmasi pendaftar berlaku sama.
Alasan: daftar lebih cepat untuk siswa; tetap memakai alur jenjang &
konfirmasi yang sudah ada.

## 2026-10-01 — Premium via Midtrans Snap (membership, bukan per paket)
Keputusan: model akses = akun gratis (paket `is_premium = false`) vs
Premium (membership per jenjang dengan masa aktif) yang membuka semua paket
premium jenjangnya + Latihan Kelemahan. Paket langganan (harga/durasi/
jenjang) diatur admin di `/admin/langganan`. Pembayaran: Midtrans Snap
**redirect** (tanpa snap.js → tanpa client key & masalah CSP). Order dibuat
di DB dulu, lalu transaksi Snap. Webhook `/api/midtrans/notification`:
verifikasi signature SHA-512, lalu **ambil ulang status dari Status API**
(payload palsu/nominal diubah tidak berpengaruh), terapkan idempoten
(unique `memberships.order_id`); status final tidak mundur. Halaman finish
`/langganan/selesai` juga menyinkronkan status (cadangan bila webhook
telat). Server Key hanya di env (`MIDTRANS_SERVER_KEY`,
`MIDTRANS_IS_PRODUCTION`). Pool MySQL: idleTimeout 10 dtk + keep-alive
(wait_timeout Hostinger 20 dtk; ECONNRESET terlihat saat uji).
Alasan: sesuai konsep user ("bayar → semua terbuka otomatis"); redirect
paling sederhana & aman.
Alternatif yang ditolak: entitlement per paket per pembelian (tidak
membuka Latihan Kelemahan, rumit saat paket baru ditambah); Snap popup
(butuh client key + skrip pihak ketiga).

## 2026-10-01 — Jenjang per akun & konfirmasi pendaftar
Keputusan: setiap siswa punya `users.jenjang` (wajib saat daftar; akun lama
dipaksa memilih di `/pilih-jenjang`). Siswa hanya melihat & bisa mengerjakan
paket jenjangnya; admin melihat semua. Jenjang bisa diganti siswa di
Pengaturan atau oleh admin. Konfirmasi pendaftar opsional lewat pengaturan
sistem (`/admin/pengaturan`): bila aktif, akun siswa baru `pending` →
`/menunggu-konfirmasi` sampai disetujui di `/admin/users`; ditolak = sesi
dihapus. Pemeriksaan ada di `requireUser` (halaman) & `getActiveSession`
(server action siswa). Pembayaran otomatis belum dibangun — rencana: payment
gateway → webhook → entitlement `granted_by = purchase` (lihat ROADMAP Fase 3).
Alasan: soal & kerangka asesmen berbeda per jenjang; sekolah/penyelenggara
perlu menyaring pendaftar.
Alternatif yang ditolak: jenjang per paket saja tanpa di akun (siswa bisa
salah pilih paket); blokir login pending di Better Auth (pesan error kurang
jelas dibanding halaman tunggu).

## 2026-09-30 — Latihan AI, laporan soal, mode grup, nama FK ≤ 64
Keputusan: (1) Latihan AI dibuat saat sesi dimulai bila bank kurang,
memakai key siswa, maks 10 soal/sesi & 10 panggilan Gemini/24 jam; soal
disimpan privat (`practice_questions`), ikut diagnosa, tidak ikut skor
resmi. (2) Laporan soal satu tabel untuk soal bank & Latihan AI; soal
Latihan AI hanya bisa dilaporkan pemiliknya. (3) Mode grup: bentuk
"campuran" hanya untuk grup; bacaan AI disimpan sebagai stimulus Draft
(kode `AI-yymmdd-xxxxx`), percobaan ulang memakai bacaan yang sama.
(4) Semua FK harus bernama ≤ 64 karakter — bila nama otomatis Drizzle
terlalu panjang, pakai `foreignKey({ name })` (migrasi 0012 sempat gagal).
(5) Gemini 3: temperature dibiarkan default model.
Alasan: sesuai AI_GENERATION.md §5–7; MariaDB tidak transaksional untuk
DDL, jadi migrasi gagal di tengah harus diselesaikan manual.
Alternatif yang ditolak: soal AI latihan di bank resmi (tanpa review →
berisiko untuk tes resmi); limit per sesi saja (kuota key siswa bisa habis).

## 2026-09-30 — AI admin: 3 mode, gambar di DB, Gemini via REST
Keputusan: generate soal admin punya 3 mode — soal baru dari subdomain,
variasi (modifikasi soal bank; subdomain ikut soal asal, soal asal +
kuncinya masuk prompt), dan dari gambar (1 gambar galeri → beberapa soal,
dikirim inline ke Gemini). Semua hasil `pending_review`. Gambar disimpan
di MariaDB (MEDIUMBLOB, dikompres WebP ≤1600 px ±≤900 KB, dedup SHA-256),
disajikan `/gambar/[id]` hanya untuk user login. Gemini dipanggil via REST
(`fetch`, tanpa SDK), model dari env `GEMINI_MODEL` (default
`gemini-3-flash-preview` sejak 2026-09-30 — gemini-2.5-flash ditutup Google
untuk pengguna baru), key milik admin sendiri dari `/pengaturan`.
Alasan: pilihan user (gambar di DB: aman dari redeploy Hostinger, ikut
backup, tanpa akun storage tambahan); REST cukup untuk 1 endpoint & tidak
menambah dependensi.
Alternatif yang ditolak: simpan file di disk hosting (hilang saat
redeploy); cloud storage (butuh akun & key tambahan); key Gemini di env
server (bertentangan dengan SRS — key per user).

## 2026-09-30 — Latihan Kelemahan bank-only: aturan sesi & pemilihan soal
Keputusan: pemilihan soal = soal bank tayang di subdomain target, belum
pernah dikerjakan dulu (acak) lalu yang paling lama; bergiliran antar
subdomain; grup stimulus utuh (boleh membawa soal subdomain lain, tidak
dipotong). Satu sesi aktif per siswa. Jawaban dinilai per soal & terkunci
setelah diperiksa. Hasil latihan ikut diagnosa (satu record per sesi per
subdomain), tidak ikut skor tes resmi. Tanpa prioritas (soal per
subdomain < 3) → pilihan awal = subdomain berakurasi terendah yang ada
soalnya.
Alasan: sesuai rancangan AI_GENERATION.md §5; kunci terkunci mencegah
"coba-coba" jawaban yang membuat diagnosa palsu.
Alternatif yang ditolak: boleh ganti jawaban setelah melihat kunci;
banyak sesi paralel (membingungkan & membebani diagnosa).

## 2026-09-30 — Hasil demo dinilai di server via cookie; stimulus di atas soal
Keputusan: `/tes/demo` (10 soal, 5 subdomain asli SMP) mengirim semua
jawaban saat dikumpulkan → divalidasi Zod → disimpan di cookie httpOnly
(`path=/tes/demo`, 1 hari) → `/tes/demo/hasil` menilai ulang di server
(kunci di `src/server/demo/demo-test.ts`) dan menampilkan skor, radar per
subdomain, rencana belajar, pembahasan, dan ajakan daftar. Panel stimulus
soal grup dipindah ke atas soal di semua ukuran layar (permintaan user).
Alasan: demo adalah alat pemasaran — pengunjung harus merasakan analisis
kelemahan; tanpa DB & tanpa akun, cookie cukup dan kunci tetap di server.
Alternatif yang ditolak: simpan attempt demo di DB (butuh user/cleanup);
kirim kunci ke client & nilai di browser (bocor kunci, skor bisa diubah).

## 2026-09-29 — Edit/hapus soal yang sudah dipakai dikunci sebagian
Keputusan: soal yang **sudah dijawab siswa** hanya boleh diubah teks,
opsi (teksnya), pembahasan, kesulitan, level — bentuk, jumlah opsi, kunci,
pasangan kategori, subdomain, stimulus dikunci; opsi di-update di tempat
(id tetap). Soal yang **hanya masuk paket** dikunci stimulus & urutan
grupnya. Hapus hanya bila belum di paket & belum dijawab (selain itu:
jadikan draft). Aturan di `question-edit-rules.ts`, dicek ulang di server.
Alasan: hasil & pembahasan dihitung ulang dari jawaban tersimpan
(`attempt_answers.response` berisi id opsi) — ganti kunci/opsi diam-diam
membuat hasil lama berubah atau rusak, tidak cocok dengan
`attempt_subtopic_scores` yang sudah tersimpan.
Alternatif yang ditolak: versioning soal (terlalu berat untuk sekarang);
bebas edit (merusak riwayat siswa).

## 2026-09-29 — Build produksi pakai webpack, bukan Turbopack
Keputusan: script `build` = `next build --webpack`; `engines.node >=20.9.0` (Next 16).
Alasan: deploy Hostinger gagal — proses anak PostCSS Turbopack mati tanpa
pesan (exit 0) saat memproses `globals.css`, kemungkinan karena batas
memori/proses di build Hostinger. Webpack menjalankan PostCSS di proses
yang sama; build lokal & CSS Tailwind hasilnya utuh. Konfigurasi Tailwind v4
(`@tailwindcss/postcss`, `@import "tailwindcss"`) sudah benar, tidak diubah.
Alternatif yang ditolak: downgrade Tailwind ke v3 (tidak menyentuh akar
masalah). `next dev` tetap Turbopack.

## 2026-09-29 — Latihan adaptif: bank dulu, soal AI tanpa review, key siswa
Keputusan: fitur "Latihan Kelemahan" per siswa (Fase 2.5,
`docs/AI_GENERATION.md`) mengambil soal subdomain lemah dari bank soal
tayang terlebih dahulu; hanya kalau stok kurang, AI membuat soal
tambahan. Soal AI untuk latihan pribadi langsung dipakai tanpa review
admin — divalidasi otomatis, berlabel "Latihan AI", disimpan terpisah
(`practice_questions`, bukan bank), tidak dihitung ke skor tes resmi, dan
bisa dilaporkan siswa. Generate memakai API key Gemini **milik siswa**;
tanpa key, latihan tetap jalan dari bank saja.
Alasan: bank yang sudah direview menjaga kualitas & menghemat kuota;
latihan tidak boleh tertahan menunggu admin; tetap konsisten dengan SRS
(tidak ada key Gemini di server). Pengecualian review hanya untuk latihan
pribadi — soal AI untuk bank resmi & tes tetap wajib review.
Alternatif yang ditolak: selalu generate AI baru (boros kuota, tanpa
review); wajib review admin untuk latihan (siswa menunggu lama); key
admin/sekolah (biaya ditanggung pengelola, bertentangan dengan SRS).
Risiko yang diterima: sebagian besar siswa SD/SMP mungkin tanpa key →
fitur harus tetap berguna bank-only; tinjau ulang opsi key admin
berkuota bila data pemakaian menunjukkan perlu.

## 2026-09-29 — Entitlement per paket, bukan toggle per user
Keputusan: akses premium diatur dari halaman edit paket
(`/admin/paket-tes/[id]`, panel "Akses Premium" — cari user, beri/cabut
akses satu per satu), bukan toggle global "premium: ya/tidak" di halaman
Manajemen User. Manajemen User hanya menampilkan ringkasan ("N paket")
per user, tautan ke halaman paket untuk mengelolanya.
Alasan: skema `entitlements` adalah relasi user↔paket (banyak-ke-banyak);
satu switch boolean per user di tabel Users tidak bisa merepresentasikan
"punya akses ke paket A tapi tidak ke paket B". Mengelola dari sisi paket
juga lebih alami: admin biasanya berpikir "siapa yang boleh mengerjakan
paket premium ini", bukan "paket premium mana yang boleh dikerjakan user
ini".
Alternatif yang ditolak: toggle boolean per user yang menyalakan/mematikan
akses ke *semua* paket premium sekaligus — terlalu kasar begitu ada lebih
dari satu paket premium dengan target berbeda (mis. premium SMP vs SMA).

## 2026-09-29 — correct/wrong/blank dihitung ulang, bukan disimpan
Keputusan: halaman hasil (`getAttemptResult`) tidak menyimpan kolom
`correct_count`/`wrong_count`/`blank_count` di tabel `attempts`. Ketiganya
dihitung ulang saat halaman dibuka, dari `attempt_answers` + `scoreAttempt()`
— fungsi murni yang sama dipakai saat finalize. Yang disimpan permanen
hanya `total_score`, `max_score`, dan ringkasan per subtopik
(`attempt_subtopic_scores`, yang punya `correct_count`/`total_count` tapi
tidak membedakan salah vs kosong).
Alasan: satu sumber kebenaran untuk logika skor — kalau `scoreAttempt()`
berubah (mis. aturan skor baru), hasil lama otomatis konsisten tanpa
migrasi data, karena tidak ada angka correct/wrong/blank yang "membeku"
di tabel. Biayanya murah (re-join beberapa baris, bukan agregasi berat).
Alternatif yang ditolak: menambah kolom count ke `attempts` saat finalize
— lebih cepat baca, tapi bisa basi kalau logika skor berubah, dan
menduplikasi data yang sudah bisa diturunkan dari `attempt_answers`.

## 2026-09-29 — Role admin tetap hanya lewat CLI, bukan tombol di UI
Keputusan: halaman Manajemen User (dibangun ulang untuk memakai data DB
sungguhan) tidak diberi kontrol ubah role di UI. Role tetap dilihat
sebagai badge saja; satu-satunya cara menjadikan seseorang admin tetap
`npm run user:role -- <email> admin` (keputusan 2026-09-25, dipertahankan).
Alasan: konsisten dengan keputusan sebelumnya — menjadikan admin adalah
tindakan sensitif yang sebaiknya butuh akses terminal/server, bukan satu
klik dari sesama admin di browser.

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
