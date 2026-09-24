# Roadmap — Web Tes Premium

## Status saat ini

**Scope: TKA sekolah saja (SD/SMP/SMA), CPNS dihapus 2026-09-24.**
Migrasi `0001_*` (hapus `score_weight`/`tkp_weighted`) sudah dibuat,
**belum dijalankan** ke database.

**Fase 1 — MVP, bagian non-database selesai.** Logika skor
(`src/server/services/scoring.ts`), agregasi subtopik/topik
(`analytics.ts`), skema Zod (`src/lib/validation/`), parser & template
Excel import (`question-import.ts`), dan komponen UI ujian
(`src/components/tes/`: timer server-side, navigasi, ragu-ragu, autosave,
KaTeX) sudah jadi + unit test (`npm test`, Vitest). Pratinjau UI ujian di
`/tes/demo` (data contoh, hapus setelah attempt pakai DB).
**Tertunda (butuh DB):** koneksi MySQL, auth, semua CRUD admin, attempt
asli, halaman hasil. Git remote/deploy juga belum.

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
      — ✅ skema Zod `questionInput` & komponen `MathText` siap
- [ ] Admin: import soal via Excel (template + validasi + preview)
      — ✅ template + parser + validasi per baris siap; sisa: halaman
      upload/preview, cocokkan topik/subtopik ke DB, insert draft
- [ ] Admin: susun paket tes (pilih soal, atur durasi & poin per soal)
      — ✅ skema Zod `testPackageInput` siap
- [ ] Admin: entitlement manual (kasih akses paket premium ke user)
- [ ] Student: lihat daftar paket tes (gratis/premium, lock kalau belum
      punya entitlement)
- [ ] Student: kerjakan tes — timer server-side, autosave jawaban,
      navigasi soal, submit — ✅ UI `ExamShell` siap (lihat `/tes/demo`);
      sisa: server action start/save/finalize ke tabel attempts
- [ ] Finalize attempt: hitung skor, simpan ringkasan
      subtopik — ✅ `scoreAttempt` + `summarizeBySubtopic` teruji;
      sisa: sambungkan ke DB
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
