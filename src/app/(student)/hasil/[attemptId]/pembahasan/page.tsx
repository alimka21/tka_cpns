import { redirect } from "next/navigation";

// Pembahasan kini menjadi tab di halaman hasil (satu soal per halaman).
// Rute lama tetap ada supaya tautan/bookmark lama tidak 404.
export default async function PembahasanRedirect({ params, searchParams }: PageProps<"/hasil/[attemptId]/pembahasan">) {
  const { attemptId } = await params;
  const { filter } = await searchParams;
  const q = new URLSearchParams({ tab: "pembahasan" });
  if (typeof filter === "string") q.set("filter", filter);
  redirect(`/hasil/${encodeURIComponent(attemptId)}?${q}`);
}
