# Aturan Paket Tes TKA

Sumber: ketentuan dari pemilik produk (2026-10-01). Diterapkan di sistem:
`src/lib/package-rules.ts` (cek di form admin & server). Paket **tidak bisa
diterbitkan** bila aturan **wajib** belum terpenuhi; draft boleh disimpan.
Setiap paket = **satu jenjang + satu mata pelajaran**.

## Jumlah soal & durasi (wajib)

| Jenjang | Mata pelajaran | Soal | Durasi |
|---|---|---|---|
| SD | Matematika | 30 | 75 menit |
| SD | Bahasa Indonesia | 30 | 75 menit |
| SMP | Matematika | 30 | 75 menit |
| SMP | Bahasa Indonesia | 30 | 75 menit |
| SMA/SMK | Bahasa Indonesia | 30 | 75 menit |
| SMA/SMK | Bahasa Inggris | 30 | 75 menit |
| SMA/SMK | Matematika & Numerasi | 25 | 75 menit |
| SMA/SMK | Mata pelajaran pilihan 1 & 2 (semua mapel `pilihan`) | 25 per mapel | 60 menit per mapel |

SD dan SMP strukturnya sama; bedanya hanya kompleksitas materi dan panjang
stimulus bacaan sesuai perkembangan kognitif.

## Bentuk soal

- **Tidak ada esai.** Hanya 3 bentuk objektif:
  - **PG sederhana** — 1 jawaban paling benar (A–E).
  - **PG kompleks MCMA** — lebih dari 1 jawaban benar, harus memilih semua
    yang benar untuk poin penuh.
  - **PG kompleks Kategori** — beberapa pernyataan, tiap pernyataan diberi
    kategori: Benar/Salah, Sesuai/Tidak Sesuai, atau Ya/Tidak.
- **Komposisi (wajib):** PG sederhana **50–60%** dari total soal
  (30 soal → 15–18 PG; 25 soal → 13–15 PG). Sisanya MCMA & Kategori
  (disarankan keduanya ada). PG biasanya di soal tunggal atau awal stimulus.
- **Semua soal paket** harus dari mata pelajaran paket itu (wajib).

## Karakteristik SMA/SMK (disarankan, tampil sebagai peringatan)

- **Berbasis stimulus:** mayoritas soal diawali teks bacaan, grafik,
  infografis, tabel, atau studi kasus nyata — bukan hafalan rumus.
- **Soal grup:** satu stimulus untuk **3–5 soal**.
- **Menguji penalaran:** literasi, numerasi, analisis data, problem solving.

Karakteristik per jenjang juga dimasukkan ke prompt Generate Soal AI
(`generation-context.ts`, `JENJANG_CHARACTER`).
