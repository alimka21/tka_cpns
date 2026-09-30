import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PracticeShell } from "@/components/latihan/practice-shell";
import { answerPracticeAction, finishPracticeAction } from "@/server/actions/practice";
import { requireUser } from "@/server/auth/session";
import { getPracticeSession } from "@/server/queries/practice";

export const metadata: Metadata = { title: "Latihan Kelemahan" };
export const dynamic = "force-dynamic";

const NOTICES: Record<string, { tone: "info" | "warning"; text: string }> = {
  no_key: {
    tone: "warning",
    text: "Bank soal belum cukup untuk jumlah yang kamu minta. Simpan API key Gemini-mu di Pengaturan supaya AI bisa menambah soal latihan berikutnya.",
  },
  limit: { tone: "warning", text: "Bank soal belum cukup dan batas Latihan AI hari ini sudah tercapai — sesi ini memakai soal bank yang ada." },
  failed: { tone: "warning", text: "AI gagal menambah soal kali ini (coba lagi nanti) — sesi ini memakai soal bank yang ada." },
};

export default async function LatihanSessionPage({ params, searchParams }: PageProps<"/latihan/[sessionId]">) {
  const { sessionId: raw } = await params;
  const sessionId = Number(raw);
  if (!Number.isInteger(sessionId) || sessionId <= 0) notFound();

  const { user } = await requireUser(`/latihan/${sessionId}`);
  const session = await getPracticeSession(sessionId, Number(user.id));
  if (!session) notFound();
  if (session.status !== "in_progress") redirect(`/latihan/${sessionId}/hasil`);

  const { ai } = await searchParams;
  const aiCount = session.items.filter((i) => i.isAi).length;
  const notice =
    typeof ai === "string" && NOTICES[ai]
      ? NOTICES[ai]
      : aiCount > 0
        ? {
            tone: "info" as const,
            text: `${aiCount} soal berlabel “Latihan AI” dibuat khusus untukmu karena bank soal belum cukup. Soal AI tidak direview admin — kalau menemukan kesalahan, tekan “Laporkan soal”.`,
          }
        : null;

  return (
    <PracticeShell
      items={session.items.map((i) => ({ itemId: i.itemId, subtopic: i.subtopic, isAi: i.isAi, question: i.question, review: i.review }))}
      notice={notice}
      stimuli={session.stimuli}
      answer={answerPracticeAction.bind(null, sessionId)}
      finish={finishPracticeAction.bind(null, sessionId)}
    />
  );
}
