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

## 6. Database di fase development

Sebelum domain & hosting aktif, Anda bisa develop dengan MySQL lokal
(XAMPP/Laragon) atau database dev gratis (PlanetScale/Railway/Aiven) lalu
pindahkan `DATABASE_URL` ke database MySQL Hostinger saat siap deploy.
Skema Drizzle sama persis, tinggal jalankan migrasi ke database baru.

## 7. Menjalankan migrasi ke MySQL Hostinger

Ada dua cara, pilih salah satu dan **konsisten pakai itu terus**:

**A. `npm run db:migrate` (disarankan, kalau bisa)**
- Aktifkan **Remote MySQL** di hPanel Hostinger (Databases → Remote MySQL),
  whitelist IP Anda, lalu arahkan `DATABASE_URL` lokal ke database
  Hostinger dan jalankan `npm run db:migrate` dari komputer Anda.
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
  tidak otomatis terisi. Kalau nanti `npm run db:migrate` dijalankan ke
  database yang sama, dia akan mencoba `CREATE TABLE` yang sudah ada lagi
  dan gagal. Kalau sudah mulai pakai cara manual, tetap pakai cara manual
  untuk migrasi selanjutnya juga (generate SQL-nya, bersihkan penanda,
  paste ke phpMyAdmin).
