# Alur Kerja — Git, VS Code, Deploy Hostinger

## 1. Setup awal (sekali saja)

1. Ekstrak folder proyek ini, buka dengan VS Code (`code .`).
2. Install ekstensi yang disarankan (VS Code akan menawarkan otomatis dari
   `.vscode/extensions.json`).
3. Buka terminal di VS Code, jalankan Claude Code (`claude`) di root
   folder ini — dia akan membaca `CLAUDE.md` otomatis.
4. Minta Claude Code melakukan scaffold Fase 0 di `docs/ROADMAP.md`.
5. Setelah proyek Next.js ter-scaffold, `git init`, buat repo baru di
   GitHub, lalu:
   ```bash
   git remote add origin <url-repo-github-anda>
   git add .
   git commit -m "chore: setup awal proyek"
   git branch -M main
   git push -u origin main
   ```

## 2. Branch

- `main` — selalu bisa di-deploy, ini yang tersambung ke Hostinger.
- `dev` — tempat kerja harian. Selesai satu fitur → merge/PR ke `main`.

Untuk solo development, boleh langsung commit ke `main` di tahap awal
supaya sederhana, lalu mulai pakai `dev` setelah web sudah live dan
dipakai user asli (supaya tidak ada bug yang langsung tayang).

## 3. Hubungkan ke Hostinger

1. Beli domain `.com` dan aktifkan hosting Node.js di panel Hostinger.
2. Di panel Hostinger, cari menu **Git** pada layanan hosting Anda →
   hubungkan ke repo GitHub ini, pilih branch `main` sebagai sumber
   deploy otomatis.
3. Set environment variables di panel Hostinger (jangan commit `.env`):
   - `DATABASE_URL`
   - `ENCRYPTION_SECRET` (untuk enkripsi Gemini API key milik user —
     **ini bukan API key Gemini**, ini kunci enkripsi buatan Anda sendiri,
     generate sekali dengan `openssl rand -hex 32`)
   - `AUTH_SECRET` (untuk Better Auth, generate serupa)
4. Set Node.js version di panel Hostinger sesuai `.nvmrc` (22.x).
5. Set build command `npm run build`, start command sesuai output adapter
   Next.js untuk Hostinger (cek dokumentasi Hostinger untuk Next.js —
   biasanya `npm start` setelah build).
6. Setiap `git push` ke `main` akan auto-deploy.

## 4. Development harian dengan Claude Code

- Mulai sesi: cukup ketik task-nya, Claude Code akan baca `CLAUDE.md` lalu
  membuka dokumen relevan sendiri (lihat peta dokumen di `CLAUDE.md`).
- Untuk task besar (fitur baru), minta Claude Code buat rencana dulu
  (`Plan` mode kalau tersedia) sebelum eksekusi, supaya scope jelas dan
  tidak boros token karena bolak-balik.
- Setelah fitur selesai: jalankan `npm run lint` dan `npm run build`
  secara lokal dulu sebelum commit, supaya deploy ke Hostinger tidak
  gagal di tengah jalan.
- Update centang di `docs/ROADMAP.md` setiap fitur selesai.

## 5. Testing manual sebelum "go live" ke publik

- Coba alur penuh: register → login → admin buat topik/subtopik/soal →
  admin susun paket tes → student kerjakan tes sampai submit → cek hasil
  & grafik subtopik akurat.
- Coba refresh browser di tengah pengerjaan tes → pastikan timer & jawaban
  tidak hilang.
- Coba 2 akun berbeda mengerjakan tes yang sama bersamaan.
- Cek bahwa kunci jawaban tidak muncul di Network tab browser selama tes
  berlangsung (buka DevTools → cek response API soal).

## 6. Database dev (lokal) vs produksi

Sejak 2026-10-07 dev server TIDAK lagi memakai database produksi.
- `.env` → `DATABASE_URL` ke MariaDB lokal `pakartka_dev` (127.0.0.1). Semua
  `npm run dev`, `db:migrate`, `db:seed:asesmen`, `user:*` mengenai database lokal.
- `.env.prod` → salinan env produksi (DATABASE_URL Hostinger, chmod 600, ikut
  `.gitignore`). Hanya dipakai skrip `prod:*` dan sebagai sumber `db:dev:sync`.
- Dev server menampilkan peringatan bila `DATABASE_URL` mengarah ke host non-lokal.

Setup sekali (macOS): `brew install mariadb && brew services start mariadb`, lalu
`mysql -e "CREATE DATABASE pakartka_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'pakartka'@'localhost' IDENTIFIED BY '<acak>'; GRANT ALL ON pakartka_dev.* TO 'pakartka'@'localhost';"`
→ isi `.env` → `npm run db:migrate` → `npm run db:dev:sync`.

`npm run db:dev:sync` — salin KONTEN produksi ke lokal (baca saja di produksi;
data lokal dihapus dulu): kerangka asesmen, bacaan, soal, opsi, pembahasan, gambar,
paket, paket langganan, pengaturan. Tidak disalin: akun/sesi, percobaan & jawaban,
latihan, order/membership, API key Gemini, laporan soal, log AI. Pembuat konten
diganti akun anonim `admin<id>@dev.local`; akun `admin@dev.local` dibuat dengan kata
sandi acak yang tampil sekali di terminal (jalankan ulang sinkron untuk sandi baru).
API key Gemini produksi tidak bisa dipakai di lokal (terenkripsi dengan
`ENCRYPTION_SECRET` produksi) — simpan key sendiri di Profil akun dev bila perlu.

Perintah ke PRODUKSI (eksplisit, membaca `.env.prod`): `npm run prod:db:check`,
`npm run prod:migrate`, `npm run prod:seed:asesmen`,
`npm run prod:user:password -- <email> [--acak]`, `npm run prod:user:role -- ...`.

## 7. Menjalankan migrasi ke MySQL Hostinger

### Langkah cepat (database baru)
1. hPanel → **Databases → MySQL Databases** → buat database + user +
   password (catat nama lengkapnya, biasanya berawalan `u123456789_`).
   phpMyAdmin hanya untuk *melihat* data — jangan buat/ubah tabel di sana.
2. hPanel → **Databases → Remote MySQL** → tambahkan IP publik komputer
   Anda (atau `%` sementara saat development, hapus lagi setelahnya).
   Catat **hostname MySQL** yang ditampilkan (bukan domain website).
3. Isi `.env.prod` (bukan `.env` — itu database lokal, lihat §6):
   `DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/NAMA_DB"` —
   karakter khusus di password wajib di-encode (`@`→`%40`, `#`→`%23`,
   `/`→`%2F`, `:`→`%3A`).
4. `npm run prod:db:check` — tes koneksi (read-only), tampilkan versi server,
   tabel, dan jumlah migrasi yang sudah jalan. Error diberi petunjuk.
5. `npm run prod:migrate` — buat semua tabel (migrasi 0000–dst).
6. `npm run prod:seed:asesmen` — isi jenjang, mata uji, domain, subdomain
   dari `asesmen/*.json`.
7. `npm run prod:db:check` lagi — pastikan tabel & migrasi tercatat.
   **Jumlah migrasi harus = jumlah file `.sql`.** Kalau kurang padahal
   tabel baru sudah ada, migrasi gagal di tengah (DDL MariaDB tidak bisa
   di-rollback): cari statement yang belum jalan, jalankan manual, lalu
   catat `sha256(isi file)` + `when` dari `meta/_journal.json` ke
   `__drizzle_migrations` (contoh: migrasi 0012, DECISIONS 2026-09-30).
   Nama constraint/FK maks 64 karakter.

Saat aplikasi nanti jalan di Node.js hosting Hostinger, `DATABASE_URL`
di environment hosting memakai host yang ditunjukkan hPanel untuk
koneksi dari server yang sama (bukan host remote).

Ada dua cara, pilih salah satu dan **konsisten pakai itu terus**:

**A. `npm run prod:migrate` (disarankan, kalau bisa)**
- Aktifkan **Remote MySQL** di hPanel Hostinger (Databases → Remote MySQL),
  whitelist IP Anda, lalu jalankan `npm run prod:migrate` dari komputer Anda
  (memakai `DATABASE_URL` di `.env.prod`).
- Kelebihan: Drizzle otomatis mencatat migrasi mana yang sudah jalan di
  tabel `__drizzle_migrations`, jadi migrasi berikutnya tidak bentrok.

**B. Copy-paste manual ke phpMyAdmin (kalau Remote MySQL tidak tersedia)**
- File di `src/server/db/migrations/000x_*.sql` mengandung penanda
  `--> statement-breakpoint` di antara statement — ini bukan SQL valid,
  cuma dipakai oleh `drizzle-kit migrate` untuk memecah file jadi
  beberapa statement. Kalau dipaste apa adanya ke phpMyAdmin, akan error
  `#1064 ... near '--> statement-breakpoint'`.
- Hapus dulu semua baris `--> statement-breakpoint` sebelum paste ke tab
  SQL phpMyAdmin, misalnya:
  ```bash
  sed 's/-->[[:space:]]*statement-breakpoint//g' src/server/db/migrations/0000_xxx.sql
  ```
- **Penting**: karena dijalankan manual, tabel `__drizzle_migrations`
  tidak otomatis terisi. Kalau nanti `npm run prod:migrate` dijalankan ke
  database yang sama, dia akan mencoba `CREATE TABLE` yang sudah ada lagi
  dan gagal. Kalau sudah mulai pakai cara manual, tetap pakai cara manual
  untuk migrasi selanjutnya juga (generate SQL-nya, bersihkan penanda,
  paste ke phpMyAdmin).

## 8. Pembayaran DOKU Checkout — QRIS (Premium)

1. Daftar/masuk DOKU Back Office **Sandbox** (https://sandbox.doku.com/bo) →
   Integration → API Keys → salin **Client ID** dan **Secret Key**.
   Jangan kirim keduanya lewat chat/email — langsung isi ke env.
2. hPanel → env: `DOKU_CLIENT_ID=<client id>`, `DOKU_SECRET_KEY=<secret key>`,
   `DOKU_IS_PRODUCTION=false`, pastikan `SITE_URL=https://<domain>`.
   Hapus env lama `MIDTRANS_*` bila ada. Redeploy, lalu `npm run prod:migrate`
   (migrasi 0017 menghapus kolom `orders.snap_token`) — jalankan SETELAH kode
   baru ter-deploy.
3. Back Office → Settings → Payment Settings → **Notification URL**:
   `https://<domain>/api/doku/notification` (halaman kembali dikirim otomatis
   per transaksi lewat `callback_url`). Pastikan metode **QRIS** aktif di akun.
   Kolom **URL Halaman Sukses** (bila diminta): `https://<domain>/langganan/selesai`
   — tanpa nomor invoice halaman itu menampilkan transaksi terbaru siswa.
   Error **"PAYMENT CHANNEL IS INACTIVE"** = QRIS belum aktif di akun DOKU itu
   (Production butuh aktivasi/persetujuan DOKU). Sementara bisa uji dengan
   channel lain yang aktif: env `DOKU_PAYMENT_METHODS=ALL` (atau daftar kode
   dipisah koma), restart; kembalikan ke `QRIS` setelah QRIS aktif.
4. Admin → `/admin/langganan` → buat paket langganan (harga, durasi,
   jenjang). Tandai paket tes gratis (`is_premium = false`) di Paket Tes.
5. Uji: akun siswa → Premium → Bayar → halaman DOKU menampilkan QRIS →
   bayar dengan simulator Sandbox DOKU → kembali ke `/langganan/selesai` →
   Premium aktif (halaman ini juga mengecek status ke DOKU bila notifikasi telat).
6. Go-live: ganti ke Client ID & Secret Key **Production**,
   `DOKU_IS_PRODUCTION=true`, ulangi langkah 3 di Back Office Production.

## 8b. Halaman legal (/privasi, /syarat)

Kebijakan Privasi & Syarat & Ketentuan sudah tersedia (tautan di footer & form
daftar). Isi env `CONTACT_EMAIL=<email kontak resmi>` di hPanel agar email itu
tampil sebagai kanal permintaan data/kendala pembayaran; tanpa env, halaman
menulis "kanal kontak resmi yang tercantum di situs ini". Pakai URL
`https://<domain>/privasi` & `/syarat` di Google OAuth consent screen (Branding)
dan formulir merchant DOKU. Perbarui tanggal "Berlaku sejak" bila isinya diubah.

## 9. Login & daftar dengan Google

1. https://console.cloud.google.com → buat/pilih project.
2. **APIs & Services → OAuth consent screen**: User type *External*, isi nama
   aplikasi, email dukungan, logo (opsional), domain; scope cukup default
   (email, profile, openid). Setelah siap, klik **Publish app** (mode
   *Testing* hanya bisa dipakai akun yang didaftarkan sebagai test user).
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**
   → *Web application*:
   - Authorized JavaScript origins: `https://<domain>`
   - Authorized redirect URIs: `https://<domain>/api/auth/callback/google`
     (harus sama persis dengan `BETTER_AUTH_URL` + path itu).
4. hPanel → env: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` → redeploy.
   Tombol "Masuk/Daftar dengan Google" muncul otomatis.
5. Perilaku: akun baru dari Google diminta memilih jenjang
   (`/pilih-jenjang`); bila konfirmasi pendaftar aktif, statusnya Menunggu.
   Email yang sudah terdaftar dengan kata sandi otomatis tersambung ke Google.

## 10. Lupa kata sandi lewat email (SMTP Hostinger)

Sudah ada di kode (2026-10-07): tautan "Lupa kata sandi?" di /masuk →
`/lupa-kata-sandi` (isi email) → email berisi tautan (berlaku 1 jam, sekali
pakai) → `/atur-ulang-kata-sandi` (kata sandi baru) → semua sesi lama dikeluarkan →
masuk lagi. Aktif otomatis begitu `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` terisi;
kalau kosong, halaman itu menyuruh menghubungi admin. Respons sama untuk email
terdaftar/tidak (tidak membocorkan siapa yang punya akun); dibatasi 3 permintaan /
15 menit per IP. Kode: `services/mailer.ts`, `sendResetPassword` di `server/auth`.

1. **Buat akun email** — hPanel → **Emails** → domain → **Email Accounts →
   Create email account**, mis. `noreply@<domain>` + kata sandi kuat. (Paket web
   Hostinger biasanya termasuk email gratis; kalau menu kosong, aktifkan dulu.)
2. **DNS anti-spam** — Emails → domain → **DNS / Connect domain**: MX, SPF
   (`v=spf1 include:_spf.mail.hostinger.com ~all`), DKIM, DMARC harus hijau.
   Nameserver Hostinger → klik **Auto-configure**; DNS di luar (Cloudflare) →
   salin record yang ditampilkan. Tunggu propagasi (bisa beberapa jam).
3. **Data SMTP** (Emails → **Connect apps & devices**): host `smtp.hostinger.com`,
   port `465` (SSL; alternatif `587`), username = alamat email lengkap, password
   = kata sandi akun email (BUKAN kata sandi hPanel).
4. **Isi env produksi** — hPanel → Websites → Node.js app → **Environment
   variables** (jangan kirim kata sandinya lewat chat):
   ```
   SMTP_HOST=smtp.hostinger.com
   SMTP_PORT=465
   SMTP_USER=noreply@<domain>
   SMTP_PASS=<kata sandi email>
   EMAIL_FROM=Pakar TKA <noreply@<domain>>
   ```
   Pastikan `BETTER_AUTH_URL=https://<domain>` (tautan di email memakai alamat
   ini — kalau masih `localhost`, tautan tidak bisa dibuka siswa). Simpan →
   **Redeploy/Restart** aplikasi (env baru dibaca saat start).
5. **Tes SMTP dari laptop (opsional)** — tambahkan 5 baris yang sama ke `.env.prod`,
   lalu `npm run prod:mail:test -- <gmail-anda>` → harus tampil "Login SMTP berhasil"
   dan email uji sampai di Gmail (cek Spam). Error 535/Invalid login → cek
   SMTP_USER (email lengkap) & SMTP_PASS. Timeout → coba `SMTP_PORT=587`.
6. **Tes di produksi** — buka `https://<domain>/masuk` → **Lupa kata sandi?** →
   isi email akun uji → buka email → klik **Atur ulang kata sandi** → isi sandi
   baru → masuk dengan sandi baru. Klik tautan yang sama lagi → harus "Tautan
   tidak berlaku".
7. **Kalau email tidak datang**: cek folder Spam; hPanel → Node.js app → log
   (`[mail] gagal kirim email reset kata sandi: …`); kuota kirim harian email
   hosting (cukup untuk reset; email massal pakai Resend/Brevo).

Lokal: tanpa SMTP di `.env` fitur ini nonaktif (normal). Akun Google-only juga bisa
memakai reset ini untuk membuat kata sandi.

## 11. Load test pengerjaan tes

`npm run loadtest -- --students=150 --package=<id paket tayang>` — simulasi N
siswa mengerjakan satu paket bersamaan dengan urutan query yang sama dengan
aplikasi (buka ujian → autosave tiap jawaban → submit + `finalizeAttempt`
asli), satu pool `db` (10 koneksi) = satu instance app. Akun uji
`loadtest+…@example.invalid` dibuat sementara dan selalu dihapus (Ctrl+C juga
membersihkan; sisa run terputus: `npm run loadtest -- --cleanup`).

- Opsi: `--answers` (default semua soal), `--think` jeda antar-jawaban ms
  (default 1500 ±50% = skenario stres ±50× siswa nyata), `--ramp` jeda mulai
  antar-siswa (default 50 ms).
- Membaca hasil: dari laptop setiap query ±40 ms (jaringan ke DB Hostinger);
  di produksi app & DB berdekatan, jadi angka absolut jauh lebih kecil. Yang
  dicari: **error** (mis. `ER_TOO_MANY_USER_CONNECTIONS`, batas
  `max_user_connections` = 75) dan **antrean pool** yang terus naik.
- Hasil 2026-10-03 (paket #13, 30 soal, setelah optimasi):

  | Siswa | Autosave/dtk | Antrean pool | Buka ujian p95 | Autosave p95 | Submit p95 | Error |
  |---|---|---|---|---|---|---|
  | 50 | 25 | 8 | 1,0 dtk | 0,3 dtk | 0,6 dtk | 0 |
  | 150 | 55 | 86 | 1,2 dtk | 1,4 dtk | 2,3 dtk | 0 |

- Perkiraan kapasitas: siswa nyata ±1 autosave / 1–2,5 menit, jadi 55/dtk
  (bahkan dengan latensi laptop) ≈ ribuan siswa bersamaan per instance. Yang
  belum diukur: CPU/memori Node di Hostinger saat render halaman — uji HTTP
  ke domain produksi (k6/autocannon) di jam sepi bila perlu.

## 12. Lupa kata sandi admin

`npm run prod:user:password -- <email>` (produksi; `user:password` = database
lokal) — mengatur kata sandi baru dari terminal
(diketik tersembunyi, minimal 8 karakter, diketik dua kali). Kata sandi di-hash
seperti daftar biasa; semua sesi lama user itu dihapus. Kata sandi lama tidak bisa
dilihat oleh siapa pun (hanya hash yang tersimpan).

Paling aman bila kata sandi ketikan tetap ditolak saat login:
`npm run prod:user:password -- <email> --acak` — sistem membuat kata sandi sementara
(mis. `KTRmnpa-4827`) dan menampilkannya SEKALI di terminal; masuk dengan itu,
lalu ganti di Profil → Ganti kata sandi.

