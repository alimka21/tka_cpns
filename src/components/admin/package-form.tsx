"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  BookOpenText,
  Check,
  CircleAlert,
  CircleCheck,
  Crown,
  Search,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { checkPackageRules, packageRuleFor, pgRange, type PackageRuleReport } from "@/lib/package-rules";
import { QUESTION_TYPE_META } from "@/lib/question-forms";
import type { QuestionListRow } from "@/lib/question-bank-types";
import { testPackageInput } from "@/lib/validation/test-package";
import { cn } from "@/lib/utils";
import { savePackageAction, searchUsersAction, setEntitlementAction } from "@/server/actions/packages";
import type { CategoryOption, EntitledUser, SubjectOption, UserSearchResult } from "@/server/queries/packages";

const selectClass =
  "h-10 w-full rounded-lg border border-input bg-card px-3 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15 focus-visible:outline-none";

type InitialPackage = {
  id: number;
  title: string;
  description: string | null;
  categoryId: number;
  subjectId: number | null;
  durationMinutes: number;
  isPremium: boolean;
  status: "draft" | "published";
  questionIds: number[];
  pointsOverrideByQuestion: Record<number, number | null>;
};

type Block = { key: string; stimulusCode: string | null; ids: number[] };

function groupKey(q: QuestionListRow) {
  return q.stimulusCode ?? `single-${q.id}`;
}

function blocksFromSelected(selectedIds: number[], byId: Map<number, QuestionListRow>): Block[] {
  const seen = new Set<string>();
  const blocks: Block[] = [];
  for (const id of selectedIds) {
    const q = byId.get(id);
    if (!q) continue;
    const key = groupKey(q);
    if (seen.has(key)) continue;
    seen.add(key);
    blocks.push({ key, stimulusCode: q.stimulusCode, ids: selectedIds.filter((sid) => groupKey(byId.get(sid)!) === key) });
  }
  return blocks;
}

export function PackageForm({
  categories,
  subjects,
  bank,
  initial,
  entitledUsers,
}: {
  categories: CategoryOption[];
  subjects: SubjectOption[];
  bank: QuestionListRow[];
  initial?: InitialPackage;
  entitledUsers?: EntitledUser[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [categoryId, setCategoryId] = useState(String(initial?.categoryId ?? categories[0]?.id ?? ""));
  const [subjectId, setSubjectId] = useState(initial?.subjectId ? String(initial.subjectId) : "");
  const [durationMinutes, setDurationMinutes] = useState(String(initial?.durationMinutes ?? 75));
  const [showAllSubjects, setShowAllSubjects] = useState(false);
  const [isPremium, setIsPremium] = useState(initial?.isPremium ?? false);
  const [status, setStatus] = useState<"draft" | "published">(initial?.status ?? "draft");
  const [selectedIds, setSelectedIds] = useState<number[]>(initial?.questionIds ?? []);
  const [points, setPoints] = useState<Record<number, string>>(
    Object.fromEntries(Object.entries(initial?.pointsOverrideByQuestion ?? {}).map(([k, v]) => [k, v == null ? "" : String(v)])),
  );
  const [query, setQuery] = useState("");
  const [showAllJenjang, setShowAllJenjang] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [saving, startSaving] = useTransition();

  const byId = useMemo(() => new Map(bank.map((q) => [q.id, q])), [bank]);
  const category = categories.find((c) => String(c.id) === categoryId);
  const subjectOptions = subjects.filter((s) => String(s.categoryId) === categoryId);
  const subject = subjectOptions.find((s) => String(s.id) === subjectId) ?? null;
  const rule = category && subject ? packageRuleFor(category.code, subject) : null;
  const q = query.trim().toLowerCase();
  const pickerRows = bank.filter(
    (row) =>
      (showAllJenjang || !category || row.jenjang === category.code) &&
      (showAllSubjects || !subject || row.subjectCode === subject.code) &&
      (q === "" || row.text.toLowerCase().includes(q) || row.subtopic.toLowerCase().includes(q)),
  );
  const report: PackageRuleReport = checkPackageRules({
    jenjang: category?.code ?? "",
    subject,
    durationMinutes: Number(durationMinutes),
    questions: selectedIds.flatMap((id) => {
      const row = byId.get(id);
      return row
        ? [{ type: row.type, subjectCode: row.subjectCode, subtopicCode: row.subtopicCode, stimulusKey: row.stimulusCode, hasImage: row.hasImage, difficulty: row.difficulty, cognitiveLevel: row.cognitiveLevel }]
        : [];
    }),
    outline: subject?.outline,
  });

  function changeSubject(value: string) {
    setSubjectId(value);
    const s = subjectOptions.find((x) => String(x.id) === value);
    const r = category && s ? packageRuleFor(category.code, s) : null;
    // Durasi mengikuti aturan resmi mata pelajaran.
    if (r) setDurationMinutes(String(r.durationMinutes));
    setSaved(false);
  }
  const blocks = blocksFromSelected(selectedIds, byId);

  function toggle(id: number) {
    const target = byId.get(id);
    if (!target) return;
    const groupIds = target.stimulusCode ? bank.filter((b) => b.stimulusCode === target.stimulusCode).map((b) => b.id) : [id];
    setSelectedIds((prev) => {
      const already = groupIds.some((g) => prev.includes(g));
      if (already) return prev.filter((p) => !groupIds.includes(p));
      const ordered = target.stimulusCode
        ? bank
            .filter((b) => b.stimulusCode === target.stimulusCode)
            .sort((a, b) => (a.stimulusOrder ?? 0) - (b.stimulusOrder ?? 0))
            .map((b) => b.id)
        : [id];
      return [...prev, ...ordered];
    });
    setSaved(false);
  }

  function removeBlock(block: Block) {
    setSelectedIds((prev) => prev.filter((id) => !block.ids.includes(id)));
    setSaved(false);
  }

  function moveBlock(index: number, direction: -1 | 1) {
    const next = [...blocks];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setSelectedIds(next.flatMap((b) => b.ids));
    setSaved(false);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      id: initial?.id,
      title,
      description: description || undefined,
      categoryId: Number(categoryId),
      subjectId: subjectId ? Number(subjectId) : null,
      durationMinutes: Number(durationMinutes),
      isPremium,
      status,
      questions: selectedIds.map((id, i) => ({
        questionId: id,
        order: i,
        pointsOverride: points[id]?.trim() ? Number(points[id]) : null,
      })),
    };
    const parsed = testPackageInput.safeParse(payload);
    if (!parsed.success) {
      setErrors([...new Set(parsed.error.issues.map((i) => i.message))]);
      return;
    }
    if (status === "published" && !report.publishable) {
      setErrors(report.required.filter((c) => !c.ok).map((c) => `Aturan paket belum terpenuhi — ${c.label}: ${c.detail}.`));
      return;
    }
    setErrors([]);
    startSaving(async () => {
      const result = await savePackageAction(payload);
      if (!result.ok) {
        setErrors(result.errors);
        return;
      }
      setSaved(true);
      if (!initial) router.replace(`/admin/paket-tes/${result.id}`);
      else router.refresh();
    });
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="flex flex-col gap-6">
        <section className="surface-card flex flex-col gap-4 p-6">
          <h2 className="font-bold">Metadata Paket</h2>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pkg-title" className="font-semibold">
              Judul
            </Label>
            <Input id="pkg-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="TKA SMP — Matematika Paket 1" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pkg-desc" className="font-semibold">
              Deskripsi <span className="font-normal text-muted-foreground">(opsional)</span>
            </Label>
            <textarea
              id="pkg-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-base focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15 focus-visible:outline-none"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pkg-category" className="font-semibold">
                Jenjang
              </Label>
              <select
                id="pkg-category"
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setSubjectId("");
                }}
                className={selectClass}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pkg-subject" className="font-semibold">
                Mata pelajaran
              </Label>
              <select id="pkg-subject" value={subjectId} onChange={(e) => changeSubject(e.target.value)} className={selectClass}>
                <option value="">Pilih mata pelajaran…</option>
                {subjectOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.type === "pilihan" ? " (pilihan)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="pkg-duration" className="font-semibold">
                Durasi (menit)
              </Label>
              <Input
                id="pkg-duration"
                type="number"
                min={1}
                max={600}
                value={durationMinutes}
                readOnly={rule != null}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className={rule ? "bg-muted" : undefined}
              />
              {rule && (
                <p className="text-xs text-muted-foreground">
                  Aturan {category?.code} {rule.label}: <strong>{rule.questionCount} soal</strong>, <strong>{rule.durationMinutes} menit</strong>, PG
                  sederhana {pgRange(rule.questionCount).min}–{pgRange(rule.questionCount).max} soal (50–60%).
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <Switch checked={isPremium} onCheckedChange={setIsPremium} label="Paket premium" />
            <div>
              <div className="text-sm font-semibold">Paket premium</div>
              <div className="text-xs text-muted-foreground">Siswa butuh akses yang diberikan admin untuk mengerjakan.</div>
            </div>
          </div>
        </section>

        <section className="surface-card flex flex-col gap-4 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Pilih Soal</h2>
            <span className="text-sm text-muted-foreground">{selectedIds.length} soal dipilih</span>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari teks soal atau subdomain…" className="pl-10" />
            </div>
            {subject && (
              <label className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" checked={showAllSubjects} onChange={(e) => setShowAllSubjects(e.target.checked)} />
                Tampilkan mapel lain
              </label>
            )}
            {category && (
              <label className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" checked={showAllJenjang} onChange={(e) => setShowAllJenjang(e.target.checked)} />
                Tampilkan semua jenjang
              </label>
            )}
          </div>
          <ul className="flex max-h-96 flex-col divide-y overflow-y-auto rounded-lg border">
            {pickerRows.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                Tidak ada soal tayang yang cocok. Terbitkan soal dulu di Bank Soal.
              </li>
            )}
            {pickerRows.map((row) => {
              const checked = selectedIds.includes(row.id);
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => toggle(row.id)}
                    className={cn("flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-muted/50", checked && "bg-primary-soft/40")}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border",
                        checked ? "border-primary bg-primary text-primary-foreground" : "border-input",
                      )}
                    >
                      {checked && <Check className="size-3.5" aria-hidden />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline">{QUESTION_TYPE_META[row.type].short}</Badge>
                        {row.stimulusCode && (
                          <Badge variant="info">
                            <BookOpenText aria-hidden /> Grup {row.stimulusCode}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {row.jenjang} · {row.topic} · {row.subtopic}
                        </span>
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-sm">{row.text}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="surface-card flex flex-col gap-4 p-6">
          <h2 className="font-bold">Susunan Paket</h2>
          {blocks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada soal dipilih.</p>
          ) : (
            <ol className="flex flex-col gap-3">
              {blocks.map((block, i) => (
                <li key={block.key} className="rounded-xl border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs text-primary">
                        {i + 1}
                      </span>
                      {block.stimulusCode ? `Grup stimulus ${block.stimulusCode} (${block.ids.length} soal)` : "Soal tunggal"}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button type="button" variant="ghost" size="icon-sm" aria-label="Naikkan urutan" disabled={i === 0} onClick={() => moveBlock(i, -1)}>
                        <ArrowUp aria-hidden />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Turunkan urutan"
                        disabled={i === blocks.length - 1}
                        onClick={() => moveBlock(i, 1)}
                      >
                        <ArrowDown aria-hidden />
                      </Button>
                      <Button type="button" variant="ghost" size="icon-sm" aria-label="Hapus dari paket" onClick={() => removeBlock(block)}>
                        <Trash2 aria-hidden />
                      </Button>
                    </div>
                  </div>
                  <ul className="mt-2 flex flex-col gap-2">
                    {block.ids.map((id) => {
                      const row = byId.get(id);
                      if (!row) return null;
                      return (
                        <li key={id} className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2 text-sm">
                          <span className="min-w-0 flex-1 truncate">{row.text}</span>
                          <Label htmlFor={`points-${id}`} className="shrink-0 text-xs text-muted-foreground">
                            Poin
                          </Label>
                          <Input
                            id={`points-${id}`}
                            type="number"
                            min={1}
                            max={100}
                            placeholder="1"
                            value={points[id] ?? ""}
                            onChange={(e) => setPoints((prev) => ({ ...prev, [id]: e.target.value }))}
                            className="h-8 w-16 shrink-0"
                          />
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <aside className="flex flex-col gap-6">
        <RulesPanel report={report} />
        <section className="surface-card flex flex-col gap-4 p-6">
          <h2 className="font-bold">Status</h2>
          <div role="radiogroup" aria-label="Status paket" className="grid grid-cols-2 gap-2">
            {(["draft", "published"] as const).map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={status === s}
                onClick={() => setStatus(s)}
                className={cn(
                  "h-10 rounded-lg border text-sm font-semibold text-muted-foreground",
                  status === s && "border-primary bg-primary-soft text-primary",
                )}
              >
                {s === "draft" ? "Draft" : "Terbitkan"}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Paket yang diterbitkan langsung terlihat siswa. Semua soalnya harus berstatus tayang di Bank Soal.
          </p>
        </section>

        {errors.length > 0 && (
          <div role="alert" className="rounded-xl border border-destructive/40 bg-destructive-soft p-4 text-sm text-destructive">
            <div className="flex items-center gap-2 font-semibold">
              <CircleAlert className="size-4" aria-hidden /> Periksa lagi
            </div>
            <ul className="mt-2 list-disc pl-5">
              {errors.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        )}
        {saved && (
          <p role="status" className="flex gap-2 rounded-xl border border-success/40 bg-success-soft p-4 text-sm text-success-strong">
            <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden /> Paket tersimpan.
          </p>
        )}
        <Button type="submit" size="lg" disabled={saving}>
          {saving ? "Menyimpan…" : "Simpan Paket"}
        </Button>

        {initial && isPremium && (
          <EntitlementPanel testPackageId={initial.id} initialUsers={entitledUsers ?? []} />
        )}
        {!initial && isPremium && (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            Simpan paket ini dulu, lalu atur siapa yang punya akses premium di halaman edit.
          </p>
        )}
      </aside>
    </form>
  );
}

function EntitlementPanel({ testPackageId, initialUsers }: { testPackageId: number; initialUsers: EntitledUser[] }) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [searching, startSearching] = useTransition();
  const [pending, startPending] = useTransition();

  function search(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    startSearching(async () => setResults(await searchUsersAction(value)));
  }

  function grant(userId: number, name: string, email: string) {
    startPending(async () => {
      const result = await setEntitlementAction({ userId, testPackageId, granted: true });
      if (result.ok) {
        setUsers((prev) => [{ id: userId, name, email, grantedAt: new Date().toISOString() }, ...prev]);
        setResults((prev) => prev.filter((r) => r.id !== userId));
        setQuery("");
        router.refresh();
      }
    });
  }

  function revoke(userId: number) {
    startPending(async () => {
      const result = await setEntitlementAction({ userId, testPackageId, granted: false });
      if (result.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        router.refresh();
      }
    });
  }

  return (
    <section className="surface-card flex flex-col gap-4 p-6">
      <div className="flex items-center gap-2">
        <Crown className="size-4 text-cta" aria-hidden />
        <h2 className="font-bold">Akses Premium</h2>
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input value={query} onChange={(e) => search(e.target.value)} placeholder="Cari nama/email untuk diberi akses…" className="pl-10" />
      </div>
      {searching && <p className="text-xs text-muted-foreground">Mencari…</p>}
      {results.length > 0 && (
        <ul className="flex flex-col divide-y rounded-lg border">
          {results.map((u) => (
            <li key={u.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
              <div className="min-w-0">
                <div className="truncate font-medium">{u.name}</div>
                <div className="truncate text-xs text-muted-foreground">{u.email}</div>
              </div>
              <Button type="button" size="sm" disabled={pending} onClick={() => grant(u.id, u.name, u.email)}>
                <UserPlus aria-hidden /> Beri akses
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div>
        <div className="mb-1.5 text-xs font-semibold text-muted-foreground uppercase">{users.length} user punya akses</div>
        <ul className="flex flex-col divide-y rounded-lg border">
          {users.length === 0 && <li className="px-3 py-4 text-center text-sm text-muted-foreground">Belum ada yang diberi akses.</li>}
          {users.map((u) => (
            <li key={u.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
              <div className="min-w-0">
                <div className="truncate font-medium">{u.name}</div>
                <div className="truncate text-xs text-muted-foreground">{u.email}</div>
              </div>
              <Button type="button" variant="ghost" size="icon-sm" aria-label={`Cabut akses ${u.name}`} disabled={pending} onClick={() => revoke(u.id)}>
                <X aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Checklist aturan paket (docs/ATURAN_PAKET.md): wajib memblokir penerbitan, saran tidak. */
function RulesPanel({ report }: { report: PackageRuleReport }) {
  const { stats } = report;
  return (
    <section aria-labelledby="rules-heading" className="surface-card flex flex-col gap-3 p-5">
      <h2 id="rules-heading" className="flex items-center justify-between font-bold">
        Aturan paket
        <Badge variant={report.publishable ? "success" : "warning"}>{report.publishable ? "Siap terbit" : "Belum lengkap"}</Badge>
      </h2>
      <ul className="flex flex-col gap-2 text-sm">
        {report.required.map((c) => (
          <li key={c.label} className="flex items-start gap-2">
            {c.ok ? <CircleCheck className="mt-0.5 size-4 shrink-0 text-success-strong" aria-label="Terpenuhi" /> : <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-label="Belum terpenuhi" />}
            <span>
              <span className="font-medium">{c.label}</span>
              <span className="block text-xs text-muted-foreground">{c.detail}</span>
            </span>
          </li>
        ))}
      </ul>
      {report.recommended.length > 0 && (
        <>
          <p className="border-t pt-2 text-xs font-semibold text-muted-foreground uppercase">Disarankan</p>
          <ul className="flex flex-col gap-2 text-sm">
            {report.recommended.map((c) => (
              <li key={c.label} className="flex items-start gap-2">
                {c.ok ? <Check className="mt-0.5 size-4 shrink-0 text-success-strong" aria-label="Terpenuhi" /> : <span className="mt-0.5 text-xs font-bold text-warning-strong" aria-label="Saran">!</span>}
                <span>
                  {c.label}
                  <span className="block text-xs text-muted-foreground">{c.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="border-t pt-2 text-xs text-muted-foreground tabular-nums">
        {stats.total} soal · {stats.pg} PG · {stats.mcma} MCMA · {stats.kategori} Kategori · {stats.stimulusBased} berbasis stimulus/gambar
      </p>
    </section>
  );
}
