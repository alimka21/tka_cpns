// Data contoh untuk halaman yang belum tersambung database.
// Bentuknya mengikuti skema di docs/DATABASE.md supaya penggantinya (query
// Drizzle) tinggal mengisi tipe yang sama. Hapus file ini setelah semua
// halaman membaca data asli.


export type Jenjang = "SD" | "SMP" | "SMA";

// ── Siswa ────────────────────────────────────────────────────────────────

export type DemoPackage = {
  id: number;
  title: string;
  description: string;
  jenjang: Jenjang;
  subject: string;
  questionCount: number;
  durationMinutes: number;
  isPremium: boolean;
  /** Siswa sudah punya akses (entitlement) ke paket premium ini. */
  unlocked: boolean;
  lastScore?: number;
};

export const demoStudent = { name: "Rina Kartika", jenjang: "SMP" as Jenjang, isPremium: false };

export const demoPackages: DemoPackage[] = [
  {
    id: 1,
    title: "TKA SMP — Matematika Paket 1",
    description: "Bilangan, aljabar, geometri, dan statistika dasar sesuai kisi-kisi TKA SMP.",
    jenjang: "SMP",
    subject: "Matematika",
    questionCount: 30,
    durationMinutes: 60,
    isPremium: false,
    unlocked: true,
    lastScore: 72,
  },
  {
    id: 2,
    title: "TKA SMP — Bahasa Indonesia Paket 1",
    description: "Teks eksplanasi, teks prosedur, kalimat efektif, dan ejaan baku.",
    jenjang: "SMP",
    subject: "Bahasa Indonesia",
    questionCount: 30,
    durationMinutes: 60,
    isPremium: false,
    unlocked: true,
  },
  {
    id: 3,
    title: "Latihan Fokus: Pecahan & Perbandingan",
    description: "10 soal bertahap untuk menguatkan subtopik terlemahmu.",
    jenjang: "SMP",
    subject: "Matematika",
    questionCount: 10,
    durationMinutes: 20,
    isPremium: false,
    unlocked: true,
  },
  {
    id: 4,
    title: "Simulasi Lengkap TKA SMP 2026",
    description: "Matematika dan Bahasa Indonesia dalam satu sesi, format mirip TKA resmi.",
    jenjang: "SMP",
    subject: "Campuran",
    questionCount: 60,
    durationMinutes: 120,
    isPremium: true,
    unlocked: false,
  },
  {
    id: 5,
    title: "TKA SMP — Matematika Paket 2 (HOTS)",
    description: "Soal penalaran tingkat tinggi: pemodelan, pola, dan pemecahan masalah.",
    jenjang: "SMP",
    subject: "Matematika",
    questionCount: 30,
    durationMinutes: 60,
    isPremium: true,
    unlocked: false,
  },
  {
    id: 6,
    title: "TKA SMP — Bahasa Indonesia Paket 2",
    description: "Literasi teks nonsastra dan sastra, simpulan, serta ide pokok paragraf.",
    jenjang: "SMP",
    subject: "Bahasa Indonesia",
    questionCount: 30,
    durationMinutes: 60,
    isPremium: false,
    unlocked: true,
  },
];

export type DemoWeakSubtopic = {
  subtopic: string;
  topic: string;
  subject: string;
  percentage: number;
  correct: number;
  total: number;
};

export const demoWeakest: DemoWeakSubtopic = {
  subtopic: "Pecahan & Perbandingan",
  topic: "Bilangan",
  subject: "Matematika",
  percentage: 38,
  correct: 3,
  total: 8,
};

export type DemoHistoryItem = {
  attemptId: string;
  packageTitle: string;
  subject: string;
  finishedAt: string;
  correct: number;
  total: number;
  score: number;
};

export const demoHistory: DemoHistoryItem[] = [
  {
    attemptId: "demo",
    packageTitle: "TKA SMP — Matematika Paket 1",
    subject: "Matematika",
    finishedAt: "2026-09-23T19:45:00+07:00",
    correct: 22,
    total: 30,
    score: 72,
  },
  {
    attemptId: "demo",
    packageTitle: "TKA SMP — Bahasa Indonesia Paket 1",
    subject: "Bahasa Indonesia",
    finishedAt: "2026-09-21T14:10:00+07:00",
    correct: 25,
    total: 30,
    score: 83,
  },
  {
    attemptId: "demo",
    packageTitle: "TKA SMP — Matematika Paket 1",
    subject: "Matematika",
    finishedAt: "2026-09-18T09:30:00+07:00",
    correct: 19,
    total: 30,
    score: 63,
  },
];

// ── Hasil & analisis (bentuk = attempt_subtopic_scores) ─────────────────

export type DemoSubtopicResult = {
  subtopic: string;
  /** Label pendek untuk sumbu radar chart. */
  short: string;
  topic: string;
  correct: number;
  total: number;
  percentage: number;
};

export const demoResult = {
  attemptId: "demo",
  packageTitle: "TKA SMP — Matematika Paket 1",
  jenjang: "SMP" as Jenjang,
  finishedAt: "2026-09-23T19:45:00+07:00",
  durationUsedMinutes: 46,
  durationMinutes: 60,
  score: 72,
  correct: 22,
  wrong: 6,
  blank: 2,
  total: 30,
  subtopics: [
    { subtopic: "Operasi Bilangan Bulat", short: "Bil. Bulat", topic: "Bilangan", correct: 4, total: 4, percentage: 100 },
    { subtopic: "Pecahan & Perbandingan", short: "Pecahan", topic: "Bilangan", correct: 3, total: 8, percentage: 38 },
    { subtopic: "Persamaan Linear", short: "Pers. Linear", topic: "Aljabar", correct: 4, total: 5, percentage: 80 },
    { subtopic: "Pola Bilangan", short: "Pola", topic: "Aljabar", correct: 3, total: 4, percentage: 75 },
    { subtopic: "Bangun Datar & Luas", short: "Bangun Datar", topic: "Geometri", correct: 4, total: 5, percentage: 80 },
    { subtopic: "Statistika Dasar", short: "Statistika", topic: "Data", correct: 4, total: 4, percentage: 100 },
  ] satisfies DemoSubtopicResult[],
  /** Skor percobaan sebelumnya untuk paket yang sama, urut waktu. */
  trend: [
    { label: "18 Sep", score: 63 },
    { label: "20 Sep", score: 67 },
    { label: "23 Sep", score: 72 },
  ],
};

// ── Admin ────────────────────────────────────────────────────────────────

export const demoAdminStats = {
  users: 128,
  premiumUsers: 23,
  questions: 486,
  pendingReview: 14,
  publishedPackages: 12,
  attemptsToday: 37,
};

/** Percobaan tes selesai per hari, 7 hari terakhir. */
export const demoAttemptsPerDay = [
  { day: "Kam", count: 21 },
  { day: "Jum", count: 18 },
  { day: "Sab", count: 34 },
  { day: "Min", count: 41 },
  { day: "Sen", count: 26 },
  { day: "Sel", count: 29 },
  { day: "Rab", count: 37 },
];

export type DemoActivity = {
  who: string;
  action: string;
  context: string;
  status: { label: string; tone: "success" | "warning" | "info" | "muted" };
  time: string;
};

export const demoActivity: DemoActivity[] = [
  {
    who: "Rina Kartika",
    action: "Menyelesaikan TKA SMP — Matematika Paket 1",
    context: "SMP · Matematika",
    status: { label: "Skor 72", tone: "info" },
    time: "2 menit lalu",
  },
  {
    who: "Admin",
    action: "Mengaktifkan akses premium untuk Bagas Saputra",
    context: "Akses manual",
    status: { label: "Premium aktif", tone: "success" },
    time: "15 menit lalu",
  },
  {
    who: "Admin",
    action: "Import 40 soal Bahasa Indonesia (Excel)",
    context: "SMA · Bahasa Indonesia",
    status: { label: "Menunggu review", tone: "warning" },
    time: "1 jam lalu",
  },
  {
    who: "Dimas Ananda",
    action: "Memulai TKA SD — Matematika Paket 1",
    context: "SD · Matematika",
    status: { label: "Sedang mengerjakan", tone: "muted" },
    time: "2 jam lalu",
  },
];

export type DemoUser = {
  id: number;
  name: string;
  email: string;
  role: "student" | "admin";
  jenjang: Jenjang | null;
  premium: boolean;
  createdAt: string;
};

export const demoUsers: DemoUser[] = [
  { id: 1, name: "Alimka", email: "kpbgalimka@gmail.com", role: "admin", jenjang: null, premium: true, createdAt: "2026-09-01" },
  { id: 2, name: "Rina Kartika", email: "rina.kartika@example.com", role: "student", jenjang: "SMP", premium: false, createdAt: "2026-09-05" },
  { id: 3, name: "Bagas Saputra", email: "bagas.s@example.com", role: "student", jenjang: "SMA", premium: true, createdAt: "2026-09-08" },
  { id: 4, name: "Dimas Ananda", email: "dimas.ananda@example.com", role: "student", jenjang: "SD", premium: false, createdAt: "2026-09-12" },
  { id: 5, name: "Salsabila Putri", email: "salsa.putri@example.com", role: "student", jenjang: "SMA", premium: false, createdAt: "2026-09-19" },
];
