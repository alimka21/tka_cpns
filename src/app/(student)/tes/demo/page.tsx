import { ExamShell } from "@/components/tes/exam-shell";
import type { ExamQuestion } from "@/lib/exam";
import { demoSaveAnswer, demoSubmitAttempt } from "./actions";

// Halaman pratinjau UI pengerjaan tes dengan data contoh (tanpa database).
// Hapus setelah /tes/[packageId] terhubung ke tabel attempts.

export const dynamic = "force-dynamic";

const DEMO_DURATION_MINUTES = 15;

const questions: ExamQuestion[] = [
  {
    id: 1,
    text: "Hasil dari $12 \\times 15$ adalah ...",
    imageUrl: null,
    options: [
      { id: 11, label: "A", text: "150" },
      { id: 12, label: "B", text: "160" },
      { id: 13, label: "C", text: "170" },
      { id: 14, label: "D", text: "180" },
      { id: 15, label: "E", text: "190" },
    ],
  },
  {
    id: 2,
    text: "Nilai $x$ yang memenuhi persamaan berikut adalah ...\n$$\\frac{2x + 4}{3} = 6$$",
    imageUrl: null,
    options: [
      { id: 21, label: "A", text: "$5$" },
      { id: 22, label: "B", text: "$7$" },
      { id: 23, label: "C", text: "$9$" },
      { id: 24, label: "D", text: "$11$" },
    ],
  },
  {
    id: 3,
    text: "Ibu membeli $\\frac{3}{4}$ kg gula, lalu memakai $\\frac{1}{2}$ kg untuk membuat kue. Sisa gula Ibu adalah ...",
    imageUrl: null,
    options: [
      { id: 31, label: "A", text: "$\\frac{1}{8}$ kg" },
      { id: 32, label: "B", text: "$\\frac{1}{4}$ kg" },
      { id: 33, label: "C", text: "$\\frac{1}{2}$ kg" },
      { id: 34, label: "D", text: "$\\frac{2}{3}$ kg" },
    ],
  },
  {
    id: 4,
    text: "Kata baku yang tepat untuk melengkapi kalimat berikut adalah ...\nPetugas perpustakaan sedang menyusun ... buku baru.",
    imageUrl: null,
    options: [
      { id: 41, label: "A", text: "katalogus" },
      { id: 42, label: "B", text: "katalog" },
      { id: 43, label: "C", text: "katalok" },
      { id: 44, label: "D", text: "kataloq" },
    ],
  },
];

export default function DemoTesPage() {
  const now = new Date();
  const endsAt = new Date(now.getTime() + DEMO_DURATION_MINUTES * 60_000);
  return (
    <ExamShell
      title="Demo TKA — Pratinjau Tampilan"
      questions={questions}
      initialAnswers={{}}
      endsAt={endsAt.toISOString()}
      serverNow={now.toISOString()}
      saveAnswer={demoSaveAnswer}
      submitAttempt={demoSubmitAttempt}
    />
  );
}
