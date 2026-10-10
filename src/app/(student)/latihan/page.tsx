import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChevronRight, Crown, Dumbbell, Lock, PlayCircle } from "lucide-react";
import { PracticeStartForm, type PracticeOption } from "@/components/latihan/practice-start-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { MAX_PRACTICE_TARGETS } from "@/lib/practice";
import { requireUser } from "@/server/auth/session";
import { countPublishedBySubtopic, listPracticeHistory } from "@/server/queries/practice";
import { getStudentProgress } from "@/server/queries/progress";
import { getMaskedGeminiKey } from "@/server/services/ai-key";
import { hasPremium } from "@/server/services/billing";
import { listSubjectOptions, selectedSubject } from "@/server/queries/subject-filter";
import { SubjectFilter } from "@/components/student/subject-filter";

export const metadata: Metadata = { title: "Latihan Kelemahan" };
export const dynamic = "force-dynamic";

// Urutan tampilan pilihan: yang paling perlu dilatih dulu.
const STATUS_ORDER = { perlu_latihan: 0, cukup: 1, insufficient: 2, baik: 3 } as const;

export default async function LatihanPage({ searchParams }: PageProps<"/latihan">) {
  const { user } = await requireUser("/latihan");
  const userId = Number(user.id);
  // Hanya mata uji jenjang siswa saat ini (riwayat jenjang lain tetap terlihat di /progres).
  const myJenjang = user.role === "admin" ? null : (user.jenjang ?? null);
  const params = await searchParams;
  const subjectOptions = await listSubjectOptions(userId, myJenjang);
  const subject = await selectedSubject(params.mapel, subjectOptions);
  const [progress, history, latest, maskedKey, premium] = await Promise.all([
    getStudentProgress(userId, subject?.id ?? null),
    listPracticeHistory(userId, 20, subject?.id ?? null),
    // Latihan yang sedang berjalan tetap tampil walau mapelnya beda dengan filter.
    subject ? listPracticeHistory(userId, 5) : null,
    getMaskedGeminiKey(userId),
    hasPremium({ id: userId, role: user.role }, myJenjang),
  ]);
  const hasKey = maskedKey != null;

  const diagnosed = progress.subjects
    .filter((s) => !myJenjang || s.jenjang === myJenjang)
    .flatMap((subject) =>
      subject.domains.flatMap((domain) =>
        domain.subdomains.flatMap((s) =>
          s.diagnosis
            ? [
                {
                  subtopicId: s.id,
                  name: s.name,
                  context: `${subject.jenjang} · ${subject.name} · ${domain.name}`,
                  diagnosis: s.diagnosis,
                },
              ]
            : [],
        ),
      ),
    );
  const counts = await countPublishedBySubtopic(diagnosed.map((d) => d.subtopicId));
  const options: PracticeOption[] = diagnosed
    .map((d) => ({
      subtopicId: d.subtopicId,
      name: d.name,
      context: d.context,
      accuracy: d.diagnosis.accuracy,
      status: d.diagnosis.status,
      available: counts.get(d.subtopicId) ?? 0,
    }))
    .sort(
      (a, b) =>
        STATUS_ORDER[a.status as keyof typeof STATUS_ORDER] - STATUS_ORDER[b.status as keyof typeof STATUS_ORDER] ||
        a.accuracy - b.accuracy,
    );

  // Pilihan awal: ?sub=ID (dari tombol di dashboard/progres), atau prioritas diagnosa.
  const { sub } = params;
  const requested = Number(sub);
  // Dengan key Gemini, subdomain tanpa soal bank tetap bisa dilatih (Latihan AI).
  const withBank = (id: number) => hasKey || (counts.get(id) ?? 0) > 0;
  const fromPriorities = progress.priorities.map((p) => p.subtopicId).filter(withBank);
  // Belum ada prioritas (mis. soal per subdomain masih < 3) → ambil yang akurasinya terendah.
  const fallback = options.filter((o) => (hasKey || o.available > 0) && o.status !== "baik").map((o) => o.subtopicId);
  const preselected =
    Number.isInteger(requested) && withBank(requested)
      ? [requested]
      : (fromPriorities.length > 0 ? fromPriorities : fallback).slice(0, MAX_PRACTICE_TARGETS);

  const active = (latest ?? history).find((h) => h.status === "in_progress");
  const past = history.filter((h) => h.status !== "in_progress");

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-[1.75rem]">
          <Dumbbell className="size-7 text-primary" aria-hidden /> Latihan Kelemahan
        </h1>
        <p className="mt-1 max-w-3xl text-muted-foreground">
          Latihan singkat yang hanya berisi soal dari subdomain yang paling perlu kamu perkuat. Tanpa batas waktu, dan setiap soal
          langsung menampilkan benar/salah beserta pembahasannya. Hasilnya ikut memperbarui{" "}
          <Link href="/progres" className="font-semibold text-primary hover:underline">
            progres kemampuanmu
          </Link>
          , tapi tidak mengubah skor tes resmi.
        </p>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          {hasKey
            ? "Kalau soal di bank kurang, AI membuatkan soal tambahan berlabel “Latihan AI” memakai key Gemini-mu."
            : "Punya API key Gemini? Simpan di Pengaturan supaya AI bisa menambah soal saat bank kurang."}{" "}
          <Link href="/pengaturan" className="font-semibold text-primary hover:underline">
            Pengaturan
          </Link>
        </p>
      </header>

      <SubjectFilter options={subjectOptions} selected={subject?.code ?? null} basePath="/latihan" showJenjang={myJenjang == null} />

      {active && (
        <section className="surface-card flex flex-col gap-4 border-primary/40 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge variant="info">Sedang berjalan</Badge>
            <h2 className="mt-2 font-bold">{active.subtopics.join(" · ")}</h2>
            <p className="text-sm text-muted-foreground tabular-nums">
              {active.answered}/{active.total} soal dijawab · dimulai {formatDateTime(active.startedAt)}
            </p>
          </div>
          <Button size="lg" nativeButton={false} render={<Link href={`/latihan/${active.id}`} />}>
            <PlayCircle aria-hidden /> Lanjutkan
          </Button>
        </section>
      )}

      {!premium ? (
        <section className="relative overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground shadow-md sm:p-8">
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                <Lock className="size-3.5 text-cta" aria-hidden /> Fitur Premium
              </span>
              <h2 className="mt-3 text-2xl font-bold tracking-tight">Latihan khusus kelemahanmu terkunci</h2>
              <p className="mt-2 text-sm text-white/80">
                {options.length > 0
                  ? `Diagnosamu sudah menemukan ${options.filter((o) => o.status === "perlu_latihan" || o.status === "cukup").length || options.length} subdomain yang bisa dilatih. `
                  : ""}
                Buka Premium untuk latihan tanpa batas waktu yang hanya berisi soal subdomain terlemahmu, lengkap dengan
                pembahasan langsung — plus semua paket tes premium.
              </p>
            </div>
            <Button size="lg" variant="cta" nativeButton={false} render={<Link href="/langganan" />}>
              <Crown aria-hidden /> Buka Premium
            </Button>
          </div>
        </section>
      ) : (
        <section aria-labelledby="mulai-heading" className="surface-card p-6">
          <h2 id="mulai-heading" className="text-lg font-bold">
            {active ? "Atau mulai latihan baru" : "Mulai latihan baru"}
          </h2>
          {options.length === 0 ? (
            <div className="mt-4 flex flex-col items-start gap-3">
              <p className="text-sm text-muted-foreground">
                {subject
                  ? `Belum ada diagnosa ${subject.name}. Kerjakan minimal satu paket tes ${subject.name} dulu supaya sistem tahu subdomain mana yang perlu kamu latih.`
                  : "Kerjakan minimal satu paket tes dulu supaya sistem tahu subdomain mana yang perlu kamu latih."}
              </p>
              <Button nativeButton={false} render={<Link href={subject ? `/dashboard?mapel=${subject.code}#paket-heading` : "/dashboard#paket-heading"} />}>
                Pilih paket tes <ArrowRight aria-hidden />
              </Button>
            </div>
          ) : (
            <>
              <p className="mt-1 text-sm text-muted-foreground">
                Sudah dipilihkan dari diagnosamu. Boleh diganti.
                {active && " Memulai latihan baru akan menutup latihan yang sedang berjalan."}
              </p>
              <div className="mt-5">
                <PracticeStartForm options={options} preselected={preselected} hasKey={hasKey} />
              </div>
            </>
          )}
        </section>
      )}

      {past.length > 0 && (
        <section aria-labelledby="riwayat-latihan-heading" className="flex flex-col gap-4">
          <h2 id="riwayat-latihan-heading" className="text-xl font-bold">
            Riwayat latihan
          </h2>
          <ul className="surface-card divide-y">
            {past.map((h) => (
              <li key={h.id}>
                <Link href={`/latihan/${h.id}/hasil`} className="flex items-center gap-4 p-5 transition-colors hover:bg-muted/50">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-muted-foreground">
                      {formatDateTime(h.completedAt ?? h.startedAt)}
                      {h.status === "abandoned" && " · tidak diselesaikan"}
                    </div>
                    <div className="truncate font-semibold">{h.subtopics.join(" · ")}</div>
                  </div>
                  <div className="text-right text-sm tabular-nums">
                    <div className="font-bold">
                      {h.correct}/{h.answered} benar
                    </div>
                    <div className="text-xs text-muted-foreground">{h.total} soal</div>
                  </div>
                  <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
