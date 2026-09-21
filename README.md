# Web Tes Premium

Platform tes online untuk **Tes Kemampuan Akademik Siswa** dan **Tes CPNS**,
dengan bank soal per topik/subtopik, analisis kelemahan akademik, dan
generate soal otomatis lewat Gemini API (API key milik masing-masing user).

Status: **Fase 0 — dokumen & rencana selesai, kode belum di-scaffold.**
Lihat `docs/ROADMAP.md` untuk status terkini dan langkah selanjutnya.

## Mulai di sini

1. Buka folder ini di VS Code.
2. Baca `CLAUDE.md` — ini panduan kerja untuk Claude Code, dan juga peta
   cepat untuk Anda sendiri.
3. Jalankan `claude` di terminal root folder ini, lalu minta lanjutkan
   Fase 0 di `docs/ROADMAP.md` (scaffold Next.js, dsb).

## Dokumen

- `docs/SRS.md` — kebutuhan & scope fitur
- `docs/ARCHITECTURE.md` — stack, struktur folder, alur teknis
- `docs/DATABASE.md` — skema tabel
- `docs/ROADMAP.md` — fase pengerjaan & status
- `docs/WORKFLOW.md` — Git, VS Code, cara deploy ke Hostinger
- `docs/DECISIONS.md` — log keputusan penting

## Stack

Next.js (App Router) + TypeScript, Tailwind + shadcn/ui, MySQL + Drizzle
ORM, Better Auth, deploy ke Hostinger Node.js hosting via GitHub.
