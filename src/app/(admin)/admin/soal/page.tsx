import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenText, FileUp, Plus } from "lucide-react";
import { QuestionBank } from "@/components/admin/question-bank";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { buildTopicTree } from "@/lib/question-bank-types";
import { QUESTION_STATUSES } from "@/lib/validation/enums";
import { listQuestions } from "@/server/queries/question-bank";

export const metadata: Metadata = { title: "Bank Soal" };

export default async function AdminSoalPage({ searchParams }: PageProps<"/admin/soal">) {
  const { status } = await searchParams;
  const initialStatus = QUESTION_STATUSES.find((s) => s === status) ?? "all";
  const questions = await listQuestions();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Bank Soal"
        description="Semua soal per Jenjang → Mata Uji → Subdomain. Soal baru masuk sebagai draft dan baru tampil ke siswa setelah diterbitkan."
        actions={
          <>
            <Button variant="outline" nativeButton={false} render={<Link href="/admin/soal/import" />}>
              <FileUp aria-hidden /> Import Excel
            </Button>
            <Button variant="outline" nativeButton={false} render={<Link href="/admin/soal/stimulus" />}>
              <BookOpenText aria-hidden /> Stimulus
            </Button>
            <Button nativeButton={false} render={<Link href="/admin/soal/baru" />}>
              <Plus aria-hidden /> Tambah Soal
            </Button>
          </>
        }
      />
      {questions.length === 0 ? (
        <div className="surface-card flex flex-col items-center gap-4 px-6 py-16 text-center">
          <div>
            <h2 className="text-lg font-bold">Bank soal masih kosong</h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Tambahkan soal satu per satu atau import banyak soal sekaligus dari Excel.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button nativeButton={false} render={<Link href="/admin/soal/baru" />}>
              <Plus aria-hidden /> Tambah Soal
            </Button>
            <Button variant="outline" nativeButton={false} render={<Link href="/admin/soal/import" />}>
              <FileUp aria-hidden /> Import Excel
            </Button>
          </div>
        </div>
      ) : (
        <QuestionBank tree={buildTopicTree(questions)} questions={questions} initialStatus={initialStatus} />
      )}
    </div>
  );
}
