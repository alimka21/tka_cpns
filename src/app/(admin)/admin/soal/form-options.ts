// Pilihan dropdown form soal (Tambah & Edit): subdomain dari kerangka
// asesmen (sumber kebenaran) + daftar stimulus di DB.

import type { StimulusOption, SubdomainOption } from "@/components/admin/question-form";
import { FRAMEWORKS } from "@/server/asesmen";
import { listStimuli } from "@/server/queries/question-bank";

export function subdomainOptions(): SubdomainOption[] {
  return Object.values(FRAMEWORKS).flatMap((fw) =>
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
}

export async function stimulusOptions(): Promise<StimulusOption[]> {
  return (await listStimuli()).map((st) => ({
    id: st.id,
    code: st.code,
    title: st.title,
    questionCount: st.questions.length,
  }));
}
