"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpenText, FileUp, ImageIcon, Pencil, Search, Send, Sparkles, Undo2, UserPen, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { bankHref, type BankFilters } from "@/lib/bank-filters";
import { formatDate } from "@/lib/format";
import type { QuestionListRow } from "@/lib/question-bank-types";
import { QUESTION_TYPE_META } from "@/lib/question-forms";
import { QUESTION_TYPES, type Difficulty } from "@/lib/validation/enums";
import { updateQuestionStatusAction } from "@/server/actions/questions";

type Status = QuestionListRow["status"];

const difficultyMeta: Record<Difficulty, { label: string; variant: "success" | "warning" | "danger" }> = {
  easy: { label: "Mudah", variant: "success" },
  medium: { label: "Sedang", variant: "warning" },
  hard: { label: "Sulit", variant: "danger" },
};

// Status soal: hijau=published, amber=pending, abu=draft (docs/UI_UX.md §3).
const statusMeta: Record<Status, { label: string; variant: "success" | "warning" | "muted" }> = {
  published: { label: "Tayang", variant: "success" },
  pending_review: { label: "Menunggu review", variant: "warning" },
  draft: { label: "Draft", variant: "muted" },
};

const sourceMeta = {
  manual: { label: "Manual", icon: UserPen },
  import: { label: "Import", icon: FileUp },
  ai: { label: "AI", icon: Sparkles },
};

/** Pohon ringan untuk dropdown berjenjang (tanpa hitungan). */
export type FilterNode = { code: string; name: string; children: FilterNode[] };
export type FilterTree = FilterNode[];

const selectClass =
  "h-10 w-full min-w-0 rounded-lg border border-input bg-card px-3 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15 focus-visible:outline-none disabled:opacity-50";

export function BankFilterBar({ tree, filters }: { tree: FilterTree; filters: BankFilters }) {
  const router = useRouter();
  const [q, setQ] = useState(filters.q ?? "");
  const jenjang = tree.find((j) => j.code === filters.jenjang);
  const mapel = jenjang?.children.find((m) => m.code === filters.mapel);
  const topik = mapel?.children.find((t) => t.code === filters.topik);

  // Mengganti level induk mengosongkan level di bawahnya; halaman kembali ke 1.
  const go = (patch: Partial<BankFilters>) => router.push(bankHref({ ...filters, ...patch, hal: undefined }));
  const pick = (value: string) => value || undefined;

  return (
    <div className="surface-card flex flex-col gap-3 p-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <select aria-label="Jenjang" className={selectClass} value={filters.jenjang ?? ""} onChange={(e) => go({ jenjang: pick(e.target.value) as BankFilters["jenjang"], mapel: undefined, topik: undefined, sub: undefined })}>
          <option value="">Semua jenjang</option>
          {tree.map((j) => (
            <option key={j.code} value={j.code}>
              {j.name}
            </option>
          ))}
        </select>
        <select aria-label="Mata pelajaran" className={selectClass} disabled={!jenjang} value={filters.mapel ?? ""} onChange={(e) => go({ mapel: pick(e.target.value), topik: undefined, sub: undefined })}>
          <option value="">Semua mata pelajaran</option>
          {jenjang?.children.map((m) => (
            <option key={m.code} value={m.code}>
              {m.name}
            </option>
          ))}
        </select>
        <select aria-label="Topik" className={selectClass} disabled={!mapel} value={filters.topik ?? ""} onChange={(e) => go({ topik: pick(e.target.value), sub: undefined })}>
          <option value="">Semua topik</option>
          {mapel?.children.map((t) => (
            <option key={t.code} value={t.code}>
              {t.name}
            </option>
          ))}
        </select>
        <select aria-label="Subtopik" className={selectClass} disabled={!topik} value={filters.sub ?? ""} onChange={(e) => go({ sub: pick(e.target.value) })}>
          <option value="">Semua subtopik</option>
          {topik?.children.map((s) => (
            <option key={s.code} value={s.code}>
              {s.name.length > 80 ? `${s.name.slice(0, 80)}…` : s.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-[minmax(0,1fr)_repeat(4,10rem)]">
        <form
          className="relative col-span-2 md:col-span-1"
          onSubmit={(e) => {
            e.preventDefault();
            go({ q: q.trim() || undefined });
          }}
        >
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari teks soal lalu Enter…" aria-label="Cari soal" className="pl-10" />
        </form>
        <select aria-label="Status" className={selectClass} value={filters.status ?? ""} onChange={(e) => go({ status: pick(e.target.value) as BankFilters["status"] })}>
          <option value="">Semua status</option>
          {Object.entries(statusMeta).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
        <select aria-label="Bentuk soal" className={selectClass} value={filters.bentuk ?? ""} onChange={(e) => go({ bentuk: pick(e.target.value) as BankFilters["bentuk"] })}>
          <option value="">Semua bentuk</option>
          {QUESTION_TYPES.map((t) => (
            <option key={t} value={t}>
              {QUESTION_TYPE_META[t].short}
            </option>
          ))}
        </select>
        <select aria-label="Tingkat kesulitan" className={selectClass} value={filters.tingkat ?? ""} onChange={(e) => go({ tingkat: pick(e.target.value) as BankFilters["tingkat"] })}>
          <option value="">Semua tingkat</option>
          {Object.entries(difficultyMeta).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
        <select aria-label="Sumber soal" className={selectClass} value={filters.sumber ?? ""} onChange={(e) => go({ sumber: pick(e.target.value) as BankFilters["sumber"] })}>
          <option value="">Semua sumber</option>
          {Object.entries(sourceMeta).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function QuestionList({ questions }: { questions: QuestionListRow[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {questions.map((row) => {
        const source = sourceMeta[row.generatedBy];
        const SourceIcon = source.icon;
        return (
          <li key={row.id} className="surface-card flex flex-col gap-3 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="info">{QUESTION_TYPE_META[row.type].short}</Badge>
              <Badge variant={statusMeta[row.status].variant}>{statusMeta[row.status].label}</Badge>
              <Badge variant={difficultyMeta[row.difficulty].variant}>{difficultyMeta[row.difficulty].label}</Badge>
              <Badge variant="outline">
                <SourceIcon aria-hidden /> {source.label}
              </Badge>
              {row.hasImage && (
                <Badge variant="outline">
                  <ImageIcon aria-hidden /> Bergambar
                </Badge>
              )}
              <span className="ml-auto text-xs text-muted-foreground">#{row.id}</span>
            </div>
            {row.stimulusCode && (
              <Link
                href="/admin/soal/stimulus"
                className="flex w-fit items-center gap-1.5 rounded-lg bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary hover:underline"
              >
                <BookOpenText className="size-3.5" aria-hidden /> Soal grup {row.stimulusCode} · urutan {row.stimulusOrder}
              </Link>
            )}
            <p className="line-clamp-3 leading-relaxed">{row.text}</p>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
              <span>
                {row.jenjang} · {row.topic} · {row.subtopic} · {formatDate(row.createdAt)}
              </span>
              <span className="flex flex-wrap items-center gap-1">
                <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`/admin/soal/generate-ai?mode=variasi&dari=${row.id}`} />}>
                  <Wand2 aria-hidden /> Variasi AI
                </Button>
                <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`/admin/soal/${row.id}`} />}>
                  <Pencil aria-hidden /> Edit
                </Button>
                <StatusButton id={row.id} status={row.status} />
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Terbitkan soal draft/review, atau kembalikan soal tayang ke draft. */
function StatusButton({ id, status }: { id: number; status: Status }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const next: Status = status === "published" ? "draft" : "published";
  return (
    <span className="flex items-center gap-2">
      {error && <span className="text-destructive">{error}</span>}
      <Button
        variant={next === "published" ? "default" : "ghost"}
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await updateQuestionStatusAction({ id, status: next });
            if (!result.ok) setError(result.errors[0]);
            else router.refresh();
          })
        }
      >
        {next === "published" ? <Send aria-hidden /> : <Undo2 aria-hidden />}
        {pending ? "Menyimpan…" : next === "published" ? "Terbitkan" : "Jadikan draft"}
      </Button>
    </span>
  );
}
