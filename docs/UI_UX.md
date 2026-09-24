# UI/UX Reference — Web Tes Premium

Dokumen ini adalah **sumber kebenaran desain** untuk implementasi UI di
kode (Tailwind + shadcn/ui). Dasarnya adalah brief desain yang dipakai
untuk generate mockup di Google Stitch, supaya hasil kode dan hasil
Stitch tetap selaras.

> **Kalau ada perbedaan** antara dokumen ini dan hasil Stitch yang sudah
> jadi (warna persis, jarak, komponen tambahan, dsb): sesuaikan dokumen
> ini dulu berdasarkan screenshot Stitch, baru minta Claude Code
> implementasi. Jangan biarkan kode dan dokumen ini berbeda — salah satu
> harus jadi acuan tunggal.

Claude Code sebaiknya membaca file ini **sebelum** membuat komponen UI
baru, sama seperti membaca `ARCHITECTURE.md` sebelum membuat modul baru.

---

## 1. Prinsip desain

- **Terpercaya & fokus** — ini platform latihan TKA untuk siswa SD/SMP/SMA,
  bukan produk konsumer yang ramai. Hindari elemen dekoratif berlebihan, terutama di
  halaman pengerjaan tes.
- **Mobile-first** — mayoritas user Indonesia akses lewat browser HP.
  Semua layout didesain dari lebar mobile dulu, baru melebar ke desktop.
- **Jelas sebelum indah** — status (benar/salah, terkunci/premium,
  waktu tersisa) harus langsung terbaca tanpa mikir.
- **Konsisten lintas role** — siswa dan admin pakai bahasa visual yang
  sama (warna, tipografi, komponen), hanya struktur navigasi yang beda.

## 2. Design tokens

### 2.1 Warna

| Token | Hex | Pemakaian |
|---|---|---|
| `primary` | `#1E3A8A` (deep blue) | Warna utama brand, navbar, judul penting, elemen fokus |
| `primary-hover` | `#1E40AF` | Hover state tombol primary |
| `primary-soft` | `#EFF6FF` | Latar opsi terpilih, menu aktif, timer normal, ikon stat card |
| `accent` → kode: `cta` | `#F59E0B` (amber) | CTA utama ("Daftar Gratis", "Mulai Tes"), highlight premium |
| `accent-hover` → kode: `cta-hover` | `#D97706` | Hover state tombol CTA |
| `cta-foreground` | `#0F172A` | Teks di atas amber (putih di atas amber gagal kontras) |
| `success` / `success-soft` | `#16A34A` / `#ECFDF5` | Jawaban benar, progres positif, badge "Tayang"/"Premium" |
| `danger` → kode: `destructive` / `destructive-soft` | `#DC2626` / `#FEF2F2` | Jawaban salah, timer kritis (<5 menit), subtopik terlemah |
| `warning` / `warning-soft` / `warning-strong` | `#F59E0B` / `#FEF3C7` / `#B45309` | Status "ragu-ragu", "menunggu review" (teks pakai `warning-strong`) |
| `neutral-bg` | `#F8FAFC` | Background halaman |
| `neutral-surface` | `#FFFFFF` | Background card/panel |
| `neutral-border` | `#E2E8F0` | Border card, divider |
| `neutral-text` | `#0F172A` | Teks utama |
| `neutral-text-muted` | `#64748B` | Teks sekunder, caption |

> Implementasi: semua token ada di `src/app/globals.css` (`:root` +
> `@theme inline`), dipakai sebagai kelas Tailwind (`bg-primary`,
> `bg-cta`, `text-warning-strong`, dst). Jangan hardcode hex di komponen.
> Nama `accent` di tabel ini dipetakan ke `cta` di kode karena shadcn/ui
> sudah memakai `accent` untuk latar hover. Aplikasi light-only.

### 2.2 Tipografi

- Font: **Plus Jakarta Sans** (sesuai design system Stitch), dimuat lewat
  `next/font` di `src/app/layout.tsx`. Satu font untuk semua teks, termasuk
  angka besar.
- Skala:
  | Level | Ukuran | Pemakaian |
  |---|---|---|
  | `display` | 36–48px, bold | Hero landing page |
  | `h1` | 28–32px, bold | Judul halaman |
  | `h2` | 20–24px, semibold | Judul section/card |
  | `body` | 16px, regular | Teks umum, termasuk teks soal |
  | `body-sm` | 14px, regular | Caption, label form |
  | `mono/number` | 16–20px, tabular-nums | Timer, skor angka |

- Teks soal ujian harus **cukup besar dan nyaman dibaca lama** (jangan
  di bawah 16px), karena peserta membaca banyak soal berturut-turut.

### 2.3 Spacing, radius, shadow

- Spacing scale: kelipatan 4px (Tailwind default: `1`=4px, `2`=8px, dst).
- Radius: `16px` (`rounded-2xl`) untuk card/panel/dialog, `12px` untuk
  kartu opsi jawaban, `8px` untuk tombol/input/kotak navigasi soal,
  `9999px` (full) untuk badge/pill. (Diubah dari 12px → 16px mengikuti
  hasil Stitch.)
- Tinggi kontrol: tombol & input default 40px, tombol `lg` 44px, kotak
  navigasi soal 44×44px (target sentuh minimum).
- Shadow: soft shadow saja (`shadow-sm`/`shadow-md` Tailwind), hindari
  shadow tebal/gelap.
- Container max-width halaman konten: `~1200px`, dengan padding
  horizontal minimal `16px` di mobile.

## 3. Komponen dasar

| Komponen | Aturan |
|---|---|
| **Tombol primary** | `<Button>` — background `primary`, teks putih, radius 8px, dipakai untuk aksi utama non-CTA marketing (mis. "Simpan", "Masuk") |
| **Tombol accent/CTA** | `<Button variant="cta">` — background amber, teks gelap `#0F172A`, khusus ajakan konversi ("Daftar Gratis", "Latih subtopik ini", "Kumpulkan") |
| **Tombol secondary** | Outline/border `neutral-border`, teks `neutral-text` |
| **Badge status** | `<Badge variant="success\|warning\|danger\|muted\|info">` — pill, latar lembut + teks tegas: hijau=published/benar, amber=pending/ragu-ragu, merah=salah/terkunci, abu=draft |
| **Card** | Kelas `surface-card` atau `<Card>` — background putih, border tipis, radius 16px, soft shadow, padding 20–32px |
| **Opsi jawaban** | Resting: border tipis + badge huruf bulat abu. Terpilih: border 2px `primary`, latar `primary-soft`, badge huruf solid biru |
| **Kategori skor** | `scoreTone()` di `src/lib/format.ts`: ≥75% Baik (hijau), 50–74% Cukup (amber), <50% Perlu latihan (merah) |
| **Input/Form** | Border `neutral-border`, radius 8px, focus ring warna `primary` |
| **Tabel (admin)** | Header sticky, baris zebra tipis opsional, aksi di kolom kanan (ikon edit/toggle), hover row highlight ringan |
| **Navigasi soal (grid angka)** | Kotak 44px, radius 8px: terjawab=solid biru, ragu-ragu=solid amber + ikon bendera (teks gelap), belum=outline abu, soal aktif=ring biru 2px |
| **Chart** | Ikuti palet warna di atas untuk series; radar chart untuk subtopik, bar chart untuk perbandingan, line chart untuk tren waktu |

## 4. Layout per halaman

Ringkasan struktur tiap halaman (detail lengkap ada di prompt Stitch
yang sudah dipakai — file ini fokus ke aturan visual & konsistensi).

### 4.1 Landing page (publik)
Navbar putih → Hero (headline + CTA ganda + ilustrasi kartu hasil) →
bar keunggulan singkat → 4 kartu fitur → 3 kartu jenjang (SD/SMP/SMA) →
perbandingan Gratis vs Premium → cara kerja 3 langkah → CTA akhir →
footer.

**Aturan konten:** hanya klaim faktual. Jangan tampilkan jumlah pengguna,
tingkat kelulusan, testimoni, atau harga sebelum datanya nyata (versi
Stitch memuat angka & testimoni contoh — sengaja tidak dipakai). Bagian
testimoni boleh ditambahkan kembali setelah ada testimoni asli.

### 4.2 Login / Register
Card terpusat di atas background lembut, logo di atas card, form
minimalis, satu CTA utama per halaman.

### 4.3 Admin — Dashboard
Sidebar kiri tetap (ikon + label) + topbar. Konten: 4 stat card di
baris atas, 1 chart aktivitas, 1 tabel aktivitas terbaru.

### 4.4 Admin — Manajemen User
Tabel dengan search + filter role di atas, kolom Nama/Email/Role/
Status/Tanggal/Aksi, toggle akses premium per baris (manual, karena
belum ada payment gateway).

### 4.5 Admin — Bank Soal
Tree Topik→Subtopik di kiri, daftar soal di kanan dengan badge
difficulty/status/source, filter bar di atas, form tambah soal via
modal.

### 4.6 Admin — Import Soal
Drag-and-drop upload zone, link unduh template, tabel preview hasil
parsing dengan status valid/error per baris, tombol konfirmasi di akhir.

### 4.7 Student — Dashboard
Topbar (bukan sidebar — menu lebih sedikit). Kartu "subtopik terlemah"
menonjol di atas, grid kartu paket tes (badge kategori, lock icon untuk
premium terkunci), riwayat terakhir di bawah.

### 4.8 Student — Pengerjaan tes
Layout minim distraksi. Topbar: judul tes + timer besar (berubah merah
<5 menit) + tombol submit. Area utama: 1 soal per layar. Sidebar/grid
navigasi soal dengan kode warna status.

### 4.9 Student — Hasil & Analisis
Skor besar (0–100) di atas dengan badge kategori skor + stat
benar/salah/kosong/durasi. Radar chart per subtopik dengan subtopik
terlemah ditandai merah + ikon ⚠ (bukan warna saja), kartu "Prioritas
latihan #1" dan "Kekuatan tertinggi". Rincian per subtopik (bar + angka,
sekaligus jadi table view chart). Tren skor + riwayat percobaan di bawah.

## 5. Aturan responsif

- Breakpoint utama: mobile (<640px), tablet (640–1024px), desktop
  (>1024px) — ikuti default Tailwind (`sm`, `md`, `lg`).
- Sidebar admin → jadi bottom sheet/hamburger di mobile.
- Grid navigasi soal → tetap terlihat tapi collapsible/drawer di mobile
  supaya tidak menutupi soal.
- Tabel admin (manajemen user, bank soal) → di mobile beralih ke
  tampilan card per baris, bukan scroll horizontal tabel penuh.

## 6. Aksesibilitas minimum

- Kontras teks vs background minimal rasio 4.5:1 (terutama teks di atas
  `accent`/amber — cek kontrasnya, amber terang butuh teks gelap).
- Semua elemen interaktif (tombol, opsi jawaban) harus punya focus
  state yang terlihat jelas (bukan cuma hilang outline browser).
- Timer & status kritis (waktu hampir habis) tidak boleh hanya
  mengandalkan warna — sertakan teks/ikon juga.

## 7. Cara pakai dokumen ini bersama Stitch

1. Screen baru didesain dulu di Stitch pakai prompt yang sudah ada.
2. Bandingkan hasil Stitch dengan token di §2 dan pola komponen di §3 —
   kalau Stitch menghasilkan warna/pola baru yang lebih bagus, **update
   dokumen ini dulu**, baru lanjut ke implementasi kode.
3. Saat minta Claude Code membangun halaman, referensikan file ini,
   contoh:
   `"Implementasikan halaman Dashboard Admin sesuai docs/UI_UX.md §4.3
   dan §2 (design tokens), mengikuti layout hasil Stitch yang saya
   lampirkan [screenshot]."`
4. Kalau ada screenshot Stitch yang mau dijadikan acuan presisi, lampirkan
   filenya ke Claude Code langsung — dia bisa membaca gambar untuk
   mencocokkan detail visual.

## 8. Peta layar Stitch → kode

Proyek Stitch acuan: **"Web Tes Premium Landing Page"**
(`projects/18299207747758193730`). Proyek Stitch lain di akun (CMS
sekolah, portfolio, administrasi guru, dsb.) bukan bagian produk ini.

| Layar Stitch | Route | File utama |
|---|---|---|
| Landing Page | `/` | `src/app/(public)/page.tsx` |
| Masuk | `/masuk` | `src/app/(auth)/masuk/page.tsx`, `components/auth/auth-form.tsx` |
| Daftar Akun Baru | `/daftar` | `src/app/(auth)/daftar/page.tsx` |
| Dashboard Siswa | `/dashboard` | `src/app/(student)/dashboard/page.tsx` |
| Pengerjaan Ujian | `/tes/demo` (nanti `/tes/[packageId]`) | `components/tes/exam-shell.tsx` |
| Hasil & Analisis | `/hasil/[attemptId]` | `src/app/(student)/hasil/[attemptId]/page.tsx` |
| Dashboard Admin | `/admin` | `src/app/(admin)/admin/page.tsx` |
| Manajemen User | `/admin/users` | `src/app/(admin)/admin/users/page.tsx` |
| Bank Soal | `/admin/soal` | `components/admin/question-bank.tsx` |
| Import Soal | `/admin/soal/import` | `components/admin/import-uploader.tsx` |

Layout: admin = `components/layout/admin-shell.tsx` (sidebar + drawer
mobile), siswa = `components/layout/student-header.tsx` (topbar),
pengerjaan tes = grup `(exam)` tanpa navigasi situs. Halaman yang belum
tersambung DB memakai `src/lib/demo-data.ts` + banner `DemoDataNotice`.
