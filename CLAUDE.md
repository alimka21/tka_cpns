# CLAUDE.md — Panduan Kerja untuk Claude Code

Proyek: **Web Tes Premium** — platform Tes Kemampuan Akademik Siswa & Tes CPNS
(bank soal, ujian online, analisis kelemahan per subtopik, generate soal via
Gemini API milik masing-masing user).

## Aturan #1: hemat token

Jangan baca seluruh dokumen di `docs/` di awal setiap sesi. Dokumen di sana
sengaja dipecah per topik supaya kamu hanya membuka yang relevan dengan
tugas saat ini. Urutan baca yang disarankan:

1. Baca file ini (CLAUDE.md) — selalu, ini sudah ringkas.
2. Baca **hanya bagian** `docs/` yang relevan dengan task yang diminta user.
   Gunakan daftar isi di bawah untuk memutuskan file mana yang perlu dibuka.
3. Jangan baca `docs/SRS.md` penuh untuk task kecil (misalnya "perbaiki
   validasi form"). Cukup baca modul terkait di `docs/DATABASE.md` atau
   kode yang relevan.
4. Setelah paham, kerjakan langsung. Jangan rangkum ulang dokumen ke dalam
   chat kecuali diminta — itu memboroskan token dua kali (baca + tulis
   ulang).
5. Kalau harus menjelaskan keputusan desain, tulis di `docs/DECISIONS.md`
   (append, jangan tulis ulang seluruh file) alih-alih menjelaskan panjang
   di chat.

## Peta dokumen (`docs/`)

| File | Isi | Kapan dibuka |
|---|---|---|
| `docs/SRS.md` | Kebutuhan fungsional & non-fungsional, scope fase 1 | Saat merancang fitur baru / cek scope |
| `docs/ARCHITECTURE.md` | Struktur folder, stack, alur request, keputusan teknis | Saat menambah modul/lapisan baru |
| `docs/DATABASE.md` | Skema tabel, relasi, enum, aturan skor CPNS | Saat kerja apa pun yang menyentuh data |
| `docs/ROADMAP.md` | Fase MVP, urutan pengerjaan | Saat menentukan "kerjakan apa selanjutnya" |
| `docs/WORKFLOW.md` | Alur Git, cara deploy ke Hostinger, cara testing | Saat setup, deploy, atau troubleshooting env |
| `docs/DECISIONS.md` | Log keputusan (ADR ringkas), ditambah seiring waktu | Saat butuh alasan kenapa sesuatu dibuat begitu |

Kalau salah satu file di atas belum ada, itu berarti belum dibuat —
buat baru mengikuti gaya file lain, ringkas dan dalam poin-poin.

## Stack (ringkas — detail di `docs/ARCHITECTURE.md`)

- Next.js 15 (App Router) + TypeScript, deploy ke Hostinger Node.js hosting
- Tailwind CSS + shadcn/ui
- MySQL (Hostinger) + Drizzle ORM
- Auth: Better Auth (email/password dulu, Google menyusul)
- Validasi: Zod di setiap boundary (form, import, AI output)
- AI: Gemini API — **API key disimpan per-user di database (terenkripsi),
  bukan di server/env**. Lihat `docs/SRS.md` §AI Generation.
- Belum ada payment gateway — di-skip untuk fase sekarang (lihat ROADMAP).

## Konvensi kode

- Bahasa kode & nama variabel: **Inggris**. Teks UI & copy: **Indonesia**.
- Server Actions / Route Handlers untuk semua mutasi data, jangan fetch
  client ke endpoint publik tanpa validasi Zod.
- Semua kunci jawaban dan logika skor **hanya di server**, tidak pernah
  dikirim ke client selama ujian berlangsung.
- Timer ujian dihitung dari `started_at`/`ends_at` di server, bukan dari
  jam client.
- Setiap tabel baru → tulis migrasinya dengan Drizzle Kit, jangan ubah
  skema manual di dashboard Hostinger.
- Commit kecil dan sering, pesan commit dalam bahasa Indonesia singkat,
  format: `feat: ...`, `fix: ...`, `chore: ...`, `docs: ...`.

## Perintah umum

```bash
npm run dev          # jalankan dev server
npm run db:generate   # generate migrasi Drizzle dari schema
npm run db:migrate    # jalankan migrasi ke database
npm run lint
npm run build
```

(Perintah persis bisa berubah setelah `package.json` dibuat — anggap
daftar di atas sebagai rencana, sesuaikan begitu proyek di-scaffold.)

## Saat mulai sesi baru

1. Cek `docs/ROADMAP.md` bagian "Status saat ini" untuk tahu progres.
2. Cek task yang diminta user, baca hanya dokumen relevan (lihat peta di
   atas).
3. Kerjakan, commit, lalu **update `docs/ROADMAP.md`** (centang/ubah
   status) supaya sesi berikutnya tidak perlu membaca ulang riwayat chat.
