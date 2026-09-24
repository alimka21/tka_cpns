# Skema Database (rencana) — Web Tes Premium

Ditulis sebagai referensi kolom, bukan SQL/Drizzle final. Saat implementasi,
buat file Drizzle di `src/server/db/schema/` per grup di bawah ini, lalu
generate migrasi — jangan tulis ulang dokumen ini kecuali skema berubah.

## Grup: Users & Auth

**users**
- id (pk), name, email (unique), password_hash, role (`student`|`admin`),
  created_at

**user_ai_settings**
- id (pk), user_id (fk users), gemini_api_key_encrypted, gemini_key_masked
  (mis. `AIza...ab12`, untuk ditampilkan di UI), updated_at

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
- id, subtopic_id (fk), type (`single_choice`; tipe lain menyusul kalau
  perlu), question_text, image_url (nullable), difficulty
  (`easy`|`medium`|`hard`), cognitive_level (nullable, `L1`–`L3` sesuai
  mata uji; null untuk mata uji bahasa), status (`draft`|`pending_review`|`published`),
  generated_by (`manual`|`ai`|`import`), source_user_id (nullable, siapa
  yang generate/import), created_by, reviewed_by (nullable), reviewed_at
  (nullable), created_at

**question_options**
- id, question_id (fk), label (A/B/C/D/E), option_text, is_correct
  (bool, default false), order

**question_explanations**
- id, question_id (fk, 1:1), explanation_text

## Grup: Paket Tes

**test_packages**
- id, title, description, category_id (fk), duration_minutes,
  is_premium (bool),
  status (`draft`|`published`), created_by, created_at

**test_package_questions**
- id, test_package_id (fk), question_id (fk), order, points_override
  (nullable, override skor default kalau perlu)

*(Kalau nanti butuh "acak N soal dari subtopik X" otomatis saat attempt
dimulai, tambahkan tabel `test_package_rules` — belum perlu di fase 1
kalau susunan soal dipilih manual oleh admin.)*

## Grup: Akses / Entitlement (tanpa payment dulu)

**entitlements**
- id, user_id (fk), test_package_id (fk), granted_by (`admin_manual` di
  fase ini; nanti bisa `purchase`), granted_at

> Fase 1: baris ini diisi manual oleh admin lewat panel admin sederhana.
> Struktur ini sengaja sudah menyerupai "hasil dari pembelian" supaya nanti
> saat payment gateway masuk, tinggal insert ke tabel yang sama.

## Grup: Attempt (pengerjaan)

**attempts**
- id, user_id (fk), test_package_id (fk), started_at, ends_at,
  submitted_at (nullable), status (`in_progress`|`submitted`|`expired`),
  total_score (nullable, diisi saat finalize)

**attempt_answers**
- id, attempt_id (fk), question_id (fk), selected_option_id (nullable),
  is_flagged (bool, "ragu-ragu"), answered_at
- unique constraint: (attempt_id, question_id)

**attempt_subtopic_scores** (tabel ringkasan, diisi saat finalize)
- id, attempt_id (fk), subtopic_id (fk), correct_count, total_count,
  score, percentage

## Enum penting

- Aturan skor (satu-satunya): benar = +1 atau `points_override`,
  salah/kosong = 0.
- `question.status`: `draft` → `pending_review` (khusus asal AI) →
  `published`. Soal manual boleh langsung `published` kalau admin yakin.

## Index yang wajib ada sejak awal

- `questions(subtopic_id)`
- `attempt_answers(attempt_id)`
- `attempt_answers(attempt_id, question_id)` unique
- `attempt_subtopic_scores(attempt_id)`
- `test_package_questions(test_package_id)`
- `entitlements(user_id, test_package_id)` unique
