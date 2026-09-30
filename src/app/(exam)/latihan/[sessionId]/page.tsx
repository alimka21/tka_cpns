import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PracticeShell } from "@/components/latihan/practice-shell";
import { answerPracticeAction, finishPracticeAction } from "@/server/actions/practice";
import { requireUser } from "@/server/auth/session";
import { getPracticeSession } from "@/server/queries/practice";

export const metadata: Metadata = { title: "Latihan Kelemahan" };
export const dynamic = "force-dynamic";

export default async function LatihanSessionPage({ params }: PageProps<"/latihan/[sessionId]">) {
  const { sessionId: raw } = await params;
  const sessionId = Number(raw);
  if (!Number.isInteger(sessionId) || sessionId <= 0) notFound();

  const { user } = await requireUser(`/latihan/${sessionId}`);
  const session = await getPracticeSession(sessionId, Number(user.id));
  if (!session) notFound();
  if (session.status !== "in_progress") redirect(`/latihan/${sessionId}/hasil`);

  return (
    <PracticeShell
      items={session.items.map((i) => ({ itemId: i.itemId, subtopic: i.subtopic, question: i.question, review: i.review }))}
      stimuli={session.stimuli}
      answer={answerPracticeAction.bind(null, sessionId)}
      finish={finishPracticeAction.bind(null, sessionId)}
    />
  );
}
