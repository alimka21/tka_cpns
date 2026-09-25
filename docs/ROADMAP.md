# Roadmap — Web Tes Premium

## Status saat ini

**Scope: TKA sekolah saja (SD/SMP/SMA), CPNS dihapus 2026-09-24.**

**Database 2026-09-25:** tersambung ke Hostinger (MariaDB 11.8, via
Remote MySQL; `npm run db:check`). Migrasi 0000–0006 **sudah
dijalankan**, seed kerangka asesmen sudah masuk (3 jenjang, 26 mata uji,
97 domain, 268 subdomain). Berikutnya: auth (Better Auth) lalu CRUD soal
yang benar-benar menyimpan.
Migrasi `0001_*` (hapus `score_weight`/`tkp_weighted`) sudah dijalankan
bersama migrasi lain (lihat status Database di atas).

**Optimasi 2026-09-24:** rumus KaTeX dirender di server
(`math-render.ts` → `ExamQuestion.html`), metadata SEO + `robots.txt`/
`sitemap.xml` (butuh env `SITE_URL`), halaman akun/admin `noindex`,
header keamanan di `next.config.ts`, font Geist diperbaiki.

**Fase 1.5 2026-09-25:** 1.5a–1.5d selesai (bagian tanpa DB) — skema &
validasi 3 bentuk soal + stimulus, skor benar-penuh, UI ujian per bentuk
+ panel stimulus, import Excel multi-bentuk (`bentuk_soal`, kunci ganda,
`kategori`, `kode_stimulus` + sheet Stimulus), form soal `/admin/soal/baru`,
kelola stimulus `/admin/soal/stimulus`, logika paket soal grup utuh.
Migrasi 0002–0006 sudah dijalankan (2026-09-25). Sisa Fase 1.5: 1.5e (AI) dan
bagian yang menunggu DB (simpan soal/stimulus, UI susun paket).

**Kerangka asesmen 2026-09-24:** `asesmen/*.json` jadi sumber hierarki
konten (lihat `asesmen/README.md`). Migrasi `0002`/`0003` (tabel
`subjects`, kolom `code`, `cognitive_level`) + seed
`npm run db:seed:asesmen` sudah dijalankan ke DB (2026-09-25).
Import Excel kini pakai `kode_subdomain`; konteks prompt AI siap di
`src/server/asesmen/generation-context.ts`.

**UI 2026-09-24:** semua halaman dibangun ulang sesuai layar Stitch
"Web Tes Premium" (peta layar → file di `docs/UI_UX.md` §8): landing,
masuk/daftar (validasi Zod, belum ada sesi), dashboard siswa, pengerjaan
tes (grup route `(exam)`), hasil & analisis (`/hasil/demo`, radar chart),
admin dashboard/user/bank soal/import. Data contoh di
`src/lib/demo-data.ts` — hapus bertahap saat query DB siap. Import Excel
sudah jalan sampai pratinjau (`src/server/actions/question-import.ts`).

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
- [x] Koneksi ke MySQL Hostinger (env `DATABASE_URL`) — MariaDB 11.8
      via Remote MySQL, cek dengan `npm run db:check`
- [ ] Setup Git + repo GitHub, hubungkan ke VS Code
- [ ] Push awal, sambungkan Hostinger auto-deploy dari `main`

## Fase 1 — MVP fungsional

- [ ] Auth: register/login, role student/admin
- [ ] Skema Drizzle: users, categories, topics, subtopics, questions,
      question_options, question_explanations — ✅ konten + stimuli siap;
      sisa: test_packages, entitlements, attempts, attempt_answers
- [x] Admin: kategori/topik/subtopik — diganti seed dari kerangka asesmen
      (`npm run db:seed:asesmen`) + penjelajah read-only `/admin/topik`
- [ ] Admin: CRUD soal manual (dengan KaTeX preview)
      — ✅ skema Zod `questionInput` & komponen `MathText` siap
- [ ] Admin: import soal via Excel (template + validasi + preview)
      — ✅ template + parser + validasi per baris + halaman upload/
      pratinjau siap; sisa: cocokkan topik/subtopik ke DB, insert draft
- [ ] Admin: susun paket tes (pilih soal, atur durasi & poin per soal)
      — ✅ skema Zod `testPackageInput` siap
- [ ] Admin: entitlement manual (kasih akses paket premium ke user)
- [ ] Student: lihat daftar paket tes (gratis/premium, lock kalau belum
      punya entitlement)
- [ ] Student: kerjakan tes — timer server-side, autosave jawaban,
      navigasi soal, submit — ✅ UI `ExamShell` siap (lihat `/tes/demo`);
      sisa: server action start/save/finalize ke tabel attempts
      (**setelah** skema Fase 1.5a — format `attempt_answers.response`)
- [ ] Finalize attempt: hitung skor, simpan ringkasan
      subtopik — ✅ `scoreAttempt` + `summarizeBySubtopic` teruji;
      sisa: sambungkan ke DB
- [ ] Student: halaman hasil — skor total + grafik per subtopik + riwayat
      — ✅ UI siap (`/hasil/demo`, data contoh); sisa: baca dari DB

## Fase 1.5 — Bentuk soal TKA lengkap & soal grup stimulus

Kerangka asesmen (`asesmen/*.json` → `bentuk_soal`, `jenis_soal`) memakai
3 bentuk soal + soal grup; sistem saat ini baru PG tunggal.
**Urutan penting:** kerjakan 1.5a (skema) *sebelum* tabel `attempts`/
`attempt_answers` dibuat di Fase 1, supaya format jawaban tidak perlu
dimigrasi ulang. Sisanya (1.5b–e) berjalan paralel dengan Fase 1.

**Keputusan (ditetapkan 2026-09-25, lihat `docs/DECISIONS.md`):**
skor benar penuh atau 0 untuk semua bentuk; MCMA 4–5 opsi dengan 1 s.d.
(jumlah opsi − 1) kunci; Kategori 3–5 pernyataan, pasangan Benar/Salah
atau Sesuai/Tidak Sesuai; stimulus boleh lintas subdomain.

### 1.5a Skema & validasi (fondasi)
- [x] `questions.type` → enum `pg` | `pgk_mcma` | `pgk_kategori`
      (ganti `single_choice`, migrasi data `single_choice` → `pg`)
- [x] `questions.category_labels` (JSON, nullable) — pasangan kategori
      untuk PGK Kategori, mis. `["Benar","Salah"]`
- [x] `question_options.correct_category` (nullable) — kunci per
      pernyataan untuk PGK Kategori; `is_correct` tetap untuk PG & MCMA
- [x] Tabel `stimuli`: id, code (unique), title, content (teks/KaTeX),
      image_url, status, created_by, created_at
- [x] `questions.stimulus_id` (fk nullable) + `questions.stimulus_order`
      — `jenis_soal` = grup bila `stimulus_id` terisi
- [x] `attempt_answers.response` (JSON) menggantikan
      `selected_option_id` — format dikunci di Zod `answerResponse` &
      `docs/DATABASE.md` (`{type,optionId}` | `{type,optionIds}` |
      `{type,answers:[{optionId,category}]}`); tabelnya dibuat bersama
      attempts di Fase 1
- [x] Zod: `questionInput` jadi discriminated union per bentuk (aturan
      jumlah opsi/kunci di atas) + `stimulusInput` + `answerResponse`
- [x] Update `docs/DATABASE.md` (skema + aturan skor per bentuk)

### 1.5b Penskoran & analitik
- [x] `scoring.ts`: `scoreQuestion` per bentuk; opsi/pernyataan yang
      bukan milik soal tetap diabaikan (anti manipulasi payload)
- [x] Definisi "terjawab": PG 1 opsi; MCMA ≥1 opsi; Kategori semua
      pernyataan terisi (sebagian terisi = `partial`: dihitung dijawab
      untuk statistik kosong, skor 0; UI menandainya "belum lengkap")
- [x] `analytics.ts` tidak berubah (tetap per subdomain) — tambah test
      untuk soal grup yang subdomainnya berbeda-beda
- [x] Unit test tiap bentuk: benar penuh, sebagian, salah, kosong,
      payload manipulasi

### 1.5c UI pengerjaan tes
- [x] `ExamQuestion` & `ExamAnswerState` membawa `type`,
      `categoryLabels`, `stimulus` — tetap **tanpa** kunci jawaban
- [x] `QuestionView` per bentuk: radio (PG), checkbox + petunjuk
      "jawaban benar bisa lebih dari satu" (MCMA), tabel pernyataan × kategori
      dengan radio per baris (Kategori; di HP jadi kartu per pernyataan)
- [x] Panel stimulus: desktop split (stimulus kiri, scroll sendiri;
      soal kanan), HP bagian "Baca stimulus" yang bisa dilipat
- [x] Navigator menandai soal satu grup (label stimulus) dan status
      "belum lengkap" untuk Kategori yang baru sebagian terisi
- [x] Autosave & `saveAnswer` memakai payload `response` baru
- [x] `/tes/demo`: contoh 1 soal tiap bentuk + 1 grup stimulus 2 soal
- [ ] Halaman hasil/pembahasan: tampilkan kunci per bentuk (setelah
      attempt selesai saja) — menunggu halaman pembahasan dibuat

### 1.5d Admin & import
- [x] Form soal manual: pilih bentuk → field menyesuaikan (kunci tunggal
      / kunci ganda / kategori per pernyataan), pilih stimulus opsional
      — `/admin/soal/baru`, validasi aktif; simpan menunggu DB
- [x] Kelola stimulus: daftar, buat, lihat soal yang memakainya —
      `/admin/soal/stimulus` (data contoh); edit & simpan menunggu DB
- [x] Bank soal: badge bentuk & penanda grup stimulus, filter per bentuk
- [ ] Susun paket tes: soal grup masuk utuh & berurutan (tidak bisa
      diambil sebagian) — ✅ logika `completeGroups` &
      `validatePackageOrder` teruji; sisa: UI susun paket (Fase 1)
- [x] Import Excel: kolom `bentuk_soal` (pg/pgk_mcma/pgk_kategori),
      `kunci` multi (`A,C` untuk MCMA; `B,S,B` untuk Kategori),
      `kategori` (`Benar/Salah` | `Sesuai/Tidak Sesuai`),
      `kode_stimulus` + sheet "Stimulus" (kode, judul, teks)
- [x] Template & petunjuk import diperbarui + test parser per bentuk

### 1.5e AI (menyambung Fase 2)
- [ ] `buildGenerationContext` menerima bentuk soal & mode grup
      (1 stimulus + N soal), dengan format output JSON per bentuk
- [ ] Skema Zod output AI per bentuk (validasi sebelum masuk antrian
      review)

## Fase 2 — AI generate soal

- [ ] Halaman pengaturan: simpan Gemini API key user (terenkripsi)
- [ ] Server action generate soal by subdomain/jumlah/kesulitan/level
      — ✅ konteks prompt dari kerangka (`buildGenerationContext`) siap
- [ ] Generate AI untuk semua bentuk soal (PG, PGK MCMA, PGK Kategori)
      dan soal grup berbasis stimulus — butuh Fase 1.5 selesai
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
