// Logika skor — HANYA dipanggil di server (saat finalize attempt).
// Aturan: benar = 1 poin (atau `points_override`), salah/kosong = 0.
// Lihat docs/DATABASE.md §Aturan skor.

export type ScorableOption = {
  id: number;
  isCorrect: boolean;
};

export type ScorableQuestion = {
  questionId: number;
  subtopicId: number;
  options: ScorableOption[];
  /** `test_package_questions.points_override`. */
  pointsOverride?: number | null;
};

/** questionId → selectedOptionId (null/undefined = tidak dijawab). */
export type AnswerMap = ReadonlyMap<number, number | null | undefined>;

export type QuestionScore = {
  questionId: number;
  subtopicId: number;
  answered: boolean;
  isCorrect: boolean;
  score: number;
  maxScore: number;
};

export type AttemptScore = {
  totalScore: number;
  maxScore: number;
  questions: QuestionScore[];
};

export const DEFAULT_POINTS = 1;

export function scoreQuestion(
  question: ScorableQuestion,
  selectedOptionId: number | null | undefined,
): QuestionScore {
  // Opsi yang tidak milik soal ini dianggap tidak dijawab (defensif
  // terhadap payload client yang dimanipulasi).
  const selected =
    selectedOptionId == null
      ? undefined
      : question.options.find((o) => o.id === selectedOptionId);
  const maxScore = question.pointsOverride ?? DEFAULT_POINTS;
  const isCorrect = selected?.isCorrect === true;
  return {
    questionId: question.questionId,
    subtopicId: question.subtopicId,
    answered: selected !== undefined,
    isCorrect,
    score: isCorrect ? maxScore : 0,
    maxScore,
  };
}

export function scoreAttempt(questions: ScorableQuestion[], answers: AnswerMap): AttemptScore {
  const scored = questions.map((q) => scoreQuestion(q, answers.get(q.questionId)));
  return {
    totalScore: scored.reduce((sum, q) => sum + q.score, 0),
    maxScore: scored.reduce((sum, q) => sum + q.maxScore, 0),
    questions: scored,
  };
}
