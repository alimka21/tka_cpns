import type { Metadata } from "next";
import { QuestionForm, type StimulusOption, type SubdomainOption } from "@/components/admin/question-form";
import { PageHeader } from "@/components/layout/page-header";
import { listStimuli } from "@/server/queries/question-bank";
import { FRAMEWORKS } from "@/server/asesmen";

export const metadata: Metadata = { title: "Tambah Soal" };

export default async function AdminTambahSoalPage() {
  // Subdomain & level kognitif dibaca dari kerangka asesmen (sumber kebenaran).
  const subdomains: SubdomainOption[] = Object.values(FRAMEWORKS).flatMap((fw) =>
    fw.subjects.flatMap((subject) =>
      subject.domains.flatMap((domain) =>
        domain.subdomains.map((sub) => ({
          code: sub.code,
          name: sub.name,
          group: `${fw.jenjang} · ${subject.name}`,
          levels: subject.cognitiveLevels.map((l) => ({ code: l.code, name: l.name })),
        })),
      ),
    ),
  );

  const stimuli: StimulusOption[] = (await listStimuli()).map((st) => ({
    id: st.id,
    code: st.code,
    title: st.title,
    questionCount: st.questions.length,
  }));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Tambah Soal"
        description="Pilih bentuk soal — field kunci jawaban menyesuaikan. Aturan sama dengan import Excel."
      />
      <QuestionForm subdomains={subdomains} stimuli={stimuli} />
    </div>
  );
}
