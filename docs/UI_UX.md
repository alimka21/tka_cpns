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

- **Terpercaya & fokus** — ini platform tes akademik/CPNS, bukan produk
  konsumer yang ramai. Hindari elemen dekoratif berlebihan, terutama di
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
| `accent` | `#F59E0B` (amber) | CTA utama ("Daftar Gratis", "Mulai Tes"), highlight premium |
| `accent-hover` | `#D97706` | Hover state tombol accent |
| `success` | `#16A34A` | Jawaban benar, progres positif, badge "Aktif" |
| `danger` | `#DC2626` | Jawaban salah, timer kritis (<5 menit), peringatan |
| `warning` | `#F59E0B` (sama dgn accent) | Status "ragu-ragu", "pending review" |
| `neutral-bg` | `#F8FAFC` | Background halaman |
| `neutral-surface` | `#FFFFFF` | Background card/panel |
| `neutral-border` | `#E2E8F0` | Border card, divider |
| `neutral-text` | `#0F172A` | Teks utama |
| `neutral-text-muted` | `#64748B` | Teks sekunder, caption |

> Implementasi: definisikan sebagai CSS variable / Tailwind theme di
> `tailwind.config` atau `globals.css` (Tailwind v4 pakai `@theme`),
> jangan hardcode hex di tiap komponen.

### 2.2 Tipografi

- Font: sans-serif bawaan sistem atau satu Google Font netral (mis.
  **Inter** atau **Plus Jakarta Sans**) — pilih satu, pakai konsisten.
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
- Radius: `12px` untuk card besar, `8px` untuk tombol/input, `9999px`
  (full) untuk badge/pill.
- Shadow: soft shadow saja (`shadow-sm`/`shadow-md` Tailwind), hindari
  shadow tebal/gelap.
- Container max-width halaman konten: `~1200px`, dengan padding
  horizontal minimal `16px` di mobile.

## 3. Komponen dasar

| Komponen | Aturan |
|---|---|
| **Tombol primary** | Background `primary`, teks putih, radius 8px, dipakai untuk aksi utama non-CTA marketing (mis. "Simpan", "Masuk") |
| **Tombol accent/CTA** | Background `accent`, teks gelap/putih (cek kontras), dipakai khusus untuk ajakan konversi ("Daftar Gratis", "Mulai Tes", "Upgrade Premium") |
| **Tombol secondary** | Outline/border `neutral-border`, teks `neutral-text` |
| **Badge status** | Pill kecil, warna sesuai makna: hijau=published/benar, amber=pending/ragu-ragu, merah=salah/terkunci, abu=draft |
| **Card** | Background `neutral-surface`, border `neutral-border` tipis, radius 12px, padding 16-24px |
| **Input/Form** | Border `neutral-border`, radius 8px, focus ring warna `primary` |
| **Tabel (admin)** | Header sticky, baris zebra tipis opsional, aksi di kolom kanan (ikon edit/toggle), hover row highlight ringan |
| **Navigasi soal (grid angka)** | Kotak kecil persegi, radius 6-8px: terjawab=solid biru, ragu-ragu=solid amber, belum=outline abu |
| **Chart** | Ikuti palet warna di atas untuk series; radar chart untuk subtopik, bar chart untuk perbandingan, line chart untuk tren waktu |

## 4. Layout per halaman

Ringkasan struktur tiap halaman (detail lengkap ada di prompt Stitch
yang sudah dipakai — file ini fokus ke aturan visual & konsistensi).

### 4.1 Landing page (publik)
Navbar transparan/putih → Hero (headline + CTA ganda + ilustrasi
dashboard) → trust bar angka → 4 kartu fitur → 2 kartu kategori
(Akademik vs CPNS) → perbandingan Gratis vs Premium → testimoni →
footer.

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
Skor besar di atas dengan badge lulus/tidak (mode CPNS). Radar chart
per subtopik dengan subtopik terlemah di-highlight. Bar chart detail
per subtopik. Riwayat percobaan + tren skor di bawah.

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
