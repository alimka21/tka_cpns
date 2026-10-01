# Skema Database (rencana) — Web Tes Premium

Ditulis sebagai referensi kolom, bukan SQL/Drizzle final. Saat implementasi,
buat file Drizzle di `src/server/db/schema/` per grup di bawah ini, lalu
generate migrasi — jangan tulis ulang dokumen ini kecuali skema berubah.

## Grup: Users & Auth

**users** (Better Auth, id INT serial)
- id (pk), name, email (unique), email_verified, image (nullable),
  role (`student`|`admin`, tidak bisa diisi dari form daftar),
  created_at, updated_at

**sessions** — id, user_id (fk cascade), token (unique), expires_at,
ip_address, user_agent, created_at, updated_at

**accounts** — id, user_id (fk cascade), account_id, provider_id
(`credential` untuk email/password), password (hash scrypt), token OAuth
(nullable), created_at, updated_at

**verifications** — id, identifier, value, expires_at, created_at,
updated_at

**users** (tambahan 2026-10-01, migrasi 0013)
- `jenjang` enum(`SD`,`SMP`,`SMA`) nullable — dipilih saat daftar (wajib di
  form), NULL = akun lama → diminta memilih di `/pilih-jenjang`. Menyaring
  paket tes (`listPackagesForStudent`), menolak paket jenjang lain
  (`startOrResumeAttempt`), dan pilihan Latihan.
- `status` enum(`active`,`pending`,`rejected`) default `active` — `pending`
  bila pengaturan `registration.requireApproval` aktif saat daftar
  (Better Auth `databaseHooks.user.create.before`).

**app_settings** — key (pk, varchar 64), value (JSON), updated_by, updated_at.
Daftar key + default + skema Zod di `services/app-settings.ts`
(`registration.requireApproval`: boolean, default false).

**user_ai_settings**
- id (pk), user_id (fk users, **unique**, cascade), gemini_api_key_encrypted
  (`v1.<iv>.<tag>.<data>`, AES-256-GCM dari `ENCRYPTION_SECRET`),
  gemini_key_masked (mis. `AIza…ab12`, untuk UI), updated_at

> **Server produksi: MariaDB 11.8 (Hostinger).** Kolom `json` di MariaDB
> disimpan sebagai `longtext` — mysql2 mengembalikannya sebagai string,
> jadi `JSON.parse` (mis. lewat custom type Drizzle) saat membaca
> `questions.category_labels` dan `attempt_answers.response`.

## Grup: Konten

Hierarki = kerangka asesmen TKA resmi (`asesmen/tka-*.json`, loader di
`src/server/asesmen/`). Diisi lewat `npm run db:seed:asesmen` (upsert by
`code`, idempoten), **bukan** input manual. Cakupan/batasan/level kognitif
tidak disalin ke DB — dibaca dari file kerangka berdasarkan `code`.

**categories** (jenjang) — `id, code` (`SD`|`SMP`|`SMA`, unique)`, name`

**subjects** (mata uji)
- id, category_id (fk), code (unique, mis. `SMP-MTK`), name, full_name,
  type (`wajib`|`pilihan`), structure (`kompetensi_subkompetensi`|
  `elemen_subelemen`), order

**topics** (= domain / kompetensi / elemen)
- id, subject_id (fk), code (unique, mis. `SMP-MTK-D1`), name,
  description (nullable), order

**subtopics** (= subdomain — **unit analisis kelemahan**)
- id, topic_id (fk), code (unique, mis. `SMP-MTK-D1-S1`), name
  (varchar 512 — nama terpanjang di regulasi 284 karakter), order

**questions**
- id, subtopic_id (fk), type (`pg`|`pgk_mcma`|`pgk_kategori` — bentuk
  soal kerangka TKA), category_labels (JSON nullable, hanya
  `pgk_kategori`: `["Benar","Salah"]` atau `["Sesuai","Tidak Sesuai"]`),
  stimulus_id (fk nullable) + stimulus_order (nullable) — terisi = soal
  grup, question_text, image_url (nullable), difficulty
  (`easy`|`medium`|`hard`), cognitive_level (nullable, `L1`–`L3` sesuai
  mata uji; null untuk mata uji bahasa), status (`draft`|`pending_review`|`published`),
  generated_by (`manual`|`ai`|`import`), source_user_id (nullable, siapa
  yang generate/import), created_by, reviewed_by (nullable), reviewed_at
  (nullable), created_at

**question_options**
- id, question_id (fk), label (A/B/C/D/E), option_text, is_correct
  (bool, default false — kunci untuk `pg`/`pgk_mcma`), correct_category
  (nullable — kunci per pernyataan untuk `pgk_kategori`), order
- Aturan per bentuk: `pg` 4–5 opsi, tepat 1 kunci; `pgk_mcma` 4–5 opsi,
  1 s.d. (jumlah opsi − 1) kunci; `pgk_kategori` 3–5 pernyataan, semua
  punya `correct_category` dari `category_labels`. (Zod `questionInput`.)

**stimuli** (stimulus bersama soal grup)
- id, code (unique), title, content (teks/KaTeX), image_url (nullable),
  status (`draft`|`published`), created_by, created_at
- Satu stimulus boleh dipakai soal dari subdomain berbeda; analisis
  kelemahan tetap per subdomain soal.

**question_explanations**
- id, question_id (fk, 1:1), explanation_text

## Grup: Paket Tes — **implementasi selesai** (`src/server/db/schema/packages.ts`)

**test_packages**
- id, title, description, category_id (fk), duration_minutes,
  is_premium (bool),
  status (`draft`|`published`), created_by, created_at

**test_package_questions**
- id, test_package_id (fk, cascade), question_id (fk), order,
  points_override (nullable, override skor default kalau perlu)
- unique (test_package_id, question_id)

Susunan soal grup stimulus wajib utuh & berdampingan berurutan
(`src/server/services/package-composition.ts`, dicek ulang di server
lewat `validatePackageOrder` saat simpan/terbitkan — jangan percaya
urutan dari client). UI: `/admin/paket-tes` (daftar), `/admin/paket-tes/baru`
& `/admin/paket-tes/[id]` (form + `PackageForm`).

*(Kalau nanti butuh "acak N soal dari subtopik X" otomatis saat attempt
dimulai, tambahkan tabel `test_package_rules` — belum perlu di fase 1
kalau susunan soal dipilih manual oleh admin.)*

## Grup: Akses / Entitlement (tanpa payment dulu) — **implementasi selesai**

**entitlements**
- id, user_id (fk, cascade), test_package_id (fk, cascade), granted_by
  (`admin_manual` di fase ini; nanti bisa `purchase`), granted_by_user_id
  (fk nullable, admin yang memberi akses), granted_at
- unique (user_id, test_package_id)

Diatur **per paket**, bukan toggle global per user — lihat panel "Akses
Premium" di halaman edit paket (`/admin/paket-tes/[id]`, hanya tampil
kalau paket premium). Cari user via `searchUsersAction`, beri/cabut akses
via `setEntitlementAction`. Manajemen User hanya menampilkan ringkasan
("N paket") dan tautan ke sana — lihat DECISIONS 2026-09-29.

## Grup: Attempt (pengerjaan) — **implementasi selesai**
(`src/server/db/schema/attempts.ts`, alur di `src/server/services/attempts.ts`)

**attempts**
- id, user_id (fk, cascade), test_package_id (fk), started_at, ends_at,
  submitted_at (nullable), status (`in_progress`|`submitted`|`expired`),
  total_score (nullable), max_score (nullable) — keduanya diisi saat
  finalize; skor 0–100 yang ditampilkan = `round(total_score/max_score*100)`

**attempt_answers**
- id, attempt_id (fk, cascade), question_id, response (JSON nullable —
  Zod `answerResponse`: `{type:"pg",optionId}` |
  `{type:"pgk_mcma",optionIds}` |
  `{type:"pgk_kategori",answers:[{optionId,category}]}`),
  is_flagged (bool, "ragu-ragu"), answered_at
- unique constraint: (attempt_id, question_id) — dipakai untuk upsert
  autosave (`onDuplicateKeyUpdate`)

**attempt_subtopic_scores** (tabel ringkasan, diisi saat finalize)
- id, attempt_id (fk, cascade), subtopic_id (fk), correct_count,
  total_count, score, percentage (`decimal(5,2)`)
- unique (attempt_id, subtopic_id) — finalize idempoten (delete+insert ulang)

**Alur finalize** (`finalizeAttempt`, dipanggil dari submit siswa & dari
auto-expire): baca semua `attempt_answers` → `scoreAttempt()` →
`summarizeBySubtopic()` → simpan `total_score`/`max_score` di `attempts`
+ tulis ulang `attempt_subtopic_scores`, dalam satu transaksi. Halaman
hasil (`getAttemptResult`) **tidak** membaca `correct`/`wrong`/`blank`
dari kolom tersimpan (tidak ada kolomnya) — dihitung ulang dari
`attempt_answers` lewat `scoreAttempt()` yang sama, supaya selalu
konsisten dengan logika skor terbaru.

**Mulai/lanjutkan attempt** (`startOrResumeAttempt`): attempt
`in_progress` yang belum habis waktunya dilanjutkan (resume, jawaban
tersimpan dimuat ulang); yang sudah lewat `ends_at` tapi belum pernah
di-submit (tab ditutup) di-finalize otomatis sebagai `expired` sebelum
attempt baru dibuat — jawaban yang sempat ter-autosave tetap dinilai.

## Grup: Latihan Kelemahan — **implementasi selesai (bank-only)**
(`src/server/db/schema/practice.ts`, migrasi `0010_latihan_kelemahan`,
alur di `src/server/services/practice.ts`)

**practice_sessions**
- id, user_id (fk, cascade), target_subtopic_ids (JSON `number[]`),
  question_count, status (`in_progress`|`completed`|`abandoned`),
  started_at, completed_at, total_score (= benar), max_score (= soal
  yang dijawab) — keduanya diisi saat selesai
- Satu sesi `in_progress` per siswa: memulai sesi baru menandai yang lama
  `abandoned`. Selesai tanpa satu pun jawaban → `abandoned`.

**practice_session_items**
- id, session_id (fk, cascade), order, question_id (fk soal bank),
  response (JSON `answerResponse`, nullable), is_correct, answered_at
- unique (session_id, order) & (session_id, question_id)
- Sekali dijawab tidak bisa diubah (update `WHERE answered_at IS NULL`);
  kunci + pembahasan baru dikirim ke client setelah soal itu dijawab.
- `question_id` (soal bank) **atau** `practice_question_id` (soal Latihan
  AI) — tepat satu terisi. FK kedua bernama pendek `psi_practice_question_fk`
  (nama otomatis Drizzle 68 karakter ditolak MariaDB, maks 64).

**practice_questions** — soal Latihan AI privat milik satu siswa
- id, owner_user_id (fk, cascade), subtopic_id, type, question_text,
  category_labels (JSON), options (JSON `{label,text,isCorrect,correctCategory}[]`,
  id opsi = urutan 1..n), explanation, difficulty, cognitive_level, model,
  created_at. Tidak masuk bank & tes resmi; di UI id soalnya negatif.

**question_reports** — laporan soal dari siswa
- id, user_id (fk, cascade), question_id **atau** practice_question_id
  (fk, cascade), reason (`kunci_salah`|`soal_ambigu`|`di_luar_materi`|
  `salah_ketik`|`lainnya`), note, status (`open`|`resolved`), resolved_by,
  resolved_at, created_at. Unique (user, soal) — lapor ulang = update.

**Diagnosa** (`loadDiagnosisRecords`): ringkasan per attempt tes resmi
(`attempt_subtopic_scores`) + per sesi latihan (item terjawab,
dikelompokkan per subdomain) → `diagnose()`. Latihan **tidak** mengubah
skor tes resmi.

## Grup: AI & media soal — **implementasi selesai** (`schema/ai.ts`, migrasi 0011)

**question_images** — galeri gambar soal, disimpan di DB (bukan disk)
- id, title, mime (`image/webp`), width, height, size_bytes, sha256
  (unique — unggahan identik tidak dobel), data (MEDIUMBLOB), uploaded_by
  (fk users), created_at
- Dirujuk soal lewat `questions.image_url = "/gambar/<id>"` (tanpa FK);
  gambar yang masih dirujuk soal tidak bisa dihapus.

**ai_generation_logs** — audit panggilan Gemini (tanpa isi key)
- id, user_id (fk, cascade), purpose (`bank_admin`|`practice`), mode
  (`baru`|`variasi`|`gambar`), subtopic_code, source_question_id,
  image_id, requested, valid_count, model, error, duration_ms, created_at

**questions.source_question_id** (baru) — soal AI mode variasi: id soal
asal (tanpa FK; soal asal boleh dihapus).

## Enum penting

- Aturan skor (satu-satunya, semua bentuk): benar penuh = +1 atau
  `points_override`, selain itu 0 — **tidak ada skor parsial**.
  `pg`: opsi = kunci. `pgk_mcma`: himpunan pilihan persis sama dengan
  himpunan kunci. `pgk_kategori`: semua pernyataan dijawab & sesuai kunci
  (baru sebagian = `partial`, dihitung dijawab tapi 0). Implementasi:
  `src/server/services/scoring.ts`.
- `question.status`: `draft` → `pending_review` (khusus asal AI) →
  `published`. Soal manual boleh langsung `published` kalau admin yakin.

## Index yang wajib ada sejak awal

- `questions(subtopic_id)`
- `questions(stimulus_id)` (otomatis dari FK)
- `attempt_answers(attempt_id)`
- `attempt_answers(attempt_id, question_id)` unique
- `attempt_subtopic_scores(attempt_id)`
- `attempt_subtopic_scores(attempt_id, subtopic_id)` unique
- `test_package_questions(test_package_id)`
- `test_package_questions(test_package_id, question_id)` unique
- `entitlements(user_id, test_package_id)` unique

Semua index di atas sudah dibuat oleh migrasi `0009_paket_tes_attempt`
(dijalankan ke DB Hostinger 2026-09-29) — bagian ini tinggal referensi,
bukan lagi rencana.
