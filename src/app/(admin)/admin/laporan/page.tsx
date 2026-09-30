import type { Metadata } from "next";
import Link from "next/link";
import { Flag, Pencil } from "lucide-react";
import { ResolveReportButton } from "@/components/admin/resolve-report-button";
import { ReviewCard } from "@/components/hasil/review-card";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { REPORT_REASON_LABEL } from "@/lib/report-reasons";
import { listOpenReports } from "@/server/services/question-reports";

export const metadata: Metadata = { title: "Laporan Soal" };
export const dynamic = "force-dynamic";

export default async function AdminLaporanPage() {
  const groups = await listOpenReports();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Laporan Soal"
        description="Soal yang dilaporkan siswa (kunci salah, ambigu, di luar materi, dst.). Perbaiki soal bank lewat Edit, lalu tandai selesai. Soal “Latihan AI” adalah soal privat siswa — cukup dicatat & ditandai selesai."
      />
      {groups.length === 0 ? (
        <p className="surface-card px-6 py-12 text-center text-sm text-muted-foreground">Tidak ada laporan terbuka. 🎉</p>
      ) : (
        <ul className="flex flex-col gap-6">
          {groups.map((g) => (
            <li key={g.key} className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="danger">
                  <Flag aria-hidden /> {g.reports.length} laporan
                </Badge>
                {g.isAi ? (
                  <Badge variant="info">Latihan AI · milik {g.owner ?? "siswa"}</Badge>
                ) : (
                  <Badge variant="outline">Soal bank #{"questionId" in g.target ? g.target.questionId : ""}</Badge>
                )}
                <span className="ml-auto flex items-center gap-2">
                  {"questionId" in g.target && (
                    <Button size="sm" variant="outline" nativeButton={false} render={<Link href={`/admin/soal/${g.target.questionId}`} />}>
                      <Pencil aria-hidden /> Edit soal
                    </Button>
                  )}
                  <ResolveReportButton target={g.target} />
                </span>
              </div>
              <ul className="surface-card divide-y text-sm">
                {g.reports.map((r, i) => (
                  <li key={i} className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:items-baseline sm:gap-3">
                    <span className="font-semibold text-destructive">{REPORT_REASON_LABEL[r.reason]}</span>
                    <span className="min-w-0 flex-1">{r.note ?? <span className="text-muted-foreground">(tanpa keterangan)</span>}</span>
                    <span className="text-xs text-muted-foreground">
                      {r.reporter} · {formatDateTime(r.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
              {g.review ? (
                <ReviewCard item={g.review} keyOnly />
              ) : (
                <p className="text-sm text-muted-foreground">Soal sudah tidak ada.</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
