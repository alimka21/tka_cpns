import type { Metadata } from "next";
import { QuestionForm, type StimulusOption, type SubdomainOption } from "@/components/admin/question-form";
import { DemoDataNotice, PageHeader } from "@/components/layout/page-header";
import { demoQuestions, demoStimuli } from "@/lib/demo-data";
import { FRAMEWORKS } from "@/server/asesmen";

export const metadata: Metadata = { title: "Tambah Soal" };

export default function AdminTambahSoalPage() {
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

  // TODO: ganti dengan query tabel stimuli.
  const stimuli: StimulusOption[] = demoStimuli.map((st) => ({
    id: st.id,
    code: st.code,
    title: st.title,
    questionCount: demoQuestions.filter((q) => q.stimulusCode === st.code).length,
  }));

  return (
    <div className="flex flex-col gap-8">
      <DemoDataNotice>Validasi soal sudah aktif; penyimpanan ke bank soal menyusul setelah database tersambung.</DemoDataNotice>
      <PageHeader
        title="Tambah Soal"
        description="Pilih bentuk soal — field kunci jawaban menyesuaikan. Aturan sama dengan import Excel."
      />
      <QuestionForm subdomains={subdomains} stimuli={stimuli} />
    </div>
  );
}
