import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Download, FileText, Lock, PlayCircle } from "lucide-react";
import { PublicFooter, PublicHeader } from "@/components/landing/public-shell";
import { UtmLink } from "@/components/landing/utm-link";
import { Button } from "@/components/ui/button";
import { LEAD_MAGNET_FORMATS } from "@/lib/validation/lead-magnet";
import { getSession } from "@/server/auth/session";
import { getCtaPackage, getLeadMagnetMeta, previewImagePath } from "@/server/services/lead-magnets";

// Lead magnet: tujuan link kampanye (DM Instagram, bio, story) — mis.
// /materi/tips-gelombang-2?utm_source=instagram&utm_medium=dm&utm_campaign=gel2&utm_content=file.
// UTM ditangkap src/proxy.ts; tombol daftar/masuk membawa utm_* (UtmLink). Dirender per kunjungan.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/materi/[slug]">): Promise<Metadata> {
  const meta = await getLeadMagnetMeta((await params).slug);
  if (!meta?.isActive) return {};
  const description = (meta.description ?? `Unduh gratis: ${meta.title}`).slice(0, 300);
  const path = `/materi/${meta.slug}`;
  return {
    title: meta.title,
    description,
    alternates: { canonical: path },
    openGraph: { title: meta.title, description, url: path, ...(meta.hasPreviewImage ? { images: [previewImagePath(meta)] } : {}) },
  };
}

function formatSize(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default async function LeadMagnetPage({ params }: PageProps<"/materi/[slug]">) {
  const meta = await getLeadMagnetMeta((await params).slug);
  if (!meta?.isActive) notFound();
  const [session, ctaPackage] = await Promise.all([getSession(), getCtaPackage(meta.ctaPackageId)]);
  const path = `/materi/${meta.slug}`;
  const pending = session && session.user.role !== "admin" && session.user.status !== "active";
  const canDownload = !meta.requiresLogin || (session && !pending);
  const format = Object.values(LEAD_MAGNET_FORMATS).find((f) => f.mime === meta.fileMime)?.label ?? "File";

  return (
    <div className="flex flex-1 flex-col bg-card">
      <PublicHeader />
      <main className="flex-1">
        <section className="bg-gradient-to-b from-primary-soft to-card">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
            <div className="flex flex-col gap-3">
              <span className="flex w-fit items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-semibold text-primary">
                <FileText className="size-3.5" aria-hidden /> Materi gratis · {format} · {formatSize(meta.fileSize)}
              </span>
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-4xl">{meta.title}</h1>
              {meta.description && <p className="whitespace-pre-line text-base text-muted-foreground sm:text-lg">{meta.description}</p>}
            </div>

            {meta.hasPreviewImage && (
              // eslint-disable-next-line @next/next/no-img-element -- gambar dari route /materi/<slug>/pratinjau (DB, cache publik panjang)
              <img
                src={previewImagePath(meta)}
                alt={`Pratinjau ${meta.title}`}
                className="w-full rounded-2xl border bg-background shadow-sm"
                loading="eager"
              />
            )}

            {meta.previewText && (
              <div className="relative overflow-hidden rounded-2xl border bg-background p-5">
                <p className="max-h-72 whitespace-pre-line text-sm leading-relaxed sm:text-base">{meta.previewText}</p>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background" aria-hidden />
              </div>
            )}

            <div className="flex flex-col gap-3">
              {canDownload ? (
                <Button size="lg" variant="cta" className="w-full sm:w-fit" nativeButton={false} render={<a href={`${path}/unduh`} />}>
                  <Download aria-hidden /> Unduh materi
                </Button>
              ) : pending ? (
                <p role="status" className="rounded-lg border border-warning/40 bg-warning-soft px-3 py-2.5 text-sm text-warning-strong">
                  Akunmu sedang menunggu konfirmasi admin. Materi bisa diunduh setelah akun aktif.
                </p>
              ) : (
                <>
                  <Button
                    size="lg"
                    variant="cta"
                    className="w-full sm:w-fit"
                    nativeButton={false}
                    render={<UtmLink href={`/daftar?next=${encodeURIComponent(path)}`} />}
                  >
                    <Lock aria-hidden /> Daftar gratis untuk unduh
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Sudah punya akun?{" "}
                    <UtmLink href={`/masuk?next=${encodeURIComponent(path)}`} className="font-semibold text-primary hover:underline">
                      Masuk untuk unduh
                    </UtmLink>
                  </p>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-3xl px-4 pb-12 sm:px-6">
          <div className="flex flex-col gap-4 rounded-3xl bg-primary px-5 py-8 text-primary-foreground sm:px-8">
            <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">Sudah baca materinya? Uji kemampuanmu.</h2>
            <p className="text-white/80">
              {ctaPackage
                ? `Kerjakan “${ctaPackage.title}” dan lihat analisis kelemahanmu per subtopik.`
                : "Coba tes TKA singkat dan lihat analisis kelemahanmu per subtopik — tanpa perlu daftar."}
            </p>
            <Button
              size="lg"
              variant="cta"
              className="w-full sm:w-fit"
              nativeButton={false}
              render={ctaPackage ? <UtmLink href={`/tes/${ctaPackage.id}`} /> : <Link href="/tes/demo" />}
            >
              {ctaPackage ? <ArrowRight aria-hidden /> : <PlayCircle aria-hidden />}
              {ctaPackage ? (ctaPackage.isPremium ? "Coba paket (Premium)" : "Coba paket tes gratis") : "Coba Demo Tes"}
            </Button>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
