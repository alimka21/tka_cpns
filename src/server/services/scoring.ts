// Logika skor — HANYA dipanggil di server (saat finalize attempt).
// Aturan per mode lihat docs/DATABASE.md §Enum penting.

export type ScoringMode = "standard" | "twk_tiu" | "tkp";

export type ScorableOption = {
  id: number;
  isCorrect: boolean | null;
  scoreWeight: number | null;
};

export type ScorableQuestion = {
  questionId: number;
  subtopicId: number;
  options: ScorableOption[];
  /** `test_package_questions.points_override`, hanya berlaku di mode standard. */
  pointsOverride?: number | null;
};

/** questionId → selectedOptionId (null/undefined = tidak dijawab). */
export type AnswerMap = ReadonlyMap<number, number | null | undefined>;

export type QuestionScore = {
  questionId: number;
  subtopicId: number;
  answered: boolean;
  /** TKP: true kalau memilih opsi berbobot tertinggi. */
  isCorrect: boolean;
  score: number;
  maxScore: number;
};

export type AttemptScore = {
  totalScore: number;
  maxScore: number;
  questions: QuestionScore[];
};

export const TWK_TIU_CORRECT_POINTS = 5;
export const STANDARD_DEFAULT_POINTS = 1;

function correctPoints(mode: ScoringMode, question: ScorableQuestion) {
  if (mode === "twk_tiu") return TWK_TIU_CORRECT_POINTS;
  return question.pointsOverride ?? STANDARD_DEFAULT_POINTS;
}

export function scoreQuestion(
  mode: ScoringMode,
  question: ScorableQuestion,
  selectedOptionId: number | null | undefined,
): QuestionScore {
  // Opsi yang tidak milik soal ini dianggap tidak dijawab (defensif
  // terhadap payload client yang dimanipulasi).
  const selected =
    selectedOptionId == null
      ? undefined
      : question.options.find((o) => o.id === selectedOptionId);
  const base = {
    questionId: question.questionId,
    subtopicId: question.subtopicId,
    answered: selected !== undefined,
  };

  if (mode === "tkp") {
    const maxScore = Math.max(0, ...question.options.map((o) => o.scoreWeight ?? 0));
    const score = selected?.scoreWeight ?? 0;
    return { ...base, isCorrect: selected !== undefined && score === maxScore, score, maxScore };
  }

  const maxScore = correctPoints(mode, question);
  const isCorrect = selected?.isCorrect === true;
  return { ...base, isCorrect, score: isCorrect ? maxScore : 0, maxScore };
}

export function scoreAttempt(
  mode: ScoringMode,
  questions: ScorableQuestion[],
  answers: AnswerMap,
): AttemptScore {
  const scored = questions.map((q) => scoreQuestion(mode, q, answers.get(q.questionId)));
  return {
    totalScore: scored.reduce((sum, q) => sum + q.score, 0),
    maxScore: scored.reduce((sum, q) => sum + q.maxScore, 0),
    questions: scored,
  };
}
