# SRS Ringkas — Web Tes Premium

Dokumen ini sengaja ringkas (bukan format SRS akademik penuh) supaya murah
dibaca ulang oleh AI maupun manusia. Detail implementasi ada di
`ARCHITECTURE.md` dan `DATABASE.md`.

## 1. Tujuan

Platform latihan **Tes Kemampuan Akademik (TKA)** khusus siswa sekolah
(SD, SMP, SMA/SMK). Tes CPNS **tidak** termasuk scope (dihapus
2026-09-24, lihat DECISIONS).

Nilai jual utama: analisis kelemahan **per subtopik**, bukan cuma skor akhir.

## 2. Aktor

- **Siswa/Peserta** — daftar, kerjakan paket tes gratis/berbayar, lihat hasil & analisis.
- **Admin/Pengelola konten** — kelola topik/subtopik, import soal, review soal hasil AI, susun paket tes.
- **(Nanti) Instruktur/Bimbel** — lihat progres kelompok peserta. *(fase lanjut, belum di-scope)*

## 3. Struktur konten (inti produk)

```
Kategori = Jenjang (SD / SMP / SMA)
 └─ Topik = Mata pelajaran (mis. "Matematika", "Bahasa Indonesia")
     └─ Subtopik = Materi (mis. "Pecahan", "Teks Eksplanasi")
         └─ Soal (pilihan ganda, bisa ada gambar/rumus)
Paket Tes (kumpulan soal dari berbagai topik/subtopik, dengan durasi & poin per soal)
 └─ Percobaan/Attempt (satu kali pengerjaan oleh satu user)
     └─ Jawaban per soal
```

## 4. Fitur Fase 1 (MVP) — wajib ada

1. **Auth**: daftar/masuk email+password. Role: `student`, `admin`.
2. **Manajemen konten** (admin): CRUD Kategori → Topik → Subtopik → Soal.
   - Soal: teks, gambar opsional, rumus (KaTeX), 4-5 opsi, kunci jawaban,
     pembahasan, tingkat kesulitan, tag subtopik.
3. **Import soal** (admin): unggah file Excel/CSV dengan template baku →
   validasi → preview → simpan sebagai draft → admin approve.
4. **Paket Tes** (admin): pilih soal (manual atau by subtopik+jumlah acak),
   atur durasi. Skor: benar +1 (atau poin custom per soal di paket),
   salah/kosong 0.
5. **Pengerjaan tes** (peserta):
   - Timer server-side, auto-submit saat waktu habis.
   - Autosave jawaban tiap kali user memilih opsi.
   - Navigasi antar soal, tandai ragu-ragu.
   - Tidak menampilkan kunci jawaban selama tes berlangsung.
6. **Hasil & analisis** (peserta):
   - Skor total, skor per topik, skor per subtopik.
   - Grafik radar/bar per subtopik → tampilkan subtopik terlemah.
   - Riwayat semua percobaan.
7. **Generate soal via AI** (admin, opsional per akun):
   - User memasukkan **Gemini API key miliknya sendiri** di halaman
     pengaturan akun (disimpan terenkripsi, hanya dipakai server-side
     saat memanggil Gemini atas nama user itu, tidak pernah dikirim ke
     browser setelah disimpan).
   - Admin pilih topik/subtopik + jumlah soal + tingkat kesulitan →
     sistem panggil Gemini → hasil masuk sebagai **draft** (status
     `pending_review`), bukan langsung ke bank soal.
   - Admin review satu per satu (edit kalau perlu) → approve → masuk ke
     bank soal.
8. **Akses gratis vs premium (tanpa payment gateway dulu)**:
   - Field `is_premium` di Paket Tes.
   - Field `is_premium_unlocked` / tabel `entitlements` per user —
     untuk fase ini di-*toggle manual oleh admin* (belum ada checkout).
   - Struktur data harus sudah siap supaya payment gateway bisa
     ditambahkan belakangan tanpa migrasi besar (lihat ROADMAP fase 3).

## 5. Fitur eksplisit DI-SKIP di fase ini

- Payment gateway / checkout otomatis.
- Gemini API key di server/env — **tidak dipakai**, semua by-user.
- Anti-cheat canggih (proctoring kamera, deteksi wajah). Fase 1 cukup:
  timer server + (opsional) deteksi pindah tab dicatat sebagai log, tidak
  memblokir.
- Multi-bahasa UI (Indonesia saja dulu).

## 6. Non-fungsional

- **Keamanan soal/kunci**: kunci jawaban tidak pernah dikirim ke client
  sebelum submit/selesai attempt.
- **Ketahanan koneksi**: autosave, boleh lanjut dari device lain selama
  sesi/attempt masih aktif.
- **Skalabilitas awal**: target ratusan peserta bersamaan di hosting
  Node.js Hostinger (shared/business). Desain harus mudah pindah ke VPS
  tanpa ubah kode besar (lihat ARCHITECTURE §Skalabilitas).
- **Enkripsi API key**: Gemini API key user dienkripsi at-rest (mis. AES
  dengan key dari env server), tidak pernah di-log.
- **Auditability konten AI**: setiap soal AI menyimpan `generated_by`,
  `prompt_used` (ringkas), `reviewed_by`, `reviewed_at`.

## 7. Metrik sukses awal

- Peserta bisa menyelesaikan 1 paket tes end-to-end tanpa bug pemblokir.
- Analisis subtopik akurat (tervalidasi manual terhadap hasil hitung).
- Admin bisa dari nol: buat topik → import 50 soal via Excel → susun
  paket tes → publish, dalam < 30 menit.
