import type { Metadata } from "next";
import { ExamShell } from "@/components/tes/exam-shell";
import { DEMO_DURATION_MINUTES, DEMO_TITLE, demoExamQuestions, demoExamStimuli } from "@/server/demo/demo-test";
import { demoSaveAnswer, demoSubmitAttempt } from "./actions";

export const metadata: Metadata = { title: "Demo TKA" };

// Demo publik UI pengerjaan tes (tanpa database) — ditautkan dari landing.
// Soal & kunci di src/server/demo/demo-test.ts; hasil di /tes/demo/hasil.

export const dynamic = "force-dynamic";

export default function DemoTesPage() {
  const now = new Date();
  const endsAt = new Date(now.getTime() + DEMO_DURATION_MINUTES * 60_000);
  return (
    <ExamShell
      title={DEMO_TITLE}
      questions={demoExamQuestions()}
      stimuli={demoExamStimuli()}
      initialAnswers={{}}
      endsAt={endsAt.toISOString()}
      serverNow={now.toISOString()}
      saveAnswer={demoSaveAnswer}
      submitAttempt={demoSubmitAttempt}
      sendAnswersOnSubmit
    />
  );
}
