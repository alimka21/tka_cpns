// Tes demo publik (landing → /tes/demo): 10 soal TKA SMP contoh, 5 subdomain
// asli kerangka asesmen × 2 soal, semua bentuk soal + 1 grup stimulus.
// Tanpa database. Kunci & pembahasan HANYA di server — halaman ujian hanya
// menerima `demoExamQuestions()` (tanpa kunci).

import type { ReviewItem } from "@/lib/review";
import type { AnswerResponse } from "@/lib/validation/attempt";
import { toExamQuestion, toExamStimulus } from "@/server/services/math-render";
import { buildReviewItem, type ReviewSourceQuestion } from "@/server/services/review";
import { scoreAttempt } from "@/server/services/scoring";

export const DEMO_DURATION_MINUTES = 20;
export const DEMO_TITLE = "Demo TKA SMP — Matematika & Bahasa Indonesia";

type DemoSubdomain = { id: number; code: string; name: string; subject: string; tip: string };

export const DEMO_SUBDOMAINS: DemoSubdomain[] = [
  {
    id: 1,
    code: "SMP-MTK-D1-S1",
    name: "Bilangan Real",
    subject: "Matematika",
    tip: "Latih operasi hitung tanpa kalkulator dan hafalkan ciri bilangan prima (hanya habis dibagi 1 dan dirinya sendiri).",
  },
  {
    id: 2,
    code: "SMP-MTK-D2-S1",
    name: "Persamaan dan Pertidaksamaan Linier",
    subject: "Matematika",
    tip: "Biasakan memindahkan suku ke satu ruas langkah demi langkah, lalu cek jawaban dengan mensubstitusikannya kembali.",
  },
  {
    id: 3,
    code: "SMP-MTK-D4-S1",
    name: "Data",
    subject: "Matematika",
    tip: "Urutkan data dulu sebelum mencari median, dan bedakan rata-rata, median, modus, serta jangkauan.",
  },
  {
    id: 4,
    code: "SMP-BIND-D1-S3",
    name: "Informasi tersurat dalam teks",
    subject: "Bahasa Indonesia",
    tip: "Jawab dengan kembali ke kalimat di teks — informasi tersurat selalu bisa ditunjuk letaknya.",
  },
  {
    id: 5,
    code: "SMP-BIND-D2-S1",
    name: "Menyimpulkan tokoh & nilai dalam teks",
    subject: "Bahasa Indonesia",
    tip: "Perhatikan perubahan sikap tokoh dari awal ke akhir cerita; di situlah biasanya pesan (amanat) disampaikan.",
  },
];

type DemoQuestion = ReviewSourceQuestion & { explanation: string };

const opts = (qid: number, items: [string, boolean | string][]) =>
  items.map(([text, key], i) => ({
    id: qid * 10 + i + 1,
    label: "ABCDE"[i],
    optionText: text,
    isCorrect: key === true,
    correctCategory: typeof key === "string" ? key : null,
  }));

const base = { imageUrl: null, categoryLabels: null, stimulusId: null } as const;

export const DEMO_QUESTIONS: DemoQuestion[] = [
  {
    ...base,
    id: 1,
    subtopicId: 1,
    type: "pg",
    questionText: "Hasil dari $12 \\times 15$ adalah ...",
    options: opts(1, [["150", false], ["160", false], ["170", false], ["180", true], ["190", false]]),
    explanation: "$12 \\times 15 = 12 \\times 10 + 12 \\times 5 = 120 + 60 = 180$. Jawaban: D.",
  },
  {
    ...base,
    id: 2,
    subtopicId: 1,
    type: "pgk_mcma",
    questionText: "Manakah bilangan berikut yang merupakan bilangan prima? (Jawaban bisa lebih dari satu.)",
    options: opts(2, [["$21$", false], ["$23$", true], ["$27$", false], ["$29$", true]]),
    explanation:
      "$21 = 3 \\times 7$ dan $27 = 3 \\times 9$ bukan prima. $23$ dan $29$ hanya habis dibagi 1 dan dirinya sendiri, jadi keduanya prima. Jawaban: B dan D.",
  },
  {
    ...base,
    id: 3,
    subtopicId: 2,
    type: "pgk_kategori",
    categoryLabels: ["Benar", "Salah"],
    questionText: "Tentukan benar atau salah setiap pernyataan tentang persamaan berikut.\n$$\\frac{2x + 4}{3} = 6$$",
    options: opts(3, [
      ["Nilai $x$ yang memenuhi adalah $7$.", "Benar"],
      ["Persamaan tersebut ekuivalen dengan $2x + 4 = 18$.", "Benar"],
      ["Nilai $x$ yang memenuhi adalah bilangan genap.", "Salah"],
    ]),
    explanation:
      "Kalikan kedua ruas dengan 3: $2x + 4 = 18$, maka $2x = 14$ dan $x = 7$. Pernyataan A dan B benar; C salah karena 7 bilangan ganjil.",
  },
  {
    ...base,
    id: 4,
    subtopicId: 2,
    type: "pg",
    questionText: "Nilai $x$ yang memenuhi $5x + 3 = 2x + 18$ adalah ...",
    options: opts(4, [["$3$", false], ["$5$", true], ["$7$", false], ["$15$", false]]),
    explanation: "$5x - 2x = 18 - 3$, sehingga $3x = 15$ dan $x = 5$. Cek: $5(5)+3 = 28 = 2(5)+18$. Jawaban: B.",
  },
  {
    ...base,
    id: 5,
    subtopicId: 3,
    type: "pg",
    questionText: "Nilai ulangan lima siswa adalah $6, 8, 7, 9, 10$. Rata-rata nilai mereka adalah ...",
    options: opts(5, [["$7$", false], ["$7{,}5$", false], ["$8$", true], ["$8{,}5$", false]]),
    explanation: "Jumlah nilai $= 6+8+7+9+10 = 40$. Rata-rata $= 40 : 5 = 8$. Jawaban: C.",
  },
  {
    ...base,
    id: 6,
    subtopicId: 3,
    type: "pgk_mcma",
    questionText: "Diketahui data: $4, 5, 5, 6, 8$. Pernyataan yang benar adalah ... (Jawaban bisa lebih dari satu.)",
    options: opts(6, [
      ["Modus data tersebut adalah $5$.", true],
      ["Median data tersebut adalah $5$.", true],
      ["Rata-rata data tersebut adalah $6$.", false],
      ["Jangkauan data tersebut adalah $3$.", false],
    ]),
    explanation:
      "Modus = nilai paling sering muncul = 5. Data sudah urut, nilai tengahnya (median) = 5. Rata-rata $= 28 : 5 = 5{,}6$ (bukan 6). Jangkauan $= 8 - 4 = 4$ (bukan 3). Jawaban: A dan B.",
  },
  {
    ...base,
    id: 7,
    subtopicId: 4,
    stimulusId: 1,
    type: "pg",
    questionText: "Berdasarkan teks, apa yang membuat Rara akhirnya berani tampil?",
    options: opts(7, [
      ["Ia sudah hafal seluruh lagu sejak lama.", false],
      ["Ibu guru memintanya menggantikan temannya.", false],
      ["Ia teringat pesan kakeknya untuk mencoba.", true],
      ["Teman-temannya menjanjikan hadiah.", false],
    ]),
    explanation:
      "Paragraf kedua menyebutkan Rara teringat pesan kakeknya: \"Suara kecil pun bisa terdengar kalau kita berani mencobanya.\" Keesokan harinya ia mengangkat tangan. Jawaban: C.",
  },
  {
    ...base,
    id: 8,
    subtopicId: 4,
    stimulusId: 1,
    type: "pgk_kategori",
    categoryLabels: ["Sesuai", "Tidak Sesuai"],
    questionText: "Tentukan kesesuaian setiap pernyataan berikut dengan isi teks.",
    options: opts(8, [
      ["Rara tampil di acara perpisahan sekolah.", "Sesuai"],
      ["Rara menyanyi bersama kakeknya.", "Tidak Sesuai"],
      ["Tepuk tangan penonton membuat Rara tersenyum.", "Sesuai"],
    ]),
    explanation:
      "Teks menyebut acara perpisahan sekolah (A sesuai) dan Rara tersenyum setelah tepuk tangan memenuhi aula (C sesuai). Kakek hanya memberi pesan, tidak ikut menyanyi (B tidak sesuai).",
  },
  {
    ...base,
    id: 9,
    subtopicId: 5,
    stimulusId: 1,
    type: "pg",
    questionText: "Watak Rara di awal cerita adalah ...",
    options: opts(9, [
      ["Pemalu dan mudah gugup", true],
      ["Sombong dan suka pamer", false],
      ["Pemberani dan percaya diri", false],
      ["Pemarah dan keras kepala", false],
    ]),
    explanation:
      "Kalimat pertama: \"Rara selalu gemetar setiap kali harus berbicara di depan kelas\" dan ia \"diam saja\" saat ditanya — tanda pemalu dan mudah gugup. Jawaban: A.",
  },
  {
    ...base,
    id: 10,
    subtopicId: 5,
    stimulusId: 1,
    type: "pg",
    questionText: "Amanat yang paling sesuai dengan cerita tersebut adalah ...",
    options: opts(10, [
      ["Menyanyi adalah bakat yang dimiliki sejak lahir.", false],
      ["Keberanian untuk mencoba dapat mengalahkan rasa takut.", true],
      ["Kita harus selalu menuruti perintah guru.", false],
      ["Acara perpisahan harus dirayakan dengan meriah.", false],
    ]),
    explanation:
      "Rara yang awalnya takut berhasil tampil karena berani mencoba, sesuai pesan kakeknya. Pesan cerita: keberanian mencoba mengalahkan rasa takut. Jawaban: B.",
  },
];

export const DEMO_STIMULUS = {
  id: 1,
  title: "Suara Kecil di Panggung Besar",
  imageUrl: null,
  content:
    "Rara selalu gemetar setiap kali harus berbicara di depan kelas. Ketika acara perpisahan sekolah tinggal satu minggu lagi, Bu Wati bertanya siapa yang mau menyanyi.\n\n" +
    "Rara diam saja. Malamnya, ia teringat pesan kakeknya: \"Suara kecil pun bisa terdengar kalau kita berani mencobanya.\" Keesokan harinya, Rara mengangkat tangan.\n\n" +
    "Di hari perpisahan, lututnya masih bergetar. Namun, begitu lagu selesai dan tepuk tangan memenuhi aula, Rara tersenyum lebar.",
};

/** Soal untuk halaman ujian — TANPA kunci. */
export function demoExamQuestions() {
  return DEMO_QUESTIONS.map((q) =>
    toExamQuestion({
      id: q.id,
      type: q.type,
      text: q.questionText,
      imageUrl: q.imageUrl,
      categoryLabels: q.categoryLabels,
      stimulusId: q.stimulusId,
      options: q.options.map((o) => ({ id: o.id, label: o.label, text: o.optionText })),
    }),
  );
}

export function demoExamStimuli() {
  return [toExamStimulus(DEMO_STIMULUS)];
}

export type DemoSubdomainResult = DemoSubdomain & { correct: number; total: number; percentage: number };

export type DemoResult = {
  score: number;
  correct: number;
  wrong: number;
  blank: number;
  total: number;
  /** Urutan kerangka (bukan urut skor). */
  subdomains: DemoSubdomainResult[];
  subjects: { name: string; correct: number; total: number; percentage: number }[];
  items: ReviewItem[];
  stimulus: { id: number; title: string; html: string; imageUrl: string | null };
};

/** Nilai jawaban demo (questionId → jawaban). Jawaban untuk soal asing diabaikan. */
export function scoreDemo(answers: Record<number, AnswerResponse | null>): DemoResult {
  const map = new Map(DEMO_QUESTIONS.map((q) => [q.id, answers[q.id] ?? null]));
  const scored = scoreAttempt(
    DEMO_QUESTIONS.map((q) => ({
      questionId: q.id,
      subtopicId: q.subtopicId,
      type: q.type,
      options: q.options.map((o) => ({ id: o.id, isCorrect: o.isCorrect, correctCategory: o.correctCategory })),
      categoryLabels: q.categoryLabels,
    })),
    map,
  );

  const pct = (c: number, t: number) => (t > 0 ? Math.round((c / t) * 100) : 0);
  const subdomains = DEMO_SUBDOMAINS.map((s) => {
    const qs = scored.questions.filter((q) => q.subtopicId === s.id);
    const correct = qs.filter((q) => q.isCorrect).length;
    return { ...s, correct, total: qs.length, percentage: pct(correct, qs.length) };
  });
  const subjects = [...new Set(DEMO_SUBDOMAINS.map((s) => s.subject))].map((name) => {
    const list = subdomains.filter((s) => s.subject === name);
    const correct = list.reduce((sum, s) => sum + s.correct, 0);
    const total = list.reduce((sum, s) => sum + s.total, 0);
    return { name, correct, total, percentage: pct(correct, total) };
  });
  const subdomainName = new Map(DEMO_SUBDOMAINS.map((s) => [s.id, s.name]));
  const correct = scored.questions.filter((q) => q.isCorrect).length;
  const blank = scored.questions.filter((q) => q.completeness === "blank").length;

  return {
    score: pct(scored.totalScore, scored.maxScore),
    correct,
    blank,
    wrong: scored.questions.length - correct - blank,
    total: scored.questions.length,
    subdomains,
    subjects,
    items: DEMO_QUESTIONS.map((q, i) =>
      buildReviewItem(q, map.get(q.id) ?? null, i + 1, subdomainName.get(q.subtopicId) ?? "", q.explanation),
    ),
    stimulus: toExamStimulus(DEMO_STIMULUS),
  };
}
