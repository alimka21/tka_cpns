# Arsitektur — Web Tes Premium

## 1. Stack

| Lapisan | Pilihan |
|---|---|
| Framework | Next.js 15 (App Router), TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | MySQL (Hostinger) |
| ORM | Drizzle ORM + Drizzle Kit (migrasi) |
| Auth | Better Auth (session cookie, role di tabel user) |
| Validasi | Zod di semua Server Action / Route Handler |
| Rumus | KaTeX (react-katex) |
| Import Excel | exceljs (server-side parsing) |
| Grafik | Recharts |
| AI | @google/genai, dipanggil server-side dengan API key milik user |
| Deploy | Hostinger Node.js hosting, dari GitHub (auto-deploy per push ke `main`) |
| Package manager | npm |
| Node | 22.x (LTS, sesuai dukungan Hostinger) |

## 2. Struktur folder (rencana)

```
src/
  app/
    (public)/                # landing, login, register
    (student)/
      dashboard/
      tes/[packageId]/       # halaman pengerjaan tes
      hasil/[attemptId]/     # hasil + analisis subtopik
      pengaturan/            # simpan Gemini API key milik user
    (admin)/
      admin/topik/
      admin/soal/
      admin/soal/import/
      admin/soal/generate-ai/
      admin/paket-tes/
    api/                     # route handlers kalau perlu (webhook dll, minim)
  server/
    db/
      schema/                # skema Drizzle per domain (users, content, tests, attempts)
      index.ts
    actions/                 # Server Actions, dikelompokkan per domain
    services/
      scoring.ts             # logika skor (standar, TWK/TIU, TKP)
      analytics.ts           # agregasi skor per topik/subtopik
      ai-generate.ts         # panggil Gemini, parse & validasi output (Zod)
      crypto.ts              # enkripsi/dekripsi API key user
    auth/
  components/
    ui/                      # shadcn
    tes/                     # komponen timer, navigasi soal, dsb
    analytics/                # chart radar/bar
  lib/
    validation/               # skema Zod bersama
docs/
```

Alasan struktur ini: domain (`content`, `tests`, `attempts`, `ai`) dipisah
jelas supaya waktu Claude Code diminta ubah satu fitur, dia hanya perlu
baca 1–2 folder, bukan seluruh `src/`.

## 3. Alur kunci

### 3.1 Pengerjaan tes (timer & autosave)

1. User klik "Mulai" → Server Action buat baris `attempts` dengan
   `started_at = now()`, `ends_at = now() + duration`.
2. Client polling/menghitung mundur dari `ends_at` yang diterima dari
   server (bukan menghitung dari nol di client) — kalau refresh, timer
   tetap benar.
3. Tiap user memilih jawaban → Server Action kecil menyimpan ke tabel
   `attempt_answers` (upsert per `attempt_id + question_id`). Debounce
   ringan di client (mis. 300–500ms) supaya tidak spam request.
4. Saat `ends_at` lewat atau user klik submit → Server Action `finalize`:
   kunci attempt (`submitted_at`), hitung skor di server, larang edit
   lagi.
5. Halaman hasil hanya boleh diakses setelah `submitted_at` terisi.

### 3.2 Analisis subtopik

- Saat `finalize`, hitung skor per soal, lalu agregasi
  `SUM(skor) GROUP BY subtopik` disimpan ke tabel ringkasan
  `attempt_subtopic_scores` (bukan dihitung ulang tiap kali halaman
  hasil dibuka) — lebih cepat dan hemat query.
- Halaman hasil membaca tabel ringkasan ini, plus riwayat attempt lain
  di subtopik yang sama untuk melihat tren (membaik/menurun).

### 3.3 Generate soal via Gemini (API key milik user)

1. User buka Pengaturan → masukkan Gemini API key → disimpan lewat
   `crypto.ts` (AES-256-GCM, key enkripsi dari `ENCRYPTION_SECRET` di
   env server, bukan API key Gemini itu sendiri yang jadi env).
2. Saat generate: Server Action ambil API key user, dekripsi di memori
   (tidak pernah dikirim ke client), panggil Gemini dengan prompt
   terstruktur (topik, subtopik, jumlah, tingkat kesulitan, format
   output JSON).
3. Output Gemini divalidasi dengan skema Zod ketat (soal, 4 opsi, index
   kunci jawaban, pembahasan). Kalau tidak valid → retry sekali dengan
   instruksi perbaikan, lalu gagal dengan pesan jelas kalau tetap gagal.
4. Soal valid disimpan dengan `status = 'pending_review'`,
   `generated_by = 'ai'`, `source_user_id`.
5. Admin buka daftar draft → approve/edit/reject satu per satu.

### 3.4 Import soal via Excel

1. Admin unduh template (`.xlsx`) dengan kolom baku: topik, subtopik,
   pertanyaan, opsi_a..opsi_e, kunci, pembahasan, tingkat_kesulitan.
2. Upload → parse server-side dengan exceljs → validasi tiap baris
   dengan Zod → tampilkan preview (baris valid vs error, dengan alasan).
3. Admin konfirmasi → insert sebagai `status = 'draft'` (bukan langsung
   published) supaya masih bisa dicek sebelum tampil ke peserta.

## 4. Skalabilitas (Hostinger → VPS)

- Fase awal: Hostinger Node.js hosting + MySQL, cukup untuk ratusan user
  bersamaan kalau query terindeks dengan benar (index di
  `attempt_answers(attempt_id)`, `questions(subtopic_id)`, dst).
- Karena ini Next.js standar (bukan fitur khusus platform), migrasi ke
  VPS Hostinger nantinya hanya soal ganti target deploy, kode tidak
  perlu diubah.
- Kalau nanti trafik naik jauh: tambah Redis untuk cache soal per paket
  tes (soal jarang berubah), dan pertimbangkan queue untuk pemanggilan
  Gemini supaya tidak memblokir request.

## 5. Keamanan

- Kunci jawaban & pembahasan tidak pernah ada di payload halaman
  pengerjaan tes (query soal untuk peserta men-select kolom tanpa
  `correct_option` dan `explanation`).
- Semua Server Action mutasi memvalidasi kepemilikan (`attempt.user_id
  === session.user.id`) sebelum eksekusi.
- Gemini API key user: terenkripsi at-rest, tidak pernah masuk log,
  tidak pernah dikirim balik ke client setelah disimpan (hanya tampilkan
  masked, mis. `AIza...xyz`).
