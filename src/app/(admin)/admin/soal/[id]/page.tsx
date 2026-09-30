import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { DeleteQuestionButton } from "@/components/admin/delete-question-button";
import { QuestionForm } from "@/components/admin/question-form";
import { PageHeader } from "@/components/layout/page-header";
import { getQuestionForEdit } from "@/server/queries/question-bank";
import { imageOptions, stimulusOptions, subdomainOptions } from "../form-options";

export const metadata: Metadata = { title: "Edit Soal" };
export const dynamic = "force-dynamic";

export default async function AdminEditSoalPage({ params }: PageProps<"/admin/soal/[id]">) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const question = await getQuestionForEdit(id);
  if (!question) notFound();

  const deletable = question.usage.answers === 0 && question.usage.packages === 0;

  return (
    <div className="flex flex-col gap-8">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/admin/soal" className="hover:text-foreground">
          Bank Soal
        </Link>
        <ChevronRight className="size-4" aria-hidden />
        <span className="font-medium text-foreground">Soal #{id}</span>
      </nav>
      <PageHeader
        title={`Edit Soal #${id}`}
        description="Perubahan langsung berlaku di bank soal. Status tayang/draft diubah dari Bank Soal."
        actions={
          <DeleteQuestionButton
            id={id}
            disabledReason={
              deletable
                ? null
                : question.usage.answers > 0
                  ? "Sudah dijawab siswa — jadikan draft saja."
                  : `Masih dipakai di ${question.usage.packages} paket tes.`
            }
          />
        }
      />
      <QuestionForm key={id} subdomains={subdomainOptions()} stimuli={await stimulusOptions()} images={await imageOptions()} initial={question} />
    </div>
  );
}
