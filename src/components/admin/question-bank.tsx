"use client";

import { useState } from "react";
import { BookOpenText, ChevronDown, FileUp, Pencil, Plus, Search, Sparkles, UserPen } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DemoQuestionRow, DemoTopicNode } from "@/lib/demo-data";
import { formatDate } from "@/lib/format";
import { QUESTION_TYPE_META } from "@/lib/question-forms";
import { QUESTION_TYPES, type Difficulty, type QuestionType } from "@/lib/validation/enums";
import { cn } from "@/lib/utils";

type Status = DemoQuestionRow["status"];
type StatusFilter = "all" | Status;
type DifficultyFilter = "all" | Difficulty;
type TypeFilter = "all" | QuestionType;

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

const statusItems: Record<StatusFilter, string> = {
  all: "Semua status",
  published: "Tayang",
  pending_review: "Menunggu review",
  draft: "Draft",
};
const typeItems = {
  all: "Semua bentuk",
  ...Object.fromEntries(QUESTION_TYPES.map((t) => [t, QUESTION_TYPE_META[t].short])),
} as Record<TypeFilter, string>;
const difficultyItems: Record<DifficultyFilter, string> = {
  all: "Semua tingkat",
  easy: "Mudah",
  medium: "Sedang",
  hard: "Sulit",
};

type Props = {
  tree: DemoTopicNode[];
  questions: DemoQuestionRow[];
  initialStatus: StatusFilter;
};

export function QuestionBank({ tree, questions, initialStatus }: Props) {
  const [subtopicId, setSubtopicId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>(initialStatus);
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("all");
  const [type, setType] = useState<TypeFilter>("all");

  const q = query.trim().toLowerCase();
  const visible = questions.filter(
    (row) =>
      (subtopicId == null || row.subtopicId === subtopicId) &&
      (q === "" || row.text.toLowerCase().includes(q)) &&
      (status === "all" || row.status === status) &&
      (difficulty === "all" || row.difficulty === difficulty) &&
      (type === "all" || row.type === type),
  );
  const selectedName = tree
    .flatMap((j) => j.topics.flatMap((t) => t.subtopics.map((s) => ({ ...s, label: `${j.jenjang} · ${t.name} · ${s.name}` }))))
    .find((s) => s.id === subtopicId)?.label;

  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <TopicTree tree={tree} selected={subtopicId} onSelect={setSubtopicId} />

      <section className="flex min-w-0 flex-col gap-4">
        <div className="surface-card flex flex-col gap-3 p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari teks soal…"
              aria-label="Cari soal"
              className="pl-10"
            />
          </div>
          <div className="grid grid-cols-3 gap-3 md:flex">
            <Select items={typeItems} value={type} onValueChange={(v) => setType(v as TypeFilter)}>
              <SelectTrigger className="w-full md:w-40" aria-label="Filter bentuk soal">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(typeItems).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select items={difficultyItems} value={difficulty} onValueChange={(v) => setDifficulty(v as DifficultyFilter)}>
              <SelectTrigger className="w-full md:w-36" aria-label="Filter tingkat kesulitan">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(difficultyItems).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select items={statusItems} value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
              <SelectTrigger className="w-full md:w-44" aria-label="Filter status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusItems).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>
            {visible.length} soal{selectedName && <> di <span className="font-semibold text-foreground">{selectedName}</span></>}
          </span>
          {subtopicId != null && (
            <button type="button" onClick={() => setSubtopicId(null)} className="font-semibold text-primary hover:underline">
              Tampilkan semua subtopik
            </button>
          )}
        </div>

        <ul className="flex flex-col gap-3">
          {visible.map((row) => {
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
                <p className="leading-relaxed">{row.text}</p>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
                  <span>
                    {row.jenjang} · {row.topic} · {row.subtopic} · {formatDate(row.createdAt)}
                  </span>
                  <Button variant="ghost" size="sm" disabled title="Edit soal tersedia setelah database tersambung">
                    <Pencil aria-hidden /> Edit
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
        {visible.length === 0 && (
          <div className="surface-card flex flex-col items-center gap-3 px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">Belum ada soal yang cocok dengan filter ini.</p>
            <Button variant="outline" nativeButton={false} render={<Link href="/admin/soal/import" />}>
              <Plus aria-hidden /> Import soal
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}

function TopicTree({
  tree,
  selected,
  onSelect,
}: {
  tree: DemoTopicNode[];
  selected: number | null;
  onSelect: (id: number | null) => void;
}) {
  return (
    <nav aria-label="Topik & subtopik" className="surface-card h-fit p-3 lg:sticky lg:top-24">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={cn(
          "w-full rounded-lg px-3 py-2 text-left text-sm font-semibold hover:bg-muted",
          selected == null && "bg-primary-soft text-primary hover:bg-primary-soft",
        )}
      >
        Semua soal
      </button>
      <div className="mt-2 flex flex-col gap-1">
        {tree.map((node) => (
          <details key={node.jenjang} open className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-3 py-2 text-xs font-bold tracking-wide text-muted-foreground uppercase hover:bg-muted">
              Jenjang {node.jenjang}
              <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <div className="flex flex-col gap-2 py-1 pl-2">
              {node.topics.map((topic) => (
                <div key={topic.id}>
                  <div className="px-3 py-1 text-sm font-semibold">{topic.name}</div>
                  <ul className="ml-3 border-l">
                    {topic.subtopics.map((sub) => (
                      <li key={sub.id}>
                        <button
                          type="button"
                          aria-pressed={selected === sub.id}
                          onClick={() => onSelect(sub.id)}
                          className={cn(
                            "-ml-px flex w-full items-center justify-between gap-2 border-l-2 border-transparent py-1.5 pr-2 pl-3 text-left text-sm text-muted-foreground hover:text-foreground",
                            selected === sub.id && "border-primary font-semibold text-primary hover:text-primary",
                          )}
                        >
                          <span className="truncate">{sub.name}</span>
                          <span className="text-xs tabular-nums">{sub.count}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
    </nav>
  );
}
