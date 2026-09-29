import type { Metadata } from "next";
import { QuestionForm } from "@/components/admin/question-form";
import { PageHeader } from "@/components/layout/page-header";
import { stimulusOptions, subdomainOptions } from "../form-options";

export const metadata: Metadata = { title: "Tambah Soal" };

export default async function AdminTambahSoalPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Tambah Soal"
        description="Pilih bentuk soal — field kunci jawaban menyesuaikan. Aturan sama dengan import Excel."
      />
      <QuestionForm subdomains={subdomainOptions()} stimuli={await stimulusOptions()} />
    </div>
  );
}
