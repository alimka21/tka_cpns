import type { Metadata } from "next";
import { FrameworkBrowser, type BrowserFramework } from "@/components/admin/framework-browser";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { FRAMEWORKS } from "@/server/asesmen";
import { BookOpen, FolderTree, Layers, ListTree } from "lucide-react";

export const metadata: Metadata = { title: "Kerangka Asesmen" };

// Hierarki konten dibaca langsung dari kerangka asesmen (asesmen/tka-*.json).
// Tabel DB diisi dari sumber yang sama lewat `npm run db:seed:asesmen`.
export default function AdminTopikPage() {
  const frameworks: BrowserFramework[] = Object.values(FRAMEWORKS).map((fw) => ({
    jenjang: fw.jenjang,
    jenjangName: fw.jenjangName,
    regulation: fw.regulation.number,
    electiveCount: fw.selectionRule?.electiveCount ?? null,
    subjects: fw.subjects.map((s) => ({
      code: s.code,
      name: s.name,
      type: s.type,
      structure: s.structure,
      levels: s.cognitiveLevels.map((l) => l.code),
      domains: s.domains.map((d) => ({
        code: d.code,
        name: d.name,
        subdomains: d.subdomains.map((sub) => ({
          code: sub.code,
          name: sub.name,
          description: sub.description,
          competencies: sub.competencies,
          scope: sub.scope,
          limits: sub.limits,
        })),
      })),
    })),
  }));

  const all = Object.values(FRAMEWORKS);
  const subjects = all.flatMap((f) => f.subjects);
  const domains = subjects.flatMap((s) => s.domains);
  const subdomains = domains.flatMap((d) => d.subdomains);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Kerangka Asesmen TKA"
        description="Jenjang → Mata Uji → Domain → Subdomain sesuai kerangka resmi BSKAP. Setiap soal wajib tertaut ke satu kode subdomain — itulah unit analisis kelemahan siswa."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Jenjang" value={String(all.length)} icon={Layers} />
        <StatCard label="Mata uji" value={String(subjects.length)} icon={BookOpen} tone="success" />
        <StatCard label="Domain" value={String(domains.length)} icon={FolderTree} tone="cta" />
        <StatCard label="Subdomain" value={String(subdomains.length)} icon={ListTree} tone="muted" />
      </div>
      <FrameworkBrowser frameworks={frameworks} />
    </div>
  );
}
