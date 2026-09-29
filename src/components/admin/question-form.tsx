"use client";

import { useDeferredValue, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, CircleAlert, CircleCheck, Eye, Lock, Minus, Plus, X } from "lucide-react";
import { RichHtml } from "@/components/tes/rich-html";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { renderMathToHtml } from "@/lib/math-html";
import type { QuestionEditData } from "@/lib/question-bank-types";
import { QUESTION_TYPE_META } from "@/lib/question-forms";
import { cn } from "@/lib/utils";
import {
  CATEGORY_PAIRS,
  DIFFICULTIES,
  OPTION_LABELS,
  QUESTION_TYPES,
  type Difficulty,
  type QuestionType,
} from "@/lib/validation/enums";
import { questionInput } from "@/lib/validation/question";
import { createQuestionAction, updateQuestionAction } from "@/server/actions/questions";

export type SubdomainOption = {
  code: string;
  name: string;
  /** Untuk optgroup, mis. "SMP · Matematika". */
  group: string;
  levels: { code: string; name: string }[];
};

export type StimulusOption = { id: number; code: string; title: string; questionCount: number };

type OptionDraft = { text: string; isCorrect: boolean; correctCategory: string | null };

// Batas jumlah opsi per bentuk — sama dengan questionInput.
const LIMITS: Record<QuestionType, { min: number; max: number; unit: string }> = {
  pg: { min: 4, max: 5, unit: "opsi" },
  pgk_mcma: { min: 4, max: 5, unit: "opsi" },
  pgk_kategori: { min: 3, max: 5, unit: "pernyataan" },
};

const DIFFICULTY_LABEL: Record<Difficulty, string> = { easy: "Mudah", medium: "Sedang", hard: "Sulit" };

const emptyOptions = (n: number): OptionDraft[] =>
  Array.from({ length: n }, () => ({ text: "", isCorrect: false, correctCategory: null }));

const selectClass =
  "h-10 w-full rounded-lg border border-input bg-card px-3 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15 focus-visible:outline-none";

type Props = {
  subdomains: SubdomainOption[];
  stimuli: StimulusOption[];
  /** Diisi = mode edit. */
  initial?: QuestionEditData;
};

export function QuestionForm({ subdomains, stimuli, initial }: Props) {
  const [type, setType] = useState<QuestionType>(initial?.type ?? "pg");
  const [subdomainCode, setSubdomainCode] = useState(initial?.subdomainCode ?? "");
  const [questionText, setQuestionText] = useState(initial?.questionText ?? "");
  const [difficulty, setDifficulty] = useState<Difficulty>(initial?.difficulty ?? "medium");
  const [cognitiveLevel, setCognitiveLevel] = useState(initial?.cognitiveLevel ?? "");
  const [explanation, setExplanation] = useState(initial?.explanationText ?? "");
  const [pairIndex, setPairIndex] = useState(() =>
    Math.max(0, CATEGORY_PAIRS.findIndex((p) => p.join("/") === initial?.categoryLabels?.join("/"))),
  );
  const [options, setOptions] = useState<OptionDraft[]>(initial?.options ?? emptyOptions(4));
  const [stimulusId, setStimulusId] = useState(initial?.stimulusId ? String(initial.stimulusId) : "");
  const [stimulusOrder, setStimulusOrder] = useState(String(initial?.stimulusOrder ?? 1));
  const [errors, setErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState<number | null>(null);
  const [saving, startSaving] = useTransition();
  const router = useRouter();

  const subdomain = subdomains.find((s) => s.code === subdomainCode);
  const limits = LIMITS[type];
  const pair = CATEGORY_PAIRS[pairIndex];
  const groups = [...new Set(subdomains.map((s) => s.group))];
  const isEdit = initial != null;
  // Aturan kunci sama dengan updateQuestionAction (server tetap memeriksa ulang).
  const structureLocked = (initial?.usage.answers ?? 0) > 0;
  const stimulusLocked = structureLocked || (initial?.usage.packages ?? 0) > 0;

  function changeType(next: QuestionType) {
    setType(next);
    const { min, max } = LIMITS[next];
    // Pertahankan teks opsi, sesuaikan jumlah & bersihkan kunci lama.
    setOptions((prev) => {
      const resized = prev.slice(0, max);
      while (resized.length < min) resized.push({ text: "", isCorrect: false, correctCategory: null });
      return resized.map((o) => ({ ...o, isCorrect: false, correctCategory: null }));
    });
    setSaved(null);
  }

  function updateOption(i: number, patch: Partial<OptionDraft>) {
    setOptions((prev) => prev.map((o, j) => (j === i ? { ...o, ...patch } : o)));
    setSaved(null);
  }

  function toggleKey(i: number) {
    if (type === "pg") setOptions((prev) => prev.map((o, j) => ({ ...o, isCorrect: j === i })));
    else updateOption(i, { isCorrect: !options[i].isCorrect });
    setSaved(null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const problems: string[] = [];
    if (!subdomain) problems.push("Pilih subdomain dari kerangka asesmen.");
    if (subdomain && subdomain.levels.length > 0 && !cognitiveLevel) problems.push("Pilih level kognitif untuk mata uji ini.");

    const payload = {
      type,
      questionText,
      difficulty,
      cognitiveLevel: cognitiveLevel || null,
      explanationText: explanation || null,
      imageUrl: initial?.imageUrl ?? null,
      categoryLabels: type === "pgk_kategori" ? [...pair] : undefined,
      stimulusId: stimulusId ? Number(stimulusId) : null,
      stimulusOrder: stimulusId ? Number(stimulusOrder) : null,
      options: options.map((o, i) => ({
        label: OPTION_LABELS[i],
        optionText: o.text,
        isCorrect: o.isCorrect,
        correctCategory: type === "pgk_kategori" ? o.correctCategory : null,
      })),
    };
    // Validasi cepat di browser (id subdomain asli dipetakan server).
    const parsed = questionInput.safeParse({ ...payload, subtopicId: 1 });
    if (!parsed.success) problems.push(...new Set(parsed.error.issues.map((i) => i.message)));
    setErrors(problems);
    if (problems.length > 0) return;

    startSaving(async () => {
      if (isEdit) {
        const result = await updateQuestionAction({ id: initial.id, subdomainCode, question: payload });
        if (!result.ok) setErrors(result.errors);
        else {
          setSaved(initial.id);
          router.refresh();
        }
        return;
      }
      const result = await createQuestionAction({ subdomainCode, question: payload });
      if (!result.ok) {
        setErrors(result.errors);
        return;
      }
      setSaved(result.id);
      // Siap untuk soal berikutnya di subdomain & bentuk yang sama.
      setQuestionText("");
      setExplanation("");
      setOptions((prev) => prev.map(() => ({ text: "", isCorrect: false, correctCategory: null })));
      if (stimulusId) setStimulusOrder(String(Number(stimulusOrder) + 1));
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="flex flex-col gap-6">
        {stimulusLocked && (
          <p className="flex gap-2 rounded-xl border border-warning/40 bg-warning-soft p-4 text-sm text-warning-strong">
            <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
            {structureLocked
              ? `Soal ini sudah dijawab siswa (${initial?.usage.answers} jawaban). Bentuk, jumlah opsi, kunci, subdomain, dan stimulus dikunci supaya hasil lama tetap konsisten — teks, pembahasan, dan tingkat kesulitan tetap bisa diperbaiki.`
              : `Soal ini dipakai di ${initial?.usage.packages} paket tes, jadi stimulus & urutan grup dikunci.`}
          </p>
        )}
        {/* Bentuk soal */}
        <fieldset className="surface-card flex flex-col gap-4 p-6">
          <legend className="sr-only">Bentuk soal</legend>
          <h2 className="font-bold">Bentuk soal</h2>
          <div role="radiogroup" aria-label="Bentuk soal" className="grid gap-3 md:grid-cols-3">
            {QUESTION_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={type === t}
                disabled={structureLocked}
                onClick={() => changeType(t)}
                className={cn(
                  "flex flex-col gap-1 rounded-xl border p-4 text-left transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60",
                  type === t && "border-primary bg-primary-soft shadow-[0_0_0_1px_var(--primary)]",
                )}
              >
                <span className="text-sm font-bold">{QUESTION_TYPE_META[t].label}</span>
                <span className="text-xs text-muted-foreground">{QUESTION_TYPE_META[t].description}</span>
              </button>
            ))}
          </div>
        </fieldset>

        {/* Pertanyaan & opsi */}
        <section className="surface-card flex flex-col gap-5 p-6">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="question-text" className="font-semibold">
              Pertanyaan
            </Label>
            <textarea
              id="question-text"
              value={questionText}
              onChange={(e) => {
                setQuestionText(e.target.value);
                setSaved(null);
              }}
              rows={4}
              placeholder="Tulis pertanyaan. Rumus pakai KaTeX: $x^2$ atau $$\frac{1}{2}$$"
              className="w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-base focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15 focus-visible:outline-none"
            />
          </div>

          {type === "pgk_kategori" && (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold">Pasangan kategori</span>
              <div role="radiogroup" aria-label="Pasangan kategori" className="flex flex-wrap gap-2">
                {CATEGORY_PAIRS.map((p, i) => (
                  <button
                    key={p.join("/")}
                    type="button"
                    role="radio"
                    aria-checked={pairIndex === i}
                    disabled={structureLocked}
                    onClick={() => {
                      setPairIndex(i);
                      setOptions((prev) => prev.map((o) => ({ ...o, correctCategory: null })));
                    }}
                    className={cn(
                      "rounded-full border px-4 py-1.5 text-sm font-semibold text-muted-foreground",
                      pairIndex === i && "border-primary bg-primary text-primary-foreground",
                    )}
                  >
                    {p.join(" / ")}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold capitalize">
                {limits.unit} & kunci
                <span className="ml-2 font-normal text-muted-foreground normal-case">
                  {type === "pg" && "pilih tepat 1 kunci"}
                  {type === "pgk_mcma" && `pilih 1–${options.length - 1} kunci`}
                  {type === "pgk_kategori" && "tentukan kategori kunci tiap pernyataan"}
                </span>
              </span>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label={`Kurangi ${limits.unit}`}
                  disabled={structureLocked || options.length <= limits.min}
                  onClick={() => setOptions((prev) => prev.slice(0, -1))}
                >
                  <Minus aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label={`Tambah ${limits.unit}`}
                  disabled={structureLocked || options.length >= limits.max}
                  onClick={() => setOptions((prev) => [...prev, { text: "", isCorrect: false, correctCategory: null }])}
                >
                  <Plus aria-hidden />
                </Button>
              </div>
            </div>

            {options.map((o, i) => (
              <div key={i} className="flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-center">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
                  {OPTION_LABELS[i]}
                </span>
                <Input
                  value={o.text}
                  onChange={(e) => updateOption(i, { text: e.target.value })}
                  aria-label={`${limits.unit} ${OPTION_LABELS[i]}`}
                  placeholder={type === "pgk_kategori" ? "Tulis pernyataan" : "Tulis opsi jawaban"}
                  className="flex-1"
                />
                {type === "pgk_kategori" ? (
                  <div role="radiogroup" aria-label={`Kategori kunci pernyataan ${OPTION_LABELS[i]}`} className="grid grid-cols-2 gap-2 sm:w-56">
                    {pair.map((label) => (
                      <button
                        key={label}
                        type="button"
                        role="radio"
                        aria-checked={o.correctCategory === label}
                        disabled={structureLocked}
                        onClick={() => updateOption(i, { correctCategory: label })}
                        className={cn(
                          "h-10 rounded-lg border px-2 text-sm font-semibold text-muted-foreground",
                          o.correctCategory === label && "border-success-strong bg-success-strong text-white",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <button
                    type="button"
                    role={type === "pg" ? "radio" : "checkbox"}
                    aria-checked={o.isCorrect}
                    aria-label={`Jadikan ${OPTION_LABELS[i]} kunci`}
                    disabled={structureLocked}
                    onClick={() => toggleKey(i)}
                    className={cn(
                      "flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg border px-3 text-sm font-semibold text-muted-foreground",
                      o.isCorrect && "border-success-strong bg-success-strong text-white",
                    )}
                  >
                    {o.isCorrect ? <Check className="size-4" aria-hidden /> : <X className="size-4 opacity-40" aria-hidden />}
                    Kunci
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="explanation" className="font-semibold">
              Pembahasan <span className="font-normal text-muted-foreground">(opsional)</span>
            </Label>
            <textarea
              id="explanation"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-base focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15 focus-visible:outline-none"
            />
          </div>
        </section>

        <QuestionPreview
          type={type}
          questionText={questionText}
          options={options}
          explanation={explanation}
          categoryLabels={type === "pgk_kategori" ? pair : null}
        />
      </div>

      {/* Metadata */}
      <aside className="flex flex-col gap-6">
        <section className="surface-card flex flex-col gap-4 p-6">
          <h2 className="font-bold">Metadata</h2>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="subdomain" className="font-semibold">
              Subdomain
            </Label>
            <select
              id="subdomain"
              value={subdomainCode}
              disabled={structureLocked}
              onChange={(e) => {
                setSubdomainCode(e.target.value);
                setCognitiveLevel("");
              }}
              className={selectClass}
            >
              <option value="">Pilih subdomain…</option>
              {groups.map((g) => (
                <optgroup key={g} label={g}>
                  {subdomains
                    .filter((s) => s.group === g)
                    .map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.code} — {s.name.length > 70 ? `${s.name.slice(0, 70)}…` : s.name}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
            {subdomain && <p className="text-xs text-muted-foreground">{subdomain.name}</p>}
          </div>

          {subdomain && subdomain.levels.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="level" className="font-semibold">
                Level kognitif
              </Label>
              <select id="level" value={cognitiveLevel} onChange={(e) => setCognitiveLevel(e.target.value)} className={selectClass}>
                <option value="">Pilih level…</option>
                {subdomain.levels.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.code} — {l.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">Tingkat kesulitan</span>
            <div role="radiogroup" aria-label="Tingkat kesulitan" className="grid grid-cols-3 gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  type="button"
                  role="radio"
                  aria-checked={difficulty === d}
                  onClick={() => setDifficulty(d)}
                  className={cn(
                    "h-10 rounded-lg border text-sm font-semibold text-muted-foreground",
                    difficulty === d && "border-primary bg-primary-soft text-primary",
                  )}
                >
                  {DIFFICULTY_LABEL[d]}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="surface-card flex flex-col gap-4 p-6">
          <h2 className="font-bold">Soal grup (opsional)</h2>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="stimulus" className="font-semibold">
              Stimulus
            </Label>
            <select
              id="stimulus"
              value={stimulusId}
              disabled={stimulusLocked}
              onChange={(e) => setStimulusId(e.target.value)}
              className={selectClass}
            >
              <option value="">Soal tunggal (tanpa stimulus)</option>
              {stimuli.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.code} — {st.title} ({st.questionCount} soal)
                </option>
              ))}
            </select>
          </div>
          {stimulusId && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="stimulus-order" className="font-semibold">
                Urutan di dalam grup
              </Label>
              <Input
                id="stimulus-order"
                type="number"
                min={1}
                value={stimulusOrder}
                disabled={stimulusLocked}
                onChange={(e) => setStimulusOrder(e.target.value)}
              />
            </div>
          )}
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
        {saved != null && (
          <p role="status" className="flex gap-2 rounded-xl border border-success/40 bg-success-soft p-4 text-sm text-success-strong">
            <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              {isEdit ? `Perubahan soal #${saved} tersimpan.` : `Soal #${saved} tersimpan sebagai draft. Form siap untuk soal berikutnya.`}{" "}
              <Link href="/admin/soal?status=draft" className="font-semibold underline">
                Lihat di Bank Soal
              </Link>
            </span>
          </p>
        )}
        <Button type="submit" size="lg" disabled={saving}>
          {saving ? "Menyimpan…" : isEdit ? "Simpan perubahan" : "Simpan sebagai draft"}
        </Button>
      </aside>
    </form>
  );
}

/** Pratinjau seperti yang dilihat siswa, termasuk render rumus KaTeX. */
function QuestionPreview({
  type,
  questionText,
  options,
  explanation,
  categoryLabels,
}: {
  type: QuestionType;
  questionText: string;
  options: OptionDraft[];
  explanation: string;
  categoryLabels: readonly string[] | null;
}) {
  // Ditunda supaya mengetik tetap lancar walau rumus panjang.
  const deferred = useDeferredValue({ questionText, options, explanation });
  const html = useMemo(
    () => ({
      question: renderMathToHtml(deferred.questionText),
      options: deferred.options.map((o) => renderMathToHtml(o.text)),
      explanation: renderMathToHtml(deferred.explanation),
    }),
    [deferred],
  );

  return (
    <section aria-labelledby="preview-heading" className="surface-card flex flex-col gap-4 p-6">
      <h2 id="preview-heading" className="flex items-center gap-2 font-bold">
        <Eye className="size-4 text-primary" aria-hidden /> Pratinjau
      </h2>
      {deferred.questionText.trim() === "" ? (
        <p className="text-sm text-muted-foreground">Mulai tulis pertanyaan — rumus $...$ langsung dirender di sini.</p>
      ) : (
        <>
          <RichHtml html={html.question} className="leading-relaxed" />
          <ul className="flex flex-col gap-2">
            {deferred.options.map((o, i) => (
              <li key={i} className="flex items-start gap-3 rounded-lg border p-3 text-sm">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                  {OPTION_LABELS[i]}
                </span>
                <RichHtml html={html.options[i] || "<span class='text-muted-foreground'>—</span>"} className="flex-1" />
                {type === "pgk_kategori"
                  ? o.correctCategory && <span className="text-xs font-semibold text-success-strong">{o.correctCategory}</span>
                  : o.isCorrect && <span className="text-xs font-semibold text-success-strong">Kunci</span>}
              </li>
            ))}
          </ul>
          {categoryLabels && (
            <p className="text-xs text-muted-foreground">Siswa memilih {categoryLabels.join(" / ")} untuk tiap pernyataan.</p>
          )}
          {deferred.explanation.trim() !== "" && (
            <div className="rounded-lg bg-primary-soft p-4 text-sm">
              <div className="font-semibold text-primary">Pembahasan</div>
              <RichHtml html={html.explanation} className="mt-1 block leading-relaxed" />
            </div>
          )}
        </>
      )}
    </section>
  );
}
