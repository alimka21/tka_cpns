# Generate Soal AI & Latihan Adaptif — Web Tes Premium

Rancangan (belum diimplementasi) untuk dua hal yang saling terkait:

- **Jalur A — Admin mengisi bank soal dengan AI** → review → tayang
  (SRS §7, ROADMAP Fase 2).
- **Jalur B — Latihan adaptif per siswa**: setelah tes, sistem tahu
  subdomain mana yang lemah, lalu membuat sesi latihan *hanya* untuk
  subdomain itu. Soal diambil dari bank dulu; kalau kurang, AI membuat
  soal tambahan khusus siswa itu. Riwayat & progres kemampuan per
  subdomain bisa dibaca siswa dengan mudah (ROADMAP Fase 2.5).

Keputusan dasar (2026-09-29, lihat `DECISIONS.md`):

| Topik | Keputusan |
|---|---|
| Sumber soal latihan | **Bank dulu**, AI hanya menambal kekurangan |
| Review soal AI latihan | **Langsung dipakai**, divalidasi otomatis, label "Latihan AI", tidak masuk bank resmi & tidak dihitung ke skor tes resmi, siswa bisa melapor |
| API key Gemini | **Milik siswa sendiri** (Pengaturan). Tanpa key → latihan tetap jalan, tapi hanya dari bank |

Yang **tidak** berubah: soal AI yang dibuat admin untuk bank resmi tetap
wajib review (`pending_review` → `published`). Tes resmi (paket tes)
tetap hanya memakai soal bank yang sudah tayang.

---

## 0. Status implementasi (2026-09-30)

- **Jalur A selesai** — `/admin/soal/generate-ai` dengan 3 mode: soal
  baru, **variasi soal bank** (modifikasi: ganti angka / konteks / lebih
  sulit / lebih mudah / campuran), dan **dari gambar** (galeri
  `/admin/soal/gambar`, satu gambar → beberapa soal). Kode:
  `services/gemini.ts` (REST), `services/ai-questions.ts` (validasi),
  `services/ai-generate.ts` (alur + retry + log),
  `asesmen/generation-context.ts` (`buildAiPrompt`).
- Key: `/pengaturan` (`services/ai-key.ts`, `crypto.ts`).
- Mode **grup** (1 bacaan + N soal, bentuk campuran) — admin; bisa
  **multi-subtopik** dalam mata uji yang sama (tiap soal `subtopicCode`).
- **Jalur B selesai**: Latihan AI saat bank kurang
  (`services/practice-ai.ts`), Laporkan soal + `/admin/laporan`
  (`services/question-reports.ts`). Model default `gemini-3-flash-preview`.

## 1. Fondasi yang sudah ada

- `src/server/asesmen/generation-context.ts` — `buildGenerationContext()`
  merakit prompt dari kerangka asesmen: posisi subdomain, kompetensi,
  **cakupan (wajib di dalam)**, **batasan (dilarang keluar)**, level
  kognitif + proses berpikir, karakteristik teks mata uji. Saat ini hanya
  bentuk PG tunggal.
- `attempt_subtopic_scores` — ringkasan benar/total per subdomain tiap
  percobaan tes (bahan diagnosa).
- `user_ai_settings` — tabel key terenkripsi (belum dipakai).
- `scoring.ts`, `answerResponse`, `questionInput` — aturan skor & validasi
  3 bentuk soal dipakai ulang apa adanya untuk soal latihan.
- `src/server/services/ai-generate.ts` & `crypto.ts` — **masih kosong**.

## 2. API key siswa

- Halaman **Pengaturan**: simpan / ganti / hapus key Gemini. Ditampilkan
  hanya versi tersamar (`AIza…ab12`, kolom `gemini_key_masked`).
- Enkripsi AES-256-GCM di `crypto.ts` dengan `ENCRYPTION_SECRET` (env
  server). Key didekripsi **hanya** di server saat memanggil Gemini, tidak
  pernah dikirim ke browser, tidak pernah ditulis ke log.
- Saat menyimpan, lakukan panggilan uji kecil ke Gemini → tolak key yang
  tidak valid dengan pesan jelas.
- Siswa SD/SMP umumnya belum punya key → UI harus tetap berguna tanpa key
  (latihan dari bank) dan memberi panduan singkat cara membuat key.
- Nama model Gemini dari env `GEMINI_MODEL` (default varian yang murah &
  cepat), bukan di-hardcode.

## 3. Kontrak output AI

- Prompt meminta **JSON saja** dengan skema per bentuk:
  `{ questions: [{ type, questionText, options[], key, categoryLabels?,
  explanation, cognitiveLevel? }] }` — satu skema Zod `aiQuestionOutput`
  yang lalu dipetakan ke `questionInput`.
- `buildGenerationContext` diperluas: parameter `form`
  (`pg`|`pgk_mcma`|`pgk_kategori`) + contoh JSON per bentuk di prompt
  (ROADMAP 1.5e).
- Validasi otomatis (wajib lolos semua, per soal):
  1. Zod `questionInput` (jumlah opsi, jumlah kunci, kategori sah).
  2. Opsi tidak ganda, tidak kosong, panjang wajar; KaTeX bisa dirender
     (`renderMathToHtml` tanpa error).
  3. Subdomain & level kognitif sesuai permintaan (bukan dari AI).
  4. Tidak identik dengan soal bank / soal latihan siswa itu sebelumnya
     (normalisasi teks + hash).
- Soal yang gagal dibuang; kalau hasil valid < diminta, **retry sekali**
  untuk kekurangannya saja. Masih kurang → pakai yang ada, sesi tetap
  jalan.
- Timeout per panggilan (mis. 30 detik); error key/kuota Gemini → sesi
  jatuh ke mode bank-only dengan pesan "AI sedang tidak tersedia".

## 4. Diagnosa kelemahan

Satuan diagnosa = **subdomain** (sama dengan analisis hasil tes).

- **Akurasi per subdomain** = benar / total dari soal yang pernah
  dikerjakan siswa di subdomain itu, dengan **bobot lebih besar untuk
  yang terbaru** (mis. hanya 20 soal terakhir per subdomain), supaya
  kemajuan cepat terlihat.
- **Status** (selaras `scoreTone`, `docs/UI_UX.md` §3):
  `Belum diuji` · `Perlu latihan` (<50%) · `Cukup` (50–74%) ·
  `Baik` (≥75%). Status butuh minimal 3 soal; di bawah itu tampil
  "data belum cukup".
- **Sumber data**: tes resmi **dan** latihan dihitung, tetapi di UI
  keduanya bisa dipisah (filter) karena latihan AI tidak direview.
- **Prioritas latihan**: urutkan subdomain berstatus Perlu latihan/Cukup
  dari akurasi terendah; seri → yang soalnya lebih banyak diujikan.
- Implementasi: service murni `diagnose(history)` (bisa dites tanpa DB)
  + query yang mengambil riwayat jawaban per subdomain.

## 5. Alur latihan adaptif

1. Siswa membuka **"Latihan Kelemahan"** (dari dashboard, kartu subdomain
   terlemah, atau halaman hasil tes).
2. Sistem mengusulkan **1–3 subdomain prioritas** (siswa boleh mengganti
   pilihan) dan jumlah soal (default 10).
3. Susun soal per subdomain:
   - Ambil soal **bank tayang** di subdomain itu yang **belum pernah**
     dikerjakan siswa; lalu yang paling lama tidak dikerjakan.
   - Kekurangan → generate AI (kalau siswa punya key), tingkat kesulitan
     menyesuaikan akurasi: <50% → mudah/sedang, 50–74% → sedang/sulit.
   - Soal grup stimulus di bank tetap diambil utuh (aturan paket).
4. Mode latihan **tanpa timer wajib** (opsional hitung waktu), dan setiap
   soal langsung menampilkan **benar/salah + pembahasan** setelah
   dijawab — tujuannya belajar, bukan ujian.
5. Selesai sesi → ringkasan: skor, per subdomain, perubahan status
   ("Pecahan: Perlu latihan 38% → Cukup 55%").
6. Soal berlabel **"Latihan AI"** punya tombol **"Laporkan soal"**
   (kunci salah / ambigu / di luar materi). Soal yang dilaporkan
   disembunyikan dari siswa itu dan masuk antrian admin.

## 6. Riwayat & progres (mudah dibaca siswa)

- **/progres** — peta kemampuan: per mata uji → domain → subdomain
  dengan chip status & persentase; tren akurasi per subdomain (garis);
  ringkasan kalimat biasa, mis. *"Kamu kuat di Bilangan Real (82%).
  Perlu latihan di Pecahan (38%) — naik 17 poin sejak 2 minggu lalu."*
- **/riwayat** — semua tes resmi & sesi latihan, bisa difilter
  (tes / latihan / mata uji), masing-masing membuka hasilnya.
- **/latihan/[sessionId]/hasil** — ringkasan sesi + pembahasan per soal.
- Semua grafik mengikuti aturan chart di `docs/UI_UX.md` §3 dan tetap
  punya tampilan tabel/teks (tidak hanya warna).

## 7. Model data (rencana — tambahkan ke `docs/DATABASE.md` saat dibangun)

**practice_questions** — soal AI privat milik satu siswa (bukan bank)
- id, owner_user_id (fk), subtopic_id (fk), type, question_text,
  category_labels (JSON), options (JSON: label, text, is_correct,
  correct_category), explanation_text, difficulty, cognitive_level,
  model, prompt_hash, content_hash (dedup), reported_at, report_reason,
  created_at
- Kunci jawaban hanya di server — sama seperti `question_options`.

**practice_sessions**
- id, user_id (fk), target_subtopic_ids (JSON), question_count,
  status (`in_progress`|`completed`|`abandoned`), started_at,
  completed_at, total_score, max_score

**practice_session_items**
- id, session_id (fk), order, question_id (fk nullable — soal bank),
  practice_question_id (fk nullable — soal AI; tepat satu dari keduanya
  terisi), response (JSON `answerResponse`), is_correct, answered_at

**ai_generation_logs** — audit & pembatasan
- id, user_id (fk), purpose (`bank_admin`|`practice`), subtopic_code,
  requested, valid_count, model, error (nullable), duration_ms,
  created_at — **tanpa** isi key.

Batas pemakaian per siswa (mis. maks 5 panggilan generate/hari) walau
key milik siswa — melindungi kuota mereka dari klik berulang.

## 8. Urutan kerja (ROADMAP Fase 2 & 2.5)

1. **Key & client Gemini**: `crypto.ts`, halaman Pengaturan, client
   Gemini + timeout + log (tanpa key).
2. **Kontrak output**: `buildGenerationContext` per bentuk (1.5e), Zod
   `aiQuestionOutput`, validasi & dedup, retry sekali. Unit test dengan
   output AI palsu (tanpa memanggil Gemini).
3. **Jalur A (admin)**: halaman Generate AI → hasil `pending_review` →
   antrian review (approve/edit/reject).
4. **Diagnosa**: service `diagnose()` + test, lalu **/progres** &
   **/riwayat** (tidak butuh AI sama sekali — bisa dirilis duluan).
5. **Latihan adaptif bank-only**: tabel sesi, pemilihan soal, mode
   latihan dengan pembahasan langsung, ringkasan sesi.
6. **Tambal dengan AI**: `practice_questions`, generate saat bank kurang,
   label "Latihan AI", batas harian.
7. **Laporkan soal**: tombol siswa + antrian admin.

Langkah 4–5 memberi nilai terbesar (diagnosa & latihan terarah) tanpa
bergantung pada siswa punya key; AI (langkah 6) menambah variasi.

## 9. Risiko & catatan

- **Kualitas soal AI tanpa review** — dimitigasi validasi otomatis,
  label jelas, laporan siswa, dan tidak masuk skor/tes resmi. Tetap bisa
  ada kunci yang salah; jangan pernah dipakai untuk penilaian resmi.
- **Sebagian besar siswa tanpa key** — jangan desain fitur yang hanya
  berguna dengan AI; bank tetap sumber utama. Pertimbangkan ulang opsi
  "key admin dengan kuota" bila terbukti banyak siswa tanpa key.
- **Hak cipta** — prompt melarang menyalin soal resmi yang dipublikasi
  (sudah ada di `generation-context.ts`).
- **Biaya & privasi** — data siswa yang dikirim ke Gemini hanya konteks
  kerangka & tingkat kesulitan; tidak ada nama/email siswa di prompt.

## 10. Impor PDF (admin, `/admin/soal/import-pdf`)

- Alur: admin pilih mapel + unggah PDF (maks. 40 halaman, 30 MB) → **browser** merender tiap halaman jadi JPEG (pdf.js, lebar 1240 px) → `extractPdfAction` mengirim semua halaman ke Gemini (key milik admin, `maxOutputTokens` 65.536, timeout 300 dtk) → draf bacaan & soal dipratinjau → admin pilih soal → potongan gambar diunggah ke galeri satu per satu → `savePdfImportAction` memvalidasi ULANG lalu menyimpan sebagai `pending_review` (+ opsional paket draf, durasi dari aturan paket).
- Prompt (`buildPdfImportPrompt`): salin apa adanya, rumus KaTeX, tabel jadi baris teks, bacaan bersama → `stimuli`, gambar → `box_2d` [ymin,xmin,ymax,xmax] 0–1000 per halaman, pasangan kategori di luar Benar/Salah · Sesuai/Tidak Sesuai · Ya/Tidak diubah ke Ya/Tidak, kunci dari dokumen (`keyFromDocument`) atau dikerjakan Gemini.
- Pemetaan (`mapPdfExtraction`, murni & dites): soal rusak tetap tampil dengan `errors` (tidak bisa disimpan); rujukan bacaan hilang → soal tunggal; bacaan tak terpakai dibuang.
- Gambar dipotong di browser dari render 2400 px; admin bisa mematikan potongan yang meleset lalu unggah manual saat edit soal. Server tidak butuh pustaka PDF native (aman untuk Hostinger).
- Biaya: token Gemini milik admin, bukan Claude. Belum dicatat di `ai_generation_logs` (enum `mode` belum punya nilai `pdf`).

## 11. Buat paket otomatis (admin, `/admin/paket-tes/otomatis`)

- Pilih jenjang + mapel → `buildAutoPackagePreview`: soal mapel itu berstatus `published`/`pending_review` yang **belum masuk paket mana pun**; grup stimulus hanya dipakai bila semua anggotanya tersedia.
- `planAutoPackage` (murni, dites): (1) blok yang menambah topik/subtopik baru terbanyak per soal, (2) isi sisa kuota mengarahkan PG ke ±55% & menyebar subtopik, tanpa pernah melewati batas PG 50–60%; (3) kekurangan → slot AI: subtopik belum terwakili dulu, bentuk soal dibagi berurutan per subtopik (sedikit batch), MCMA & Kategori diimbangkan.
- Tiap batch (subtopik × bentuk, maks. 10 soal) = satu panggilan `generateAiQuestions`: mode `variasi` dari soal tunggal **tanpa gambar** di subtopik itu (acak, bentuk sama diutamakan), selain itu mode `baru`. Client menjalankan 2 batch bersamaan dengan progres; batch gagal bisa diulang, atau paket dibuat dari soal yang ada.
- Kualitas (2026-10-03): tiap slot AI diberi tingkat 1/2/3 (mudah·L1 / sedang·L2 / sulit·L3) yang menutup kekurangan sebaran paket terhadap target 20/50/30 (soal bank dihitung lewat level kognitif, atau kesulitan untuk mapel bahasa). Batch = subtopik × bentuk × tingkat. Mapel ber-level selalu mengirim `cognitiveLevel` (sebelumnya `null` → Gemini menolak batch Matematika). Variasi diarahkan: soal asal lebih mudah dari target → gaya `lebih_sulit`, sebaliknya `lebih_mudah`. Prompt semua mode memuat `DIFFICULTY_GUIDE` (ciri mudah/sedang/sulit).
- Perbaikan 2026-10-06 (temuan paket #35 Bahasa Indonesia SMA: 10 soal merujuk "teks tersebut" yang tidak ada, 0 berbasis stimulus, bentuk/tingkat berblok, nama "Aris" di 7 soal, 3× HTTP 503):
  - **Grup bacaan:** mapel literasi membaca (subject punya `aspek_keterampilan_membaca`) → semua slot AI jadi grup; SMA lain → ±50% slot dari topik dengan slot terbanyak. Grup = slot berurutan dalam satu topik, 3–5 soal (`chunkGroups`), satu panggilan mode `grup` (AI menulis bacaan baru, lintas subtopik).
  - **Sebaran:** bentuk soal & tingkat disebar merata (`spread`), tingkat dibagi sebanding kekurangan terhadap 20/50/30. Soal tunggal digabung per subtopik (bentuk & tingkat campur dalam satu panggilan).
  - **Rencana per soal (`plan`):** prompt mendaftar bentuk/subtopik/tingkat tiap soal; `fillPlan` hanya menerima soal yang cocok bentuk+subtopik dan memberi tingkat dari slot; sisa slot diminta ulang sekali.
  - **Soal berdiri sendiri:** prompt mode baru/variasi mewajibkan bacaan ditulis di soal itu; validator `refersToMissingText` menolak "teks/data tersebut", "paragraf kedua" tanpa isi sebelumnya, atau "… berikut" tanpa isi sesudahnya.
  - **Variasi konteks:** tiap batch mendapat tema & nama tokoh berbeda (acak per rencana) karena batch berjalan paralel.
  - **Gemini sibuk:** `generateJson` mencoba ulang 429/5xx dua kali (jeda 3 s, 10 s); client 2 batch paralel (sebelumnya 3).
  - Paket disusun per subtopik dengan grup (bank maupun AI) utuh & berurutan, divalidasi `validatePackageOrder`.
- `createAutoPackage` memvalidasi ulang (soal masih belum terpakai, grup utuh, soal AI milik admin itu) → paket **draf** (durasi dari aturan). Soal AI `pending_review`; terbitkan lewat tombol Terbitkan paket (bisa sekaligus soalnya).

