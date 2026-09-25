// Data contoh untuk halaman yang belum tersambung database.
// Bentuknya mengikuti skema di docs/DATABASE.md supaya penggantinya (query
// Drizzle) tinggal mengisi tipe yang sama. Hapus file ini setelah semua
// halaman membaca data asli.

import type { Difficulty, QuestionType } from "@/lib/validation/enums";

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

// Pohon Jenjang → Mata pelajaran (topik) → Subtopik untuk Bank Soal.
export type DemoTopicNode = {
  jenjang: Jenjang;
  topics: { id: number; name: string; subtopics: { id: number; name: string; count: number }[] }[];
};

export const demoTopicTree: DemoTopicNode[] = [
  {
    jenjang: "SD",
    topics: [
      { id: 1, name: "Matematika", subtopics: [{ id: 11, name: "Pecahan", count: 42 }, { id: 12, name: "Pengukuran", count: 28 }] },
      { id: 2, name: "Bahasa Indonesia", subtopics: [{ id: 21, name: "Ide Pokok", count: 35 }] },
    ],
  },
  {
    jenjang: "SMP",
    topics: [
      {
        id: 3,
        name: "Matematika",
        subtopics: [
          { id: 31, name: "Pecahan & Perbandingan", count: 56 },
          { id: 32, name: "Persamaan Linear", count: 48 },
          { id: 33, name: "Bangun Datar & Luas", count: 39 },
        ],
      },
      { id: 4, name: "Bahasa Indonesia", subtopics: [{ id: 41, name: "Teks Eksplanasi", count: 44 }, { id: 42, name: "Kalimat Efektif", count: 31 }] },
    ],
  },
  {
    jenjang: "SMA",
    topics: [
      { id: 5, name: "Matematika", subtopics: [{ id: 51, name: "Fungsi Kuadrat", count: 37 }, { id: 52, name: "Peluang", count: 29 }] },
      { id: 6, name: "Bahasa Inggris", subtopics: [{ id: 61, name: "Reading Comprehension", count: 47 }] },
    ],
  },
];

export type DemoQuestionRow = {
  id: number;
  text: string;
  jenjang: Jenjang;
  topic: string;
  subtopicId: number;
  subtopic: string;
  difficulty: Difficulty;
  type: QuestionType;
  status: "draft" | "pending_review" | "published";
  generatedBy: "manual" | "ai" | "import";
  createdAt: string;
  stimulusCode?: string;
  stimulusOrder?: number;
};

export type DemoStimulus = {
  id: number;
  code: string;
  title: string;
  content: string;
  status: "draft" | "published";
  createdAt: string;
};

export const demoStimuli: DemoStimulus[] = [
  {
    id: 1,
    code: "STM-SMP-BIND-001",
    title: "Suara Kecil di Panggung Besar",
    content:
      "Rara selalu gemetar setiap kali harus berbicara di depan kelas. Ketika acara perpisahan sekolah tinggal satu minggu lagi, Bu Wati bertanya siapa yang mau menyanyi. Rara diam saja. Malamnya, ia teringat pesan kakeknya: \"Suara kecil pun bisa terdengar kalau kita berani mencobanya.\" Keesokan harinya, Rara mengangkat tangan.",
    status: "published",
    createdAt: "2026-09-15",
  },
  {
    id: 2,
    code: "STM-SMP-MTK-001",
    title: "Tabel Harga Tiket Museum",
    content: "Tiket dewasa Rp25.000, anak Rp15.000. Rombongan minimal 20 orang mendapat potongan 10% untuk semua tiket.",
    status: "draft",
    createdAt: "2026-09-21",
  },
];

export const demoQuestions: DemoQuestionRow[] = [
  { id: 101, text: "Ibu membeli 3/4 kg gula, lalu memakai 1/2 kg untuk membuat kue. Sisa gula Ibu adalah ...", jenjang: "SMP", topic: "Matematika", subtopicId: 31, subtopic: "Pecahan & Perbandingan", difficulty: "easy", type: "pg", status: "published", generatedBy: "manual", createdAt: "2026-09-10" },
  { id: 102, text: "Perbandingan uang Adi dan Budi 3 : 5. Jika selisih uang mereka Rp40.000, jumlah uang keduanya adalah ...", jenjang: "SMP", topic: "Matematika", subtopicId: 31, subtopic: "Pecahan & Perbandingan", difficulty: "medium", type: "pg", status: "published", generatedBy: "import", createdAt: "2026-09-11" },
  { id: 103, text: "Sebuah peta berskala 1 : 250.000. Jarak dua kota pada peta 8 cm. Jarak sebenarnya adalah ...", jenjang: "SMP", topic: "Matematika", subtopicId: 31, subtopic: "Pecahan & Perbandingan", difficulty: "medium", type: "pg", status: "pending_review", generatedBy: "ai", createdAt: "2026-09-20" },
  { id: 104, text: "Nilai x yang memenuhi (2x + 4)/3 = 6 adalah ...", jenjang: "SMP", topic: "Matematika", subtopicId: 32, subtopic: "Persamaan Linear", difficulty: "easy", type: "pg", status: "published", generatedBy: "manual", createdAt: "2026-09-12" },
  { id: 105, text: "Tiga tahun lalu umur ayah empat kali umur anaknya. Jumlah umur mereka sekarang 56 tahun. Umur anak sekarang adalah ...", jenjang: "SMP", topic: "Matematika", subtopicId: 32, subtopic: "Persamaan Linear", difficulty: "hard", type: "pg", status: "draft", generatedBy: "ai", createdAt: "2026-09-22" },
  { id: 107, text: "Manakah bilangan berikut yang habis dibagi 3? (jawaban bisa lebih dari satu)", jenjang: "SMP", topic: "Matematika", subtopicId: 31, subtopic: "Pecahan & Perbandingan", difficulty: "medium", type: "pgk_mcma", status: "published", generatedBy: "manual", createdAt: "2026-09-23" },
  { id: 108, text: "Tentukan benar atau salah setiap pernyataan tentang perbandingan senilai berikut.", jenjang: "SMP", topic: "Matematika", subtopicId: 31, subtopic: "Pecahan & Perbandingan", difficulty: "hard", type: "pgk_kategori", status: "pending_review", generatedBy: "ai", createdAt: "2026-09-24" },
  { id: 109, text: "Berdasarkan teks, apa yang membuat Rara akhirnya berani tampil?", jenjang: "SMP", topic: "Bahasa Indonesia", subtopicId: 41, subtopic: "Teks Eksplanasi", difficulty: "easy", type: "pg", status: "published", generatedBy: "import", createdAt: "2026-09-15", stimulusCode: "STM-SMP-BIND-001", stimulusOrder: 1 },
  { id: 110, text: "Tentukan kesesuaian setiap pernyataan berikut dengan isi teks.", jenjang: "SMP", topic: "Bahasa Indonesia", subtopicId: 41, subtopic: "Teks Eksplanasi", difficulty: "medium", type: "pgk_kategori", status: "published", generatedBy: "import", createdAt: "2026-09-15", stimulusCode: "STM-SMP-BIND-001", stimulusOrder: 2 },
  { id: 106, text: "Kalimat berikut yang merupakan kalimat efektif adalah ...", jenjang: "SMP", topic: "Bahasa Indonesia", subtopicId: 42, subtopic: "Kalimat Efektif", difficulty: "medium", type: "pg", status: "published", generatedBy: "import", createdAt: "2026-09-14" },
];
