# Roadmap — Web Tes Premium

## Status saat ini

**Scope: TKA sekolah saja (SD/SMP/SMA), CPNS dihapus 2026-09-24.**

**Fase 1 + 1.5 selesai 2026-09-29:** alur inti produk sekarang nyata
end-to-end — admin bisa import/tambah soal → terbitkan → susun paket tes
(`/admin/paket-tes`, termasuk soal grup stimulus utuh & berurutan) →
terbitkan paket → siswa mengerjakan tes sungguhan (`/tes/[packageId]`,
timer server, autosave, resume, auto-expire) → submit → skor & analisis
per subtopik tersimpan & tampil di `/hasil/[attemptId]` dari data asli →
riwayat & subtopik terlemah di dashboard siswa dari data asli → dashboard
admin (stat, grafik 7 hari, percobaan terbaru) dari data asli. Akses
premium diatur per paket (cari user → beri/cabut akses) di halaman edit
paket, bukan toggle per user. Diuji end-to-end di DB Hostinger (skrip
manual, dibersihkan setelahnya): daftar → jadi admin → import 5 soal +
1 stimulus → terbitkan → buat & terbitkan paket → siswa daftar →
kerjakan tes (semua bentuk soal + grup stimulus) → submit → lihat hasil
→ beri/cabut akses premium — semua lolos. Migrasi `0009_paket_tes_attempt`
sudah dijalankan (tabel test_packages, test_package_questions,
entitlements, attempts, attempt_answers, attempt_subtopic_scores).
Menyusul 2026-09-29: halaman pembahasan `/hasil/[attemptId]/pembahasan`,
edit/hapus soal `/admin/soal/[id]` + pratinjau KaTeX. **Fase 1 lengkap.**
Fase 2.5 langkah 4 (diagnosa, `/progres`, `/riwayat`) juga selesai —
berikutnya: latihan kelemahan bank-only (tabel practice_sessions).
Riwayat & diagnosa kini ikut menghitung attempt `expired` (waktu habis).
**2026-10-03 (5):** landing page — section kerangka asesmen + angka live,
testimoni (diisi admin di Pengaturan Sistem, tersembunyi bila kosong), FAQ.
**2026-10-03 (4):** admin bisa membuat akun siswa (Manajemen User → Tambah user).
**2026-10-03 (3):** Fase 4 — load test (`npm run loadtest`) & index query
panas (migrasi 0016 SUDAH dijalankan), cache detail paket di jalur ujian.
**2026-10-03 (2):** halaman Pratinjau Paket (tombol "Pratinjau" di daftar
Paket Tes & halaman Kelola) — cek kesiapan terbit, tinjau kunci/pembahasan,
setujui per soal, dan tampilan siswa.
**2026-10-03:** Buat Paket Otomatis kini menargetkan sebaran level/kesulitan
(±20/50/30, bukan L1/mudah semua) + cek saran kualitas di aturan paket; bug
level kognitif kosong (batch Matematika ditolak) diperbaiki.
**2026-10-02 (2):** Buat Paket Otomatis (`/admin/paket-tes/otomatis`): soal
bank belum terpakai + AI menambal kekurangan (pratinjau dulu, batch paralel)
→ paket draf. Diuji pratinjau & pembuatan dari bank; batch AI belum diuji
dengan key Gemini asli.
**2026-10-02:** ganti kata sandi (Pengaturan siswa & Profil admin, opsi
keluarkan perangkat lain; akun Google-only bisa "Buat kata sandi"); diuji
di browser. Berikutnya: lupa kata sandi via SMTP Hostinger (WORKFLOW §10).
**2026-10-01 (5):** cakupan subtopik paket wajib ≥80% (opsi B) + saran
grup multi-subtopik; Generate AI soal grup bisa lintas subtopik.
**2026-10-01 (4):** aturan paket TKA ditegakkan (docs/ATURAN_PAKET.md):
paket punya mapel, jumlah soal/durasi/rasio PG dicek, terbit diblokir bila
belum sesuai. Pasangan kategori Ya/Tidak. Migrasi 0015 sudah dijalankan.
**2026-10-07 (5):** batas akun gratis (1 paket/mapel/jenjang; pembahasan & statistik kelemahan dikunci, kunci jawaban tetap) + popup upgrade di hasil tes + halaman "paket terkunci" (DECISIONS 2026-10-07).
**2026-10-07 (4):** halaman /privasi & /syarat (UU PDP, QRIS DOKU, tanpa perpanjangan otomatis, kebijakan refund) + tautan di footer & form daftar; env CONTACT_EMAIL.
**2026-10-07 (3):** admin pilih Gratis|Premium langsung di daftar Paket Tes
(+ saring akses); dashboard siswa saring Gratis/Premium + banner paket
terkunci; halaman hasil tes jadi 3 tab (Ringkasan · Analisa Kemampuan · Soal &
Pembahasan, satu soal per halaman dengan panel nomor berwarna). Rute lama
/hasil/[id]/pembahasan dialihkan ke tab. Bug lama diperbaiki: reportTargetOf
dipanggil dari server (error di pembahasan & hasil latihan), key ganda &
hydration mismatch di radar.
**2026-10-07 (2):** rebrand → **Pakar TKA**, slogan "Kenali Kelemahan,
Kuasai TKA." — logo di header/footer/auth/ujian, favicon, ikon, manifest,
gambar pratinjau tautan (UI_UX §0). Grafik tren per subdomain di /progres.
**2026-10-07:** pembayaran pindah ke **DOKU Checkout (QRIS)**, Midtrans
dihapus. Diuji dengan server DOKU tiruan (signature diverifikasi, alur beli →
notifikasi → Premium aktif, notifikasi palsu ditolak). Migrasi 0017 (hapus
`orders.snap_token`) BELUM dijalankan — jalankan saat deploy (WORKFLOW §8).
**2026-10-01 (3):** login/daftar dengan Google (aktif setelah env
GOOGLE_CLIENT_ID/SECRET diisi; langkah di WORKFLOW §9).
**2026-10-01 (2):** Fase 3 pembayaran Midtrans selesai (diuji dengan
server Midtrans tiruan; belum dengan key Sandbox asli). Migrasi 0014
sudah dijalankan. Pool MySQL diberi pengaman koneksi idle.
**2026-10-01:** jenjang wajib per akun (paket & latihan disaring per
jenjang), konfirmasi pendaftar opsional (`/admin/pengaturan`,
`/admin/users` dengan tab status, setujui/tolak, ubah jenjang), halaman
Pengaturan di tengah. Migrasi 0013 sudah dijalankan. Akun lama akan diminta
memilih jenjang saat login berikutnya. Berikutnya: Fase 3 pembayaran.
**2026-09-30 (4):** model default `gemini-3-flash-preview`; mode AI soal
grup (bacaan); Latihan AI siswa saat bank kurang; Laporkan soal + antrean
`/admin/laporan`; stimulus bisa diedit & diterbitkan. Migrasi 0012 sudah
dijalankan (sempat gagal di FK bernama > 64 karakter — lihat DECISIONS).
**Fase 2 & 2.5 selesai** (belum diuji dengan key Gemini asli).
**2026-09-30 (3):** Fase 2 (AI admin) selesai: key Gemini per user,
generate soal baru / variasi / dari gambar, galeri gambar di DB, bank
soal berjenjang. Migrasi 0011 sudah dijalankan. Belum diuji dengan key
Gemini asli. Berikutnya: Fase 2.5 langkah 6 (soal AI latihan siswa saat
bank kurang) & 7 (laporkan soal).
**2026-09-30 (2):** Latihan Kelemahan bank-only selesai (Fase 2.5
langkah 5) + migrasi 0010 dijalankan. Berikutnya: Fase 2 (key Gemini
siswa di Pengaturan + client Gemini) lalu langkah 6 (soal AI saat bank
kurang).
**2026-09-30:** demo publik `/tes/demo` jadi 10 soal + halaman hasil
`/tes/demo/hasil` (skor, radar subdomain, rencana belajar, pembahasan, CTA
daftar); pop-up tengah saat mengumpulkan tes; panel stimulus di atas soal.

**Database 2026-09-25:** tersambung ke Hostinger (MariaDB 11.8, via
Remote MySQL; `npm run db:check`). Migrasi 0000–0006 **sudah
dijalankan**, seed kerangka asesmen sudah masuk (3 jenjang, 26 mata uji,
97 domain, 268 subdomain).

**Auth 2026-09-25:** Better Auth (email/password) terpasang — tabel
`sessions`/`accounts`/`verifications`, `users` tanpa `password_hash`
(password di `accounts.password`), id INT serial, role via
`npm run user:role -- <email> admin`. `/dashboard`, `/pengaturan`,
`/hasil` wajib login; `/admin/*` wajib admin; action import & template
cek admin. Migrasi 0007–0008 sudah dijalankan; alur daftar → masuk →
keluar, blokir siswa dari /admin, salah password, `?next`, dan open
redirect sudah diuji end-to-end di DB asli (akun uji dihapus lagi).
**Simpan soal 2026-09-26:** form Tambah Soal, form Stimulus, dan
konfirmasi import Excel menyimpan ke DB (draft) lewat server action
(`src/server/actions/questions.ts`, `confirmQuestionImport`); Bank Soal
& halaman Stimulus membaca DB (`src/server/queries/question-bank.ts`);
tombol Terbitkan/Jadikan draft. Kolom JSON pakai `jsonText` (aman untuk
MariaDB). **Belum diuji end-to-end di DB** — koneksi dari laptop sering
ditolak karena IP seluler berganti-ganti (lihat WORKFLOW §6/§7).
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
- [x] Setup Git + repo GitHub (`origin` sudah diatur ke
      `github.com/alimka21/tka_cpns`)
- [x] Push awal, sambungkan Hostinger auto-deploy dari `main` (deploy berhasil 2026-09-29)
      - Build produksi pakai `next build --webpack` (Turbopack crash di
        PostCSS saat build Hostinger — lihat DECISIONS 2026-09-29).
        Node 22 di hPanel; env: DATABASE_URL, BETTER_AUTH_SECRET,
        BETTER_AUTH_URL, ENCRYPTION_SECRET, SITE_URL.

## Fase 1 — MVP fungsional

- [x] Auth: register/login, role student/admin — Better Auth, teruji
      end-to-end di DB Hostinger
- [x] Skema Drizzle: users, categories, topics, subtopics, questions,
      question_options, question_explanations, test_packages,
      test_package_questions, entitlements, attempts, attempt_answers,
      attempt_subtopic_scores — semua tabel Fase 1 sudah ada & termigrasi
- [x] Admin: kategori/topik/subtopik — diganti seed dari kerangka asesmen
      (`npm run db:seed:asesmen`) + penjelajah read-only `/admin/topik`
- [x] Admin: CRUD soal manual (dengan KaTeX preview) — tambah,
      `/admin/soal/[id]` edit & hapus, pratinjau langsung di form; soal
      yang sudah dijawab/masuk paket dikunci sebagian
      (`editLockViolation`, DECISIONS 2026-09-29)
- [x] Admin: import soal via Excel (template + validasi + preview)
      — selesai: template, validasi, pratinjau, simpan draft ke DB
- [x] Admin: susun paket tes (pilih soal, atur durasi & poin per soal)
      — `/admin/paket-tes/baru` & `/admin/paket-tes/[id]`, soal grup
      stimulus otomatis ikut utuh, validasi urutan di server; daftar
      paket bisa difilter jenjang & mapel (`?jenjang=&mapel=`)
- [x] Admin: terbitkan paket beserta soal yang belum tayang sekaligus
      (konfirmasi di daftar Paket Tes, satu transaksi)
- [x] Admin: Impor PDF dengan Gemini (`/admin/soal/import-pdf`) — PDF
      (termasuk scan) → bacaan, soal, kunci, potongan gambar → pratinjau →
      simpan `pending_review` + paket draf (docs/AI_GENERATION.md §10)
- [x] Admin: Buat Paket Otomatis — bank belum terpakai + AI menambal
      kekurangan per subtopik/bentuk (docs/AI_GENERATION.md §11)
- [x] Admin: Pratinjau Paket `/admin/paket-tes/[id]/pratinjau` (2026-10-03):
      kesiapan terbit (aturan wajib + saran + soal belum tayang/tanpa
      pembahasan/dilaporkan), mode "Tinjau kunci & pembahasan" (filter,
      setujui per soal, edit soal) & mode "Tampilan siswa" (komponen ujian
      asli, tanpa kunci, jawaban tidak disimpan)
- [x] Bank Soal: filter per paket (`?paket=<id>` / `tanpa`) + tombol "Terbitkan semua" sesuai filter (2026-10-06)
- [x] Admin: entitlement manual (kasih akses paket premium ke user) —
      per paket di `/admin/paket-tes/[id]` (cari user → beri/cabut akses)
- [x] Student: lihat daftar paket tes (gratis/premium, lock kalau belum
      punya entitlement) — dashboard, `listPackagesForStudent`
- [x] Student: kerjakan tes — timer server-side, autosave jawaban,
      navigasi soal, submit — `/tes/[packageId]`, resume attempt
      in_progress, auto-expire attempt yang ditinggal tanpa submit
- [x] Finalize attempt: hitung skor, simpan ringkasan subtopik —
      `finalizeAttempt` (transaksi: attempts + attempt_subtopic_scores),
      dipanggil dari submit siswa & dari auto-expire
- [x] Student: halaman hasil — skor total + grafik per subtopik + riwayat
      — `/hasil/[attemptId]` dari data asli (`getAttemptResult`); riwayat
      & subtopik terlemah di dashboard (`listStudentHistory`,
      `getWeakestSubtopicForStudent`)

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
- [x] Halaman hasil/pembahasan: tampilkan kunci per bentuk (setelah
      attempt selesai saja) — `/hasil/[attemptId]/pembahasan`
      (`getAttemptReview`), filter semua/salah/kosong/benar, stimulus
      grup, tabel kunci PGK Kategori

### 1.5d Admin & import
- [x] Form soal manual: pilih bentuk → field menyesuaikan (kunci tunggal
      / kunci ganda / kategori per pernyataan), pilih stimulus opsional
      — `/admin/soal/baru`, validasi aktif; simpan menunggu DB
- [x] Kelola stimulus: daftar, buat, lihat soal yang memakainya —
      `/admin/soal/stimulus` (data contoh); edit & simpan menunggu DB
- [x] Bank soal: badge bentuk & penanda grup stimulus, filter per bentuk
- [x] Susun paket tes: soal grup masuk utuh & berurutan (tidak bisa
      diambil sebagian) — logika `completeGroups` & `validatePackageOrder`
      + UI `/admin/paket-tes`
- [x] Import Excel: kolom `bentuk_soal` (pg/pgk_mcma/pgk_kategori),
      `kunci` multi (`A,C` untuk MCMA; `B,S,B` untuk Kategori),
      `kategori` (`Benar/Salah` | `Sesuai/Tidak Sesuai`),
      `kode_stimulus` + sheet "Stimulus" (kode, judul, teks)
- [x] Template & petunjuk import diperbarui + test parser per bentuk

### 1.5e AI (menyambung Fase 2)
- [x] `buildGenerationContext`/`buildAiPrompt` menerima bentuk soal +
      format output JSON per bentuk + mode grup (1 stimulus + N soal)
- [x] Skema Zod output AI per bentuk (`services/ai-questions.ts`)

## Fase 2 — AI generate soal

Rancangan: `docs/AI_GENERATION.md` (Jalur A + fondasi §2–3).

- [x] Halaman pengaturan: simpan Gemini API key user (terenkripsi) —
      `/pengaturan`, diuji ke Gemini dulu, AES-256-GCM (`crypto.ts`)
- [x] Server action generate soal by subdomain/jumlah/kesulitan/level —
      `/admin/soal/generate-ai`, 3 mode: **soal baru**, **variasi soal**
      (modifikasi soal bank, tombol "Variasi AI"), **dari gambar**
      (beberapa soal dari 1 gambar galeri, Gemini multimodal)
- [x] Generate AI untuk semua bentuk soal (PG, PGK MCMA, PGK Kategori)
      — soal grup berbasis stimulus: mode "Soal grup (bacaan)" (AI tulis
      bacaan baru → stimulus Draft, atau tambah soal ke stimulus yang ada;
      bentuk campuran)
- [x] Validasi output AI dengan Zod per soal (+ opsi ganda, KaTeX,
      duplikat bank), retry sekali untuk kekurangannya
- [x] Admin: antrian review soal AI — hasil `pending_review`; antrean di
      halaman Generate AI & filter Bank Soal (sumber AI); approve =
      Terbitkan, edit = `/admin/soal/[id]`, reject = hapus
- [x] Galeri gambar soal `/admin/soal/gambar` (unggah banyak, disimpan di
      DB terkompres WebP, disajikan `/gambar/[id]`), pemilih gambar di
      form soal
- [x] Bank soal berjenjang: jenjang → mapel → topik → subtopik dengan
      hitungan per level, filter & paginasi di server
- [ ] Uji dengan API key Gemini asli di produksi (sejauh ini diuji
      dengan server Gemini tiruan)

## Fase 2.5 — Diagnosa & latihan adaptif per siswa

Rancangan lengkap: `docs/AI_GENERATION.md` (Jalur B, urutan kerja §8).
Keputusan: bank dulu → AI menambal; soal AI latihan langsung dipakai
(label "Latihan AI", bukan skor resmi); key Gemini milik siswa.

- [x] Service `diagnose()` (akurasi per subdomain, bobot data terbaru,
      status & prioritas) + unit test — `services/diagnosis.ts`, jendela
      ±20 soal terbaru, min 3 soal; dipakai juga kartu prioritas dashboard
- [x] Halaman `/progres` (peta kemampuan, tren, ringkasan kalimat) &
      `/riwayat` (filter jenjang) — `queries/progress.ts`. Tren per
      subdomain: grafik mini di tiap baris peta + grafik "Tren per
      subdomain" (akurasi per tes/latihan + akurasi berjalan, batas 50/75%,
      pemilih subdomain) — 2026-10-07.
- [x] Tabel `practice_sessions` & `practice_session_items`; latihan
      kelemahan **bank-only** dengan pembahasan langsung per soal —
      `/latihan` (pilih ≤3 subdomain, 5–20 soal), `/latihan/[id]`,
      `/latihan/[id]/hasil` (perubahan diagnosa sebelum → sesudah);
      riwayat latihan di `/riwayat?jenis=latihan`. Migrasi 0010 sudah
      dijalankan ke DB (2026-09-30)
- [x] Tabel `practice_questions` + generate AI saat bank kurang (key
      siswa), label "Latihan AI", batas 10 panggilan / 24 jam —
      `services/practice-ai.ts`; kesulitan & level ikut akurasi siswa
- [x] Laporkan soal (siswa) + antrian laporan (admin) — tombol
      "Laporkan soal" di pembahasan tes & latihan (soal bank maupun
      Latihan AI), `/admin/laporan` dengan badge jumlah di menu

## Fase 3 — Monetisasi

- [x] Payment gateway: **DOKU Checkout, QRIS saja** (redirect, menggantikan
      Midtrans 2026-10-07) — `services/doku.ts` + `doku-core.ts`, webhook
      `/api/doku/notification` (signature HMAC + cek ulang Check Status API)
- [x] Alur checkout → Premium aktif otomatis (`memberships`, bukan
      entitlement per paket): `/langganan` → bayar → webhook →
      `applyDokuStatus` (idempoten, perpanjang masa aktif)
- [x] Halaman riwayat transaksi user (`/langganan`) & admin
      (`/admin/langganan`: paket langganan, anggota, beri/cabut manual)
- [x] Gating: akun gratis = paket `is_premium=false`; Premium = semua paket
      premium jenjangnya + Latihan Kelemahan
- [ ] Uji dengan Sandbox DOKU asli (Client ID/Secret Key user, env) lalu pindah Production
- [ ] Email/WA notifikasi pembayaran (opsional)
- [x] Ganti kata sandi di Pengaturan/Profil (+ "Buat kata sandi" untuk akun Google-only) — 2026-10-02
- [x] Admin: atur ulang kata sandi user (kata sandi sementara tampil sekali, hanya hash disimpan) — 2026-10-07
- [ ] Lupa kata sandi (link reset via email) — butuh SMTP Hostinger diisi di env (WORKFLOW §10)

## Fase 4 — Pengerasan (sebelum ramai dipakai)

- [x] Load test alur pengerjaan tes bersamaan — `npm run loadtest` (2026-10-03;
      150 siswa stres tanpa error, WORKFLOW §11). Belum: uji HTTP ke produksi
- [x] Review index database & query lambat — migrasi 0016 (12 index) + cache
      detail paket + autosave 1 query lebih sedikit (DECISIONS 2026-10-03)
- [x] Manajemen User: filter, tab status, statistik & paginasi (50/hal) di server via query string (2026-10-06)
- [ ] Rencana migrasi ke VPS Hostinger kalau trafik naik
- [ ] Backup otomatis database

## Prinsip urutan kerja

Kerjakan fase secara berurutan. Jangan mulai Fase 2 (AI) sebelum alur
pengerjaan tes & skor di Fase 1 benar-benar teruji — fitur AI tidak ada
gunanya kalau alur ujian intinya belum solid.
