import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenText, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime, scoreTone } from "@/lib/format";
import { cn } from "@/lib/utils";
import { requireUser } from "@/server/auth/session";
import { listStudentHistory } from "@/server/queries/attempts";
import { listPracticeHistory, type PracticeHistoryItem } from "@/server/queries/practice";

export const metadata: Metadata = { title: "Riwayat Tes" };
export const dynamic = "force-dynamic";

const HISTORY_LIMIT = 200;

export default async function RiwayatPage({ searchParams }: PageProps<"/riwayat">) {
  const { user } = await requireUser("/riwayat");
  const [history, practice] = await Promise.all([
    listStudentHistory(Number(user.id), HISTORY_LIMIT),
    listPracticeHistory(Number(user.id), HISTORY_LIMIT),
  ]);

  const { jenjang: jenjangParam, jenis } = await searchParams;
  const tab = jenis === "latihan" ? "latihan" : "tes";
  const jenjangs = [...new Set(history.map((h) => h.jenjang))];
  const jenjang = typeof jenjangParam === "string" && jenjangs.includes(jenjangParam) ? jenjangParam : null;
  const visible = jenjang ? history.filter((h) => h.jenjang === jenjang) : history;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-[1.75rem]">Riwayat Tes</h1>
        <p className="mt-1 text-muted-foreground">
          Semua tes resmi dan sesi latihan. Buka hasil untuk analisis per subdomain, atau pembahasan untuk belajar dari kesalahan.{" "}
          <Link href="/progres" className="font-semibold text-primary hover:underline">
            Lihat progres kemampuan
          </Link>
        </p>
      </header>

      <nav aria-label="Jenis riwayat" className="flex gap-1 border-b">
        {(
          [
            ["tes", `Tes resmi (${history.length})`, "/riwayat"],
            ["latihan", `Latihan (${practice.length})`, "/riwayat?jenis=latihan"],
          ] as const
        ).map(([key, label, href]) => (
          <Link
            key={key}
            href={href}
            aria-current={tab === key ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-4 py-2 text-sm font-semibold",
              tab === key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </Link>
        ))}
      </nav>

      {tab === "latihan" ? (
        <PracticeList items={practice} />
      ) : (
        <>
          {jenjangs.length > 1 && (
            <nav aria-label="Saring jenjang" className="flex flex-wrap gap-2">
              {[null, ...jenjangs].map((j) => (
                <Link
                  key={j ?? "semua"}
                  href={j ? `/riwayat?jenjang=${j}` : "/riwayat"}
                  aria-current={jenjang === j ? "page" : undefined}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                    jenjang === j ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
                  )}
                >
                  {j ? `TKA ${j}` : "Semua"}
                </Link>
              ))}
            </nav>
          )}

          {visible.length === 0 ? (
            <section className="surface-card flex flex-col items-center gap-4 px-6 py-16 text-center">
              <p className="text-sm text-muted-foreground">Belum ada tes yang selesai.</p>
              <Button nativeButton={false} render={<Link href="/dashboard#paket-heading" />}>
                Pilih paket tes <ArrowRight aria-hidden />
              </Button>
            </section>
          ) : (
            <ul className="surface-card divide-y">
              {visible.map((item) => {
                const tone = scoreTone(item.score);
                return (
                  <li key={item.attemptId} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:gap-6">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 text-xs font-medium text-muted-foreground">
                        <span>
                          {item.jenjang} · {formatDateTime(item.finishedAt)}
                        </span>
                        {item.status === "expired" && <Badge variant="outline">Waktu habis</Badge>}
                      </div>
                      <Link href={`/hasil/${item.attemptId}`} className="mt-0.5 block font-semibold hover:text-primary">
                        {item.packageTitle}
                      </Link>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {item.correct} benar dari {item.total} soal
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold tabular-nums">{item.score}</div>
                        <Badge variant={tone.variant}>{tone.label}</Badge>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Button size="sm" nativeButton={false} render={<Link href={`/hasil/${item.attemptId}`} />}>
                          Hasil <ChevronRight aria-hidden />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          nativeButton={false}
                          render={<Link href={`/hasil/${item.attemptId}/pembahasan`} />}
                        >
                          <BookOpenText aria-hidden /> Pembahasan
                        </Button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {history.length >= HISTORY_LIMIT && (
            <p className="text-center text-xs text-muted-foreground">Menampilkan {HISTORY_LIMIT} tes terbaru.</p>
          )}
        </>
      )}
    </div>
  );
}

function PracticeList({ items }: { items: PracticeHistoryItem[] }) {
  if (items.length === 0) {
    return (
      <section className="surface-card flex flex-col items-center gap-4 px-6 py-16 text-center">
        <p className="text-sm text-muted-foreground">Belum ada sesi latihan.</p>
        <Button nativeButton={false} render={<Link href="/latihan" />}>
          Mulai latihan kelemahan <ArrowRight aria-hidden />
        </Button>
      </section>
    );
  }
  return (
    <ul className="surface-card divide-y">
      {items.map((h) => (
        <li key={h.id}>
          <Link
            href={h.status === "in_progress" ? `/latihan/${h.id}` : `/latihan/${h.id}/hasil`}
            className="flex items-center gap-4 p-5 transition-colors hover:bg-muted/50"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 text-xs font-medium text-muted-foreground">
                <span>{formatDateTime(h.completedAt ?? h.startedAt)}</span>
                {h.status === "in_progress" && <Badge variant="info">Sedang berjalan</Badge>}
                {h.status === "abandoned" && <Badge variant="outline">Tidak diselesaikan</Badge>}
              </div>
              <div className="mt-0.5 truncate font-semibold">{h.subtopics.join(" · ")}</div>
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
  );
}
