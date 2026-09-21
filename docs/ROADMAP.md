# Roadmap — Web Tes Premium

## Status saat ini

**Fase 0 — Setup.** Proyek sudah di-scaffold (Next.js 16 + TypeScript +
Tailwind + shadcn/ui + Drizzle ORM/Kit + Zod + Better Auth), struktur
folder `src/` sudah dibuat sesuai `docs/ARCHITECTURE.md` §2. Belum ada
koneksi database aktif & belum push ke GitHub.

_Update baris ini setiap sesi kerja selesai, supaya sesi Claude Code
berikutnya langsung tahu posisi tanpa baca ulang riwayat chat._

## Fase 0 — Setup proyek (sekarang)

- [x] `npx create-next-app` (TypeScript, App Router, Tailwind, ESLint)
- [x] Install shadcn/ui, Drizzle ORM + Drizzle Kit, Zod, Better Auth
- [ ] Koneksi ke MySQL Hostinger (env `DATABASE_URL`) — bisa pakai
      database lokal/dev dulu sebelum ada hosting aktif
- [ ] Setup Git + repo GitHub, hubungkan ke VS Code
- [ ] Push awal, sambungkan Hostinger auto-deploy dari `main`

## Fase 1 — MVP fungsional

- [ ] Auth: register/login, role student/admin
- [ ] Skema Drizzle: users, categories, topics, subtopics, questions,
      question_options, question_explanations
- [ ] Admin: CRUD kategori/topik/subtopik
- [ ] Admin: CRUD soal manual (dengan KaTeX preview)
- [ ] Admin: import soal via Excel (template + validasi + preview)
- [ ] Admin: susun paket tes (pilih soal, atur durasi & scoring_mode)
- [ ] Admin: entitlement manual (kasih akses paket premium ke user)
- [ ] Student: lihat daftar paket tes (gratis/premium, lock kalau belum
      punya entitlement)
- [ ] Student: kerjakan tes — timer server-side, autosave jawaban,
      navigasi soal, submit
- [ ] Finalize attempt: hitung skor (3 mode scoring), simpan ringkasan
      subtopik
- [ ] Student: halaman hasil — skor total + grafik per subtopik + riwayat

## Fase 2 — AI generate soal

- [ ] Halaman pengaturan: simpan Gemini API key user (terenkripsi)
- [ ] Server action generate soal by topik/subtopik/jumlah/kesulitan
- [ ] Validasi output AI dengan Zod, retry sekali kalau gagal parse
- [ ] Admin: antrian review soal AI (approve/edit/reject)

## Fase 3 — Monetisasi (nanti, belum sekarang)

- [ ] Payment gateway Indonesia (Midtrans/Xendit/Duitku)
- [ ] Alur checkout → isi `entitlements` otomatis
- [ ] Halaman riwayat transaksi user

## Fase 4 — Pengerasan (sebelum ramai dipakai)

- [ ] Load test alur pengerjaan tes bersamaan
- [ ] Review index database & query lambat
- [ ] Rencana migrasi ke VPS Hostinger kalau trafik naik
- [ ] Backup otomatis database

## Prinsip urutan kerja

Kerjakan fase secara berurutan. Jangan mulai Fase 2 (AI) sebelum alur
pengerjaan tes & skor di Fase 1 benar-benar teruji — fitur AI tidak ada
gunanya kalau alur ujian intinya belum solid.
