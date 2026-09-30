import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChevronRight, Dumbbell, PlayCircle } from "lucide-react";
import { PracticeStartForm, type PracticeOption } from "@/components/latihan/practice-start-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { MAX_PRACTICE_TARGETS } from "@/lib/practice";
import { requireUser } from "@/server/auth/session";
import { countPublishedBySubtopic, listPracticeHistory } from "@/server/queries/practice";
import { getStudentProgress } from "@/server/queries/progress";
import { getMaskedGeminiKey } from "@/server/services/ai-key";

export const metadata: Metadata = { title: "Latihan Kelemahan" };
export const dynamic = "force-dynamic";

// Urutan tampilan pilihan: yang paling perlu dilatih dulu.
const STATUS_ORDER = { perlu_latihan: 0, cukup: 1, insufficient: 2, baik: 3 } as const;

export default async function LatihanPage({ searchParams }: PageProps<"/latihan">) {
  const { user } = await requireUser("/latihan");
  const userId = Number(user.id);
  const [progress, history, maskedKey] = await Promise.all([
    getStudentProgress(userId),
    listPracticeHistory(userId, 20),
    getMaskedGeminiKey(userId),
  ]);
  const hasKey = maskedKey != null;

  const diagnosed = progress.subjects.flatMap((subject) =>
    subject.domains.flatMap((domain) =>
      domain.subdomains.flatMap((s) =>
        s.diagnosis ? [{ subtopicId: s.id, name: s.name, context: `${subject.jenjang} · ${subject.name} · ${domain.name}`, diagnosis: s.diagnosis }] : [],
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
    .sort((a, b) => STATUS_ORDER[a.status as keyof typeof STATUS_ORDER] - STATUS_ORDER[b.status as keyof typeof STATUS_ORDER] || a.accuracy - b.accuracy);

  // Pilihan awal: ?sub=ID (dari tombol di dashboard/progres), atau prioritas diagnosa.
  const { sub } = await searchParams;
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

  const active = history.find((h) => h.status === "in_progress");
  const past = history.filter((h) => h.status !== "in_progress");

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-[1.75rem]">
          <Dumbbell className="size-7 text-primary" aria-hidden /> Latihan Kelemahan
        </h1>
        <p className="mt-1 max-w-3xl text-muted-foreground">
          Latihan singkat yang hanya berisi soal dari subdomain yang paling perlu kamu perkuat. Tanpa batas waktu, dan
          setiap soal langsung menampilkan benar/salah beserta pembahasannya. Hasilnya ikut memperbarui{" "}
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

      <section aria-labelledby="mulai-heading" className="surface-card p-6">
        <h2 id="mulai-heading" className="text-lg font-bold">
          {active ? "Atau mulai latihan baru" : "Mulai latihan baru"}
        </h2>
        {options.length === 0 ? (
          <div className="mt-4 flex flex-col items-start gap-3">
            <p className="text-sm text-muted-foreground">
              Kerjakan minimal satu paket tes dulu supaya sistem tahu subdomain mana yang perlu kamu latih.
            </p>
            <Button nativeButton={false} render={<Link href="/dashboard#paket-heading" />}>
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

      {past.length > 0 && (
        <section aria-labelledby="riwayat-latihan-heading" className="flex flex-col gap-4">
          <h2 id="riwayat-latihan-heading" className="text-xl font-bold">
            Riwayat latihan
          </h2>
          <ul className="surface-card divide-y">
            {past.map((h) => (
              <li key={h.id}>
                <Link
                  href={`/latihan/${h.id}/hasil`}
                  className="flex items-center gap-4 p-5 transition-colors hover:bg-muted/50"
                >
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
