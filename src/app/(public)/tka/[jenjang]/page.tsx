import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpen, FileQuestion, Layers, Timer } from "lucide-react";
import { Breadcrumbs, FaqList, FORM_INFO, MateriCta } from "@/components/landing/materi-parts";
import { PublicFooter, PublicHeader } from "@/components/landing/public-shell";
import { breadcrumbLd, faqLd, JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { packageRuleFor } from "@/lib/package-rules";
import { absoluteUrl, JENJANG_LABEL, JENJANG_SLUGS, jenjangPath, subjectPath, type JenjangSlug } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";
import { FRAMEWORKS, type Framework } from "@/server/asesmen";
import { subjectStatsByCode } from "@/server/queries/seo";

// Konten dari file kerangka (asesmen/*.json) + angka paket/soal dari DB.
// Dirender per kunjungan (seperti landing): prerender + ISR (`dynamicParams = false`)
// membuat rute ini 404 di hosting produksi (DECISIONS 2026-10-17). Slug tak dikenal → notFound().
export const dynamic = "force-dynamic";

function frameworkOf(slug: string): Framework | null {
  const code = JENJANG_SLUGS[slug as JenjangSlug];
  return code ? FRAMEWORKS[code] : null;
}

export async function generateMetadata({ params }: PageProps<"/tka/[jenjang]">): Promise<Metadata> {
  const fw = frameworkOf((await params).jenjang);
  if (!fw) return {};
  const label = JENJANG_LABEL[fw.jenjang];
  const names = fw.subjects.filter((s) => s.type === "wajib").map((s) => s.name);
  const title = `Latihan Soal & Kisi-kisi TKA ${label} Online + Pembahasan`;
  const description = `Latihan soal TKA ${label} sesuai Kerangka Asesmen ${fw.regulation.number}: ${names.join(", ")}${
    fw.subjects.some((s) => s.type === "pilihan") ? ", dan mapel pilihan" : ""
  }. Materi per elemen & subelemen, bentuk soal resmi, tryout ber-timer, dan analisis kelemahan.`;
  return { title, description, alternates: { canonical: jenjangPath(fw.jenjang) }, openGraph: { title, description, url: jenjangPath(fw.jenjang) } };
}

function faqsFor(fw: Framework) {
  const label = JENJANG_LABEL[fw.jenjang];
  const wajib = fw.subjects.filter((s) => s.type === "wajib");
  const pilihan = fw.subjects.filter((s) => s.type === "pilihan");
  const faqs = [
    {
      q: `Apa saja mata pelajaran TKA ${label}?`,
      a: `Mata uji wajib TKA ${label}: ${wajib.map((s) => s.name).join(", ")}.${
        pilihan.length && fw.selectionRule
          ? ` Selain itu murid memilih ${fw.selectionRule.electiveCount} dari ${pilihan.length} mata uji pilihan, antara lain ${pilihan
              .slice(0, 5)
              .map((s) => s.name)
              .join(", ")}.`
          : ""
      }`,
    },
    {
      q: `Apa saja bentuk soal TKA ${label}?`,
      a: `Menurut Kerangka Asesmen, bentuk soalnya ${fw.questionForms.map((f) => FORM_INFO[f]?.name ?? f).join(", ")}. Soal bisa berdiri sendiri atau berkelompok mengacu pada satu stimulus (bacaan, tabel, grafik, atau gambar).`,
    },
    {
      q: `Apa acuan materi TKA ${label}?`,
      a: `Kerangka Asesmen TKA ${fw.jenjangName} yang ditetapkan BSKAP Kemendikdasmen (${fw.regulation.number}). Setiap mata uji dibagi menjadi elemen/kompetensi dan subelemen; soal di ${SITE_NAME} dipetakan ke subelemen tersebut.`,
    },
    {
      q: `Apakah latihan soal TKA ${label} di ${SITE_NAME} gratis?`,
      a: `Ya, daftar gratis. Akun gratis bisa mengerjakan 1 paket tes gratis di setiap mata pelajaran dan melihat skor serta kunci jawaban. Premium membuka semua paket, pembahasan tiap soal, dan analisis kelemahan per subtopik.`,
    },
  ];
  return faqs;
}

export default async function JenjangPage({ params }: PageProps<"/tka/[jenjang]">) {
  const fw = frameworkOf((await params).jenjang);
  if (!fw) notFound();
  const label = JENJANG_LABEL[fw.jenjang];
  const stats = await subjectStatsByCode(fw.jenjang);
  const total = stats ? [...stats.values()].reduce((a, s) => ({ packages: a.packages + s.packages, questions: a.questions + s.questions }), { packages: 0, questions: 0 }) : null;
  const groups = [
    { title: "Mata uji wajib", items: fw.subjects.filter((s) => s.type === "wajib") },
    { title: "Mata uji pilihan", items: fw.subjects.filter((s) => s.type === "pilihan") },
  ].filter((g) => g.items.length > 0);
  const faqs = faqsFor(fw);
  const crumbs = [
    { name: "Beranda", href: "/" },
    { name: `TKA ${label}` },
  ];

  return (
    <div className="flex flex-1 flex-col bg-card">
      <JsonLd data={breadcrumbLd([{ name: "Beranda", url: absoluteUrl("/") }, { name: `TKA ${label}`, url: absoluteUrl(jenjangPath(fw.jenjang)) }])} />
      <JsonLd data={faqLd(faqs)} />
      <PublicHeader />
      <main className="flex-1">
        <section className="bg-gradient-to-b from-primary-soft to-card">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-12 sm:px-6 lg:py-16">
            <Breadcrumbs items={crumbs} />
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
              Latihan Soal & Kisi-kisi <span className="text-primary">TKA {label}</span>
            </h1>
            <p className="max-w-3xl text-lg text-muted-foreground">
              Tes Kemampuan Akademik (TKA) {fw.jenjangName} mengikuti Kerangka Asesmen BSKAP {fw.regulation.number}. Di halaman ini ada
              daftar mata uji, materi per elemen, dan bentuk soalnya — lalu latih langsung dengan paket tes ber-timer dan pembahasan.
            </p>
            {total && total.packages + total.questions > 0 && (
              <ul className="flex flex-wrap gap-3 text-sm">
                {total.packages > 0 && (
                  <li className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 font-semibold">
                    <Layers className="size-4 text-primary" aria-hidden /> {total.packages} paket tes {fw.jenjang}
                  </li>
                )}
                {total.questions > 0 && (
                  <li className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 font-semibold">
                    <FileQuestion className="size-4 text-primary" aria-hidden /> {total.questions.toLocaleString("id-ID")} soal berpembahasan
                  </li>
                )}
              </ul>
            )}
          </div>
        </section>

        <div className="mx-auto flex w-full max-w-5xl flex-col gap-14 px-4 py-12 sm:px-6">
          {groups.map((g) => (
            <section key={g.title} aria-labelledby={`h-${g.title}`} className="flex flex-col gap-5">
              <h2 id={`h-${g.title}`} className="text-2xl font-extrabold tracking-tight">
                {g.title} TKA {label}
                {g.title === "Mata uji pilihan" && fw.selectionRule && (
                  <span className="ml-2 align-middle text-sm font-semibold text-muted-foreground">(pilih {fw.selectionRule.electiveCount})</span>
                )}
              </h2>
              <ul className="grid gap-4 md:grid-cols-2">
                {g.items.map((s) => {
                  const st = stats?.get(s.code);
                  const rule = packageRuleFor(fw.jenjang, s);
                  const subCount = s.domains.reduce((n, d) => n + d.subdomains.length, 0);
                  return (
                    <li key={s.code}>
                      <Link href={subjectPath(fw.jenjang, s)} className="surface-card group flex h-full flex-col gap-3 p-5 transition-colors hover:border-primary/50">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-lg font-bold group-hover:text-primary">TKA {s.name}</h3>
                          {st && st.packages > 0 && <Badge variant="success">{st.packages} paket</Badge>}
                        </div>
                        <p className="line-clamp-3 text-sm text-muted-foreground">{s.description}</p>
                        <p className="mt-auto flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <BookOpen className="size-3.5" aria-hidden /> {s.domains.length} elemen · {subCount} subelemen
                          </span>
                          {rule && (
                            <span className="flex items-center gap-1">
                              <Timer className="size-3.5" aria-hidden /> {rule.questionCount} soal · {rule.durationMinutes} menit
                            </span>
                          )}
                        </p>
                        <span className="flex items-center gap-1 text-sm font-semibold text-primary">
                          Lihat kisi-kisi <ArrowRight className="size-4" aria-hidden />
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}

          <section aria-labelledby="bentuk-soal" className="flex flex-col gap-5">
            <h2 id="bentuk-soal" className="text-2xl font-extrabold tracking-tight">
              Bentuk soal TKA {label}
            </h2>
            <ul className="grid gap-4 md:grid-cols-3">
              {fw.questionForms.map((f) => (
                <li key={f} className="surface-card p-5">
                  <h3 className="font-bold">{FORM_INFO[f]?.name ?? f}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{FORM_INFO[f]?.text}</p>
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted-foreground">
              Semua bentuk ini tersedia di paket tes {SITE_NAME}, lengkap dengan stimulus bacaan, tabel, dan gambar seperti pada TKA.
            </p>
          </section>

          <section aria-labelledby="faq-jenjang" className="flex flex-col gap-5">
            <h2 id="faq-jenjang" className="text-2xl font-extrabold tracking-tight">
              Pertanyaan seputar TKA {label}
            </h2>
            <FaqList faqs={faqs} />
          </section>

          <MateriCta title={`Mulai latihan TKA ${label} sekarang`} text="Kerjakan paket tes, lihat pembahasannya, dan ketahui subtopik mana yang paling perlu kamu latih." />
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
