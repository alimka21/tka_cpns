# Penskoran, Kategori Capaian, dan Pelaporan TKA

Sumber: **Keputusan Menteri Pendidikan Dasar dan Menengah Nomor 56 Tahun 2026**
tentang Pedoman Penyelenggaraan Tes Kemampuan Akademik dan Asesmen Nasional.

Dokumen ini **melengkapi** `docs/DATABASE.md` dan file kerangka asesmen di
`asesmen/`. Kerangka asesmen (Perka BSKAP 045 & 047/H/AN/2025)
mengatur **apa yang diujikan**; dokumen ini mengatur **bagaimana hasilnya
dinilai dan dilaporkan**. Keduanya tetap berlaku.

> **Aturan baca untuk Claude Code:** buka file ini hanya saat mengerjakan
> penskoran, halaman hasil, analisis capaian, atau skema tabel `attempts`.
> Untuk pekerjaan bank soal/konten, cukup `asesmen/`.

---

## 1. Rentang nilai: BERBEDA per jenjang

Ini perubahan paling berdampak. Skala nilai **tidak seragam** — jangan
hardcode satu skala untuk semua jenjang.

| Jenjang | Rentang nilai | Pembulatan |
|---|---|---|
| SD/MI/sederajat | **0 – 100** | 2 angka di belakang koma |
| SMP/MTs/sederajat | **0 – 100** | 2 angka di belakang koma |
| SMA/MA/sederajat | **200 – 800** | 2 angka di belakang koma |
| SMK/MAK | **200 – 800** | 2 angka di belakang koma |

Catatan penting:
- Skala 200–800 **hanya** untuk SMA/MA/sederajat dan SMK/MAK. SD dan SMP
  tetap 0–100.
- Batas bawah SMA/SMK adalah **200, bukan 0**. Peserta dengan jawaban benar
  nol tetap memperoleh nilai dasar 200 pada skala pelaporan.
- Nilai dilaporkan **per mata uji**, lalu digabungkan per peserta.

Urutan proses penskoran menurut regulasi:
1. Analisis respons/jawaban peserta untuk seluruh mata uji.
2. Proses penilaian untuk setiap mata uji per peserta.
3. Penggabungan nilai setiap mata uji per peserta.

### Dampak ke skema database

- Tambah kolom skala pada paket tes, mis. `score_scale` bernilai
  `0_100` atau `200_800`, diturunkan dari jenjang paket tes.
- Kolom nilai (`total_score`, `attempt_subtopic_scores.score`) gunakan
  tipe desimal presisi 2, mis. `DECIMAL(6,2)` — cukup untuk 800,00.
  **Jangan** pakai integer.
- Simpan juga skor mentah (jumlah benar / raw score) terpisah dari nilai
  skala. Keduanya dibutuhkan: skor mentah untuk analisis subtopik, nilai
  skala untuk pelaporan.

### Yang TIDAK diatur regulasi

Regulasi **tidak menjelaskan rumus konversi** dari skor mentah ke skala
200–800 maupun ke 0–100. Secara nasional ini memakai penyetaraan statistik
(IRT/equating) yang tidak dipublikasikan dalam dokumen ini.

Konsekuensi untuk sistem ini: nilai yang kita hasilkan adalah **simulasi**,
bukan replika skor resmi. Tetapkan satu metode konversi sendiri, simpan
sebagai konfigurasi, dan beri label jelas di UI bahwa skor bersifat latihan.
Metode paling sederhana yang jujur:

```
nilai_skala = 200 + (skor_mentah / skor_maksimum) * 600   // SMA/SMK
nilai_skala =   0 + (skor_mentah / skor_maksimum) * 100   // SD/SMP
```

Simpan rumus/parameter di tabel konfigurasi agar bisa diganti tanpa migrasi.

---

## 2. Kategori capaian: Baik / Memadai / Kurang

Regulasi menetapkan tiga kategori capaian hasil TKA:

1. **Baik**
2. **Memadai**
3. **Kurang**

Kategori ini adalah **pengelompokan nilai yang dicapai dalam setiap mata
pelajaran** — jadi dihitung **per mata uji**, bukan hanya satu kategori untuk
keseluruhan hasil peserta.

### Yang TIDAK diatur regulasi

**Ambang batas (cut score) ketiga kategori tidak disebutkan sama sekali**
dalam Kepmendikdasmen 56/2026. Dokumen hanya menyebut nama kategorinya.

Jadi jangan menebak angka lalu menampilkannya seolah resmi. Yang harus
dilakukan:
- Simpan ambang batas sebagai **konfigurasi yang bisa diubah admin**, bukan
  konstanta di kode.
- Siapkan per skala (0–100 dan 200–800) karena ambangnya pasti berbeda.
- Beri keterangan di UI bahwa ambang kategori adalah ketetapan internal
  platform selama ambang resmi belum dipublikasikan.

Struktur konfigurasi yang disarankan:

```
achievement_thresholds
  id, score_scale (0_100 | 200_800), category (baik|memadai|kurang),
  min_score, max_score, is_official (bool), updated_by, updated_at
```

Field `is_official` dipakai untuk menandai saat ambang resmi akhirnya terbit,
tanpa perlu ubah struktur.

---

## 3. Predikat Istimewa

Di luar tiga kategori di atas, ada satu predikat tambahan:

| Jenjang | Syarat nilai |
|---|---|
| SD/MI/sederajat dan SMP/MTs/sederajat | **≥ 95,00** |
| SMA/MA/sederajat dan SMK/MAK | **≥ 725,00** |

Regulasi menyatakan predikat ini untuk peserta yang mendapat nilai tersebut
**"di masing-masing mata uji"**.

> **Ambiguitas yang perlu diputuskan sendiri:** frasa itu bisa dibaca dua cara
> — (a) predikat melekat pada tiap mata uji yang nilainya mencapai ambang,
> atau (b) predikat melekat pada peserta hanya jika **semua** mata ujinya
> mencapai ambang. Regulasi tidak memperjelas. Implementasikan sebagai
> flag per mata uji (opsi a) karena lebih informatif dan bisa diagregasi
> menjadi opsi b bila diperlukan, lalu catat keputusan ini di
> `docs/DECISIONS.md`.

---

## 4. Durasi resmi per mata uji

Kerangka asesmen tidak mengatur durasi; Kepmendikdasmen 56/2026 mengaturnya.
Gunakan angka ini sebagai **default durasi paket tes**.

| Jenjang | Mata uji | Durasi |
|---|---|---|
| SD/MI & SMP/MTs | Bahasa Indonesia (termasuk Literasi Membaca) | **75 menit** |
| SD/MI & SMP/MTs | Matematika (termasuk Numerasi) | **75 menit** |
| SMA/MA & SMK/MAK | Bahasa Indonesia (termasuk Literasi Membaca) | **60 menit** |
| SMA/MA & SMK/MAK | Bahasa Inggris | **50 menit** |
| SMA/MA & SMK/MAK | Matematika (termasuk Numerasi) | **70 menit** |
| SMA/MA & SMK/MAK | Mata pelajaran pilihan pertama | **50 menit** |
| SMA/MA & SMK/MAK | Mata pelajaran pilihan kedua | **50 menit** |

Tambahan di luar mata uji (bagian dari AN, bukan TKA):
- **Latihan: 10 menit** sebelum tes dimulai pada setiap sesi.
- Survei Karakter: 20 menit. Survei Lingkungan Belajar: 20 menit.

Catatan implementasi: alokasi 10 menit latihan itu nyata dalam jadwal resmi.
Kalau ingin meniru pengalaman ujian sebenarnya, sediakan mode latihan singkat
sebelum timer utama berjalan — tetapi hitung keduanya terpisah agar timer
server untuk mata uji tetap bersih.

---

## 5. Mata uji: ada tambahan baru untuk SMK

Susunan mata uji pada dasarnya sama dengan kerangka asesmen, **dengan satu
tambahan**:

| Jenjang | Mata uji |
|---|---|
| SD/MI & SMP/MTs | Bahasa Indonesia, Matematika (keduanya wajib) |
| SMA/MA & SMK/MAK | Wajib: Bahasa Indonesia, Matematika, Bahasa Inggris |
| SMA/MA & SMK/MAK | Pilihan: peserta memilih **2** mata pelajaran |

Daftar mata pelajaran pilihan menjadi **20** (sebelumnya 19 di kerangka
asesmen):

1. Matematika lanjutan
2. Bahasa Indonesia lanjutan
3. Bahasa Inggris lanjutan
4. Fisika
5. Kimia
6. Biologi
7. Ekonomi
8. Sosiologi
9. Geografi
10. Sejarah
11. Antropologi
12. PPKn/Pendidikan Pancasila
13. Bahasa Arab
14. Bahasa Jerman
15. Bahasa Prancis
16. Bahasa Jepang
17. Bahasa Korea
18. Bahasa Mandarin
19. Produk/Projek Kreatif dan Kewirausahaan
20. **Teori Kompetensi Kejuruan (Program Keahlian)** ← BARU

Aturan ketersediaan:
- Nomor 1–19 tersedia untuk **SMA/MA/sederajat**.
- Nomor 1–20 tersedia untuk **SMK/MAK**.
- Nomor 20 mengikuti **program keahlian masing-masing peserta**, jadi bukan
  satu mata uji tunggal melainkan bervariasi per program keahlian.

### Dampak ke sistem

- Tambahkan mata uji ke-20 pada `asesmen/tka-sma.json`.
  **Kerangka asesmennya (domain/subdomain) belum tersedia** di regulasi
  manapun yang kita punya — jangan dikarang. Tandai sebagai placeholder
  sampai BSKAP menerbitkan kerangkanya.
- Validasi pemilihan mata uji pilihan harus mengecek jenjang: mata uji 20
  hanya boleh untuk peserta SMK/MAK.
- Karena nomor 20 bergantung program keahlian, akun peserta SMK kemungkinan
  butuh field `program_keahlian`.

---

## 6. Bentuk soal: tidak berubah

Dikonfirmasi tetap sama dengan yang sudah diimplementasikan:

- Pilihan Ganda (PG)
- Pilihan Ganda Kompleks — **lebih dari satu jawaban benar** (MCMA)
- Pilihan Ganda Kompleks — **kategori**

Tidak ada bentuk soal baru. Tidak perlu perubahan pada `bentuk_soal`,
template import, maupun logika penilaian per bentuk soal.

---

## 7. Penggabungan TKA dan AN

TKA kini dilaksanakan bersama Asesmen Nasional, dan butir soalnya digabung:

- Butir **Literasi Membaca** (AN) digabungkan ke dalam mata uji
  **Bahasa Indonesia**.
- Butir **Numerasi** (AN) digabungkan ke dalam mata uji **Matematika**.

Berlaku untuk semua jenjang (pada SMA/SMK: ke Bahasa Indonesia Wajib dan
Matematika Wajib).

Dampak ke sistem: satu paket tes Bahasa Indonesia/Matematika bisa memuat dua
jenis butir dengan tujuan pelaporan berbeda. Kalau ingin meniru ini, tambahkan
penanda asal butir pada soal (mis. `asal_butir`: `tka` | `an_literasi` |
`an_numerasi`) agar analisis bisa dipisah. **Opsional** — hanya relevan kalau
platform ingin ikut melaporkan capaian literasi/numerasi secara terpisah.

---

## 8. Bentuk keluaran hasil

Regulasi mengenal dua dokumen hasil. Keduanya bisa jadi acuan desain fitur
laporan, meski platform ini bukan penyelenggara resmi.

| Dokumen | Cakupan | Keterangan |
|---|---|---|
| **DKHTKA** (Daftar Kolektif Hasil TKA) | Per satuan pendidikan | Rekap nilai seluruh peserta di satu sekolah |
| **SHTKA** (Sertifikat Hasil TKA) | Per peserta | Dokumen digital dan/atau cetakan |

Padanan yang masuk akal di platform ini:
- SHTKA → halaman/PDF hasil per peserta (skor per mata uji + kategori capaian).
- DKHTKA → rekap per kelas/kelompok, berguna kalau nanti ada fitur
  guru/bimbel melihat progres kelompok.

> Jangan tiru format sertifikat resmi atau gunakan logo/kop Kementerian.
> Platform ini bukan penyelenggara TKA resmi, dan dokumen yang menyerupai
> sertifikat negara bisa menyesatkan pengguna.

---

## 9. Ringkasan dampak ke backlog

| # | Perubahan | Dampak | Prioritas |
|---|---|---|---|
| 1 | Skala nilai berbeda per jenjang (0–100 vs 200–800) | Skema `attempts`, service `scoring.ts` | Tinggi |
| 2 | Nilai desimal 2 angka | Tipe kolom `DECIMAL(6,2)` | Tinggi |
| 3 | Kategori capaian Baik/Memadai/Kurang | Tabel `achievement_thresholds` + UI hasil | Tinggi |
| 4 | Predikat Istimewa (≥95 / ≥725) | Logika skor + badge di halaman hasil | Sedang |
| 5 | Durasi resmi per mata uji | Default `duration_minutes` paket tes | Sedang |
| 6 | Mata uji ke-20 (Teori Kompetensi Kejuruan) | Kerangka asesmen SMA + validasi SMK | Sedang |
| 7 | Field `program_keahlian` untuk peserta SMK | Tabel `users` | Rendah |
| 8 | Penanda asal butir (TKA/AN) | Tabel `questions` | Rendah (opsional) |

---

## 10. Hal yang belum diatur — jangan dikarang

Tiga hal berikut **tidak ada** dalam Kepmendikdasmen 56/2026 maupun kerangka
asesmen. Kalau dibutuhkan, tetapkan sebagai keputusan platform dan catat di
`docs/DECISIONS.md`, jangan disajikan sebagai ketentuan resmi:

1. **Ambang batas kategori Baik/Memadai/Kurang** — tidak ada angkanya.
2. **Rumus konversi skor mentah ke skala 200–800 atau 0–100** — tidak
   dipublikasikan.
3. **Jumlah butir soal per mata uji** — tidak disebutkan di kedua dokumen.

---

## Referensi

- Keputusan Mendikdasmen Nomor 56 Tahun 2026 tentang Pedoman Penyelenggaraan
  Tes Kemampuan Akademik dan Asesmen Nasional — Bab IV (Instrumen),
  Bab VIII (Pelaksanaan/Jadwal), Bab X (Analisis dan Pelaporan Hasil).
- Perka BSKAP Nomor 045/H/AN/2025 — Kerangka Asesmen TKA SMA/MA dan SMK/MAK.
- Perka BSKAP Nomor 047/H/AN/2025 — Kerangka Asesmen TKA SD/MI dan SMP/MTs.
