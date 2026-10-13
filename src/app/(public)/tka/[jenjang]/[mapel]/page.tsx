import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Brain, FileQuestion, Layers, Timer } from "lucide-react";
import { Breadcrumbs, FaqList, FORM_INFO, MateriCta } from "@/components/landing/materi-parts";
import { PublicFooter, PublicHeader } from "@/components/landing/public-shell";
import { breadcrumbLd, faqLd, JsonLd } from "@/components/seo/json-ld";
import { packageRuleFor } from "@/lib/package-rules";
import { absoluteUrl, JENJANG_LABEL, JENJANG_SLUGS, jenjangPath, subjectPath, subjectSlug, type JenjangSlug } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";
import { FRAMEWORKS, type Framework, type Subject } from "@/server/asesmen";
import { subjectStatsByCode } from "@/server/queries/seo";

// Kisi-kisi per mapel dari file kerangka (asesmen/*.json) + angka dari DB, diperbarui tiap jam.
export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.entries(JENJANG_SLUGS).flatMap(([jenjang, code]) => FRAMEWORKS[code].subjects.map((s) => ({ jenjang, mapel: subjectSlug(s) })));
}

function resolve(params: { jenjang: string; mapel: string }): { fw: Framework; subject: Subject } | null {
  const code = JENJANG_SLUGS[params.jenjang as JenjangSlug];
  if (!code) return null;
  const fw = FRAMEWORKS[code];
  const subject = fw.subjects.find((s) => subjectSlug(s) === params.mapel);
  return subject ? { fw, subject } : null;
}

export async function generateMetadata({ params }: PageProps<"/tka/[jenjang]/[mapel]">): Promise<Metadata> {
  const r = resolve(await params);
  if (!r) return {};
  const label = JENJANG_LABEL[r.fw.jenjang];
  const title = `Kisi-kisi & Latihan Soal TKA ${r.subject.name} ${label}`;
  const description = `Kisi-kisi TKA ${r.subject.name} ${label} sesuai Kerangka Asesmen ${r.fw.regulation.number}: ${r.subject.domains
    .map((d) => d.name)
    .join(", ")}. Latihan soal online dengan pembahasan dan analisis kelemahan per subtopik.`.slice(0, 300);
  const path = subjectPath(r.fw.jenjang, r.subject);
  return { title, description, alternates: { canonical: path }, openGraph: { title, description, url: path } };
}

function faqsFor(fw: Framework, s: Subject) {
  const label = JENJANG_LABEL[fw.jenjang];
  const rule = packageRuleFor(fw.jenjang, s);
  const faqs = [
    {
      q: `Apa saja materi TKA ${s.name} ${label}?`,
      a: `Materi TKA ${s.name} ${label} terdiri atas ${s.domains.length} ${s.structure === "kompetensi_subkompetensi" ? "kompetensi" : "elemen"}: ${s.domains
        .map((d) => `${d.name} (${d.subdomains.map((x) => x.name).join(", ")})`)
        .join("; ")}.`,
    },
    {
      q: `Apa saja bentuk soal TKA ${s.name}?`,
      a: `${fw.questionForms.map((f) => FORM_INFO[f]?.name ?? f).join(", ")}. Sebagian soal berkelompok mengacu pada satu stimulus.`,
    },
  ];
  if (rule) {
    faqs.push({
      q: `Berapa jumlah soal dan waktu TKA ${s.name} ${label}?`,
      a: `Paket tes ${s.name} di ${SITE_NAME} mengikuti format TKA: ${rule.questionCount} soal dalam ${rule.durationMinutes} menit, dengan waktu dihitung dari server.`,
    });
  }
  if (s.cognitiveLevels.length) {
    faqs.push({
      q: `Apa level kognitif soal TKA ${s.name}?`,
      a: `Soal mencakup ${s.cognitiveLevels.map((l) => `${l.name} (L${l.level})`).join(", ")}.`,
    });
  }
  return faqs;
}

export default async function MapelPage({ params }: PageProps<"/tka/[jenjang]/[mapel]">) {
  const r = resolve(await params);
  if (!r) notFound();
  const { fw, subject: s } = r;
  const label = JENJANG_LABEL[fw.jenjang];
  const stats = (await subjectStatsByCode(fw.jenjang))?.get(s.code);
  const rule = packageRuleFor(fw.jenjang, s);
  const unit = s.structure === "kompetensi_subkompetensi" ? { main: "Kompetensi", sub: "Subkompetensi" } : { main: "Elemen", sub: "Subelemen" };
  const faqs = faqsFor(fw, s);
  const related = fw.subjects.filter((x) => x.code !== s.code && (x.type === "wajib" || x.type === s.type)).slice(0, 8);
  const path = subjectPath(fw.jenjang, s);

  return (
    <div className="flex flex-1 flex-col bg-card">
      <JsonLd
        data={breadcrumbLd([
          { name: "Beranda", url: absoluteUrl("/") },
          { name: `TKA ${label}`, url: absoluteUrl(jenjangPath(fw.jenjang)) },
          { name: s.name, url: absoluteUrl(path) },
        ])}
      />
      <JsonLd data={faqLd(faqs)} />
      <PublicHeader />
      <main className="flex-1">
        <section className="bg-gradient-to-b from-primary-soft to-card">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-12 sm:px-6 lg:py-16">
            <Breadcrumbs items={[{ name: "Beranda", href: "/" }, { name: `TKA ${label}`, href: jenjangPath(fw.jenjang) }, { name: s.name }]} />
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
              Kisi-kisi & Latihan Soal <span className="text-primary">TKA {s.name}</span> {label}
            </h1>
            <p className="max-w-3xl text-lg text-muted-foreground">{s.description}</p>
            <ul className="flex flex-wrap gap-3 text-sm">
              <li className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 font-semibold">
                <Layers className="size-4 text-primary" aria-hidden /> {s.type === "wajib" ? "Mata uji wajib" : "Mata uji pilihan"}
              </li>
              {rule && (
                <li className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 font-semibold">
                  <Timer className="size-4 text-primary" aria-hidden /> {rule.questionCount} soal · {rule.durationMinutes} menit
                </li>
              )}
              {stats && stats.packages > 0 && (
                <li className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 font-semibold">
                  <Layers className="size-4 text-primary" aria-hidden /> {stats.packages} paket tes
                </li>
              )}
              {stats && stats.questions > 0 && (
                <li className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 font-semibold">
                  <FileQuestion className="size-4 text-primary" aria-hidden /> {stats.questions.toLocaleString("id-ID")} soal berpembahasan
                </li>
              )}
            </ul>
          </div>
        </section>

        <div className="mx-auto flex w-full max-w-5xl flex-col gap-14 px-4 py-12 sm:px-6">
          <section aria-labelledby="kisi-kisi" className="flex flex-col gap-5">
            <div>
              <h2 id="kisi-kisi" className="text-2xl font-extrabold tracking-tight">
                Kisi-kisi TKA {s.name} {label}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {s.domains.length} {unit.main.toLowerCase()} dan {s.domains.reduce((n, d) => n + d.subdomains.length, 0)} {unit.sub.toLowerCase()} menurut
                Kerangka Asesmen {fw.regulation.number}. Setiap soal latihan di {SITE_NAME} dipetakan ke salah satu {unit.sub.toLowerCase()} ini.
              </p>
            </div>
            <ol className="flex flex-col gap-4">
              {s.domains.map((d, i) => (
                <li key={d.code} className="surface-card p-5 sm:p-6">
                  <h3 className="text-lg font-bold">
                    <span className="text-primary">
                      {unit.main} {i + 1}.
                    </span>{" "}
                    {d.name}
                  </h3>
                  {d.description && <p className="mt-1 text-sm text-muted-foreground">{d.description}</p>}
                  <ul className="mt-4 flex flex-col gap-3">
                    {d.subdomains.map((sd) => (
                      <li key={sd.code} className="rounded-xl bg-muted/50 p-4">
                        <h4 className="font-semibold">{sd.name}</h4>
                        {sd.description && <p className="mt-1 text-sm text-muted-foreground">{sd.description}</p>}
                        {sd.scope.length > 0 && (
                          <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm text-muted-foreground">
                            {sd.scope.map((x) => (
                              <li key={x}>{x}</li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </section>

          {s.cognitiveLevels.length > 0 && (
            <section aria-labelledby="level-kognitif" className="flex flex-col gap-5">
              <h2 id="level-kognitif" className="text-2xl font-extrabold tracking-tight">
                Level kognitif soal TKA {s.name}
              </h2>
              <ul className="grid gap-4 md:grid-cols-3">
                {s.cognitiveLevels.map((l) => (
                  <li key={l.code} className="surface-card p-5">
                    <h3 className="flex items-center gap-2 font-bold">
                      <Brain className="size-4 text-primary" aria-hidden /> L{l.level} · {l.name}
                    </h3>
                    {l.description && <p className="mt-1 text-sm text-muted-foreground">{l.description}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="faq-mapel" className="flex flex-col gap-5">
            <h2 id="faq-mapel" className="text-2xl font-extrabold tracking-tight">
              Pertanyaan seputar TKA {s.name} {label}
            </h2>
            <FaqList faqs={faqs} />
          </section>

          {related.length > 0 && (
            <section aria-labelledby="mapel-lain" className="flex flex-col gap-4">
              <h2 id="mapel-lain" className="text-xl font-bold">
                Mata uji TKA {label} lainnya
              </h2>
              <ul className="flex flex-wrap gap-2">
                {related.map((x) => (
                  <li key={x.code}>
                    <Link href={subjectPath(fw.jenjang, x)} className="inline-block rounded-full border bg-background px-4 py-1.5 text-sm font-medium hover:border-primary/50 hover:text-primary">
                      TKA {x.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <MateriCta
            title={`Latihan soal TKA ${s.name} ${label} dengan pembahasan`}
            text="Kerjakan paket tes ber-timer, lihat pembahasan tiap soal, dan ketahui subelemen mana yang paling perlu kamu latih."
          />
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
