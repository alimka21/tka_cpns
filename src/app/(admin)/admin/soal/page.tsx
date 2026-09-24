import type { Metadata } from "next";
import Link from "next/link";
import { FileUp, Plus } from "lucide-react";
import { QuestionBank } from "@/components/admin/question-bank";
import { DemoDataNotice, PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { demoQuestions, demoTopicTree } from "@/lib/demo-data";
import { QUESTION_STATUSES } from "@/lib/validation/enums";

export const metadata: Metadata = { title: "Bank Soal" };

// TODO: ganti data contoh dengan query questions + topik/subtopik (Drizzle).
export default async function AdminSoalPage({ searchParams }: PageProps<"/admin/soal">) {
  const { status } = await searchParams;
  const initialStatus = QUESTION_STATUSES.find((s) => s === status) ?? "all";

  return (
    <div className="flex flex-col gap-8">
      <DemoDataNotice />
      <PageHeader
        title="Bank Soal"
        description="Semua soal per Jenjang → Mata Pelajaran → Subtopik. Soal hasil import & AI wajib direview sebelum tayang."
        actions={
          <>
            <Button variant="outline" nativeButton={false} render={<Link href="/admin/soal/import" />}>
              <FileUp aria-hidden /> Import Excel
            </Button>
            <Button disabled title="Form tambah soal tersedia setelah database tersambung">
              <Plus aria-hidden /> Tambah Soal
            </Button>
          </>
        }
      />
      <QuestionBank tree={demoTopicTree} questions={demoQuestions} initialStatus={initialStatus} />
    </div>
  );
}
