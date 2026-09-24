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
    text: "Semua peserta tes membawa pensil. Sebagian peserta tes membawa penghapus. Kesimpulan yang tepat adalah ...",
    imageUrl: null,
    options: [
      { id: 31, label: "A", text: "Semua peserta tes membawa penghapus." },
      { id: 32, label: "B", text: "Sebagian peserta tes membawa pensil dan penghapus." },
      { id: 33, label: "C", text: "Semua yang membawa penghapus bukan peserta tes." },
      { id: 34, label: "D", text: "Tidak ada peserta tes yang membawa penghapus." },
      { id: 35, label: "E", text: "Sebagian peserta tes tidak membawa pensil." },
    ],
  },
  {
    id: 4,
    text: "Rekan kerja Anda meminta bantuan menyelesaikan tugasnya, padahal pekerjaan Anda sendiri belum selesai. Sikap Anda ...",
    imageUrl: null,
    options: [
      { id: 41, label: "A", text: "Menolak karena pekerjaan sendiri lebih penting." },
      { id: 42, label: "B", text: "Menyelesaikan pekerjaan sendiri dulu, lalu membantu." },
      { id: 43, label: "C", text: "Membantu sambil mengabaikan pekerjaan sendiri." },
      { id: 44, label: "D", text: "Menyarankan ia meminta bantuan orang lain." },
      { id: 45, label: "E", text: "Mengatur waktu agar keduanya selesai tepat waktu." },
    ],
  },
];

export default function DemoTesPage() {
  const now = new Date();
  const endsAt = new Date(now.getTime() + DEMO_DURATION_MINUTES * 60_000);
  return (
    <ExamShell
      title="Demo Tes — Pratinjau Tampilan"
      questions={questions}
      initialAnswers={{}}
      endsAt={endsAt.toISOString()}
      serverNow={now.toISOString()}
      saveAnswer={demoSaveAnswer}
      submitAttempt={demoSubmitAttempt}
    />
  );
}
