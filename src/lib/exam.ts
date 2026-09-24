// Tipe & helper yang aman dikirim ke client selama ujian.
// SENGAJA tidak ada isCorrect / scoreWeight — kunci jawaban tetap di server.

export type ExamOption = { id: number; label: string; text: string };

export type ExamQuestion = {
  id: number;
  text: string;
  imageUrl: string | null;
  options: ExamOption[];
};

export type ExamAnswerState = {
  selectedOptionId: number | null;
  isFlagged: boolean;
};

export type SaveAnswerFn = (input: {
  questionId: number;
  selectedOptionId: number | null;
  isFlagged: boolean;
}) => Promise<{ ok: boolean; error?: string }>;

export type SubmitAttemptFn = () => Promise<{ ok: boolean; error?: string; redirectTo?: string }>;

export function remainingMs(endsAtMs: number, nowMs: number) {
  return Math.max(0, endsAtMs - nowMs);
}

/** 3725000 → "01:02:05", 125000 → "02:05" */
export function formatDuration(ms: number) {
  const totalSeconds = Math.ceil(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
