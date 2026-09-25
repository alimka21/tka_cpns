import type { Metadata } from "next";
import { ExamShell } from "@/components/tes/exam-shell";
import {
  toExamQuestion,
  toExamStimulus,
  type RawExamQuestion,
  type RawExamStimulus,
} from "@/server/services/math-render";
import { demoSaveAnswer, demoSubmitAttempt } from "./actions";

export const metadata: Metadata = { title: "Demo TKA" };

// Halaman pratinjau UI pengerjaan tes dengan data contoh (tanpa database).
// Hapus setelah /tes/[packageId] terhubung ke tabel attempts.

export const dynamic = "force-dynamic";

const DEMO_DURATION_MINUTES = 15;

const questions: RawExamQuestion[] = [
  {
    id: 1,
    type: "pg",
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
    type: "pgk_mcma",
    text: "Manakah bilangan berikut yang merupakan bilangan prima?",
    imageUrl: null,
    options: [
      { id: 21, label: "A", text: "$21$" },
      { id: 22, label: "B", text: "$23$" },
      { id: 23, label: "C", text: "$27$" },
      { id: 24, label: "D", text: "$29$" },
    ],
  },
  {
    id: 3,
    type: "pgk_kategori",
    text: "Tentukan benar atau salah setiap pernyataan tentang persamaan berikut.\n$$\\frac{2x + 4}{3} = 6$$",
    imageUrl: null,
    categoryLabels: ["Benar", "Salah"],
    options: [
      { id: 31, label: "A", text: "Nilai $x$ yang memenuhi adalah $7$." },
      { id: 32, label: "B", text: "Persamaan tersebut ekuivalen dengan $2x + 4 = 18$." },
      { id: 33, label: "C", text: "Nilai $x$ yang memenuhi adalah bilangan genap." },
    ],
  },
  {
    id: 4,
    type: "pg",
    stimulusId: 1,
    text: "Berdasarkan teks, apa yang membuat Rara akhirnya berani tampil?",
    imageUrl: null,
    options: [
      { id: 41, label: "A", text: "Ia sudah hafal seluruh lagu sejak lama." },
      { id: 42, label: "B", text: "Ibu guru memintanya menggantikan temannya." },
      { id: 43, label: "C", text: "Ia teringat pesan kakeknya untuk mencoba." },
      { id: 44, label: "D", text: "Teman-temannya menjanjikan hadiah." },
    ],
  },
  {
    id: 5,
    type: "pgk_kategori",
    stimulusId: 1,
    text: "Tentukan kesesuaian setiap pernyataan berikut dengan isi teks.",
    imageUrl: null,
    categoryLabels: ["Sesuai", "Tidak Sesuai"],
    options: [
      { id: 51, label: "A", text: "Rara tampil di acara perpisahan sekolah." },
      { id: 52, label: "B", text: "Rara menyanyi bersama kakeknya." },
      { id: 53, label: "C", text: "Tepuk tangan penonton membuat Rara tersenyum." },
    ],
  },
];

const stimuli: RawExamStimulus[] = [
  {
    id: 1,
    title: "Suara Kecil di Panggung Besar",
    imageUrl: null,
    content:
      "Rara selalu gemetar setiap kali harus berbicara di depan kelas. Ketika acara perpisahan sekolah tinggal satu minggu lagi, Bu Wati bertanya siapa yang mau menyanyi.\n\n" +
      "Rara diam saja. Malamnya, ia teringat pesan kakeknya: \"Suara kecil pun bisa terdengar kalau kita berani mencobanya.\" Keesokan harinya, Rara mengangkat tangan.\n\n" +
      "Di hari perpisahan, lututnya masih bergetar. Namun, begitu lagu selesai dan tepuk tangan memenuhi aula, Rara tersenyum lebar.",
  },
];

export default function DemoTesPage() {
  const now = new Date();
  const endsAt = new Date(now.getTime() + DEMO_DURATION_MINUTES * 60_000);
  return (
    <ExamShell
      title="Demo TKA — Semua Bentuk Soal"
      questions={questions.map(toExamQuestion)}
      stimuli={stimuli.map(toExamStimulus)}
      initialAnswers={{}}
      endsAt={endsAt.toISOString()}
      serverNow={now.toISOString()}
      saveAnswer={demoSaveAnswer}
      submitAttempt={demoSubmitAttempt}
    />
  );
}
