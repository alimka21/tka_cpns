# Kerangka Asesmen TKA

Sumber kebenaran struktur konten: jenjang → mata uji → domain → subdomain,
ditranskripsi dari Kerangka Asesmen BSKAP (SD/SMP: 047/H/AN/2025,
SMA: 045/H/AN/2025). Setiap soal wajib tertaut ke satu **kode subdomain**.

| File | Isi |
|---|---|
| `tka-sd.json` | 2 mata uji wajib |
| `tka-smp.json` | 2 mata uji wajib |
| `tka-sma.json` | 3 wajib + 19 pilihan (termasuk SMK-PKK) |

## Dipakai oleh

- `src/server/asesmen/` — loader + validasi (kode unik, prefix, urutan, preset level kognitif)
- `npm run db:seed:asesmen` — isi tabel categories/subjects/topics/subtopics
- Import Excel — kolom `kode_subdomain` & `level_kognitif` dicek ke file ini
- Generate soal AI — `buildGenerationContext()` memagari prompt dengan cakupan & batasan
- Halaman admin `/admin/topik` — penjelajah kerangka

## Kalau file diubah

1. Jangan ubah **kode** yang sudah dipakai soal — tambahkan kode baru saja.
2. Naikkan `meta.versi_file`.
3. `npm test` — gagal kalau struktur rusak (kode ganda, prefix salah, urutan loncat, preset hilang).
4. `npm run db:seed:asesmen` — upsert ke DB; kode yang dihapus dari file hanya dilaporkan, tidak dihapus dari DB.
