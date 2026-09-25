"use client";

import { useState } from "react";
import { Check, CircleAlert, CircleCheck, Minus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export function QuestionForm({ subdomains, stimuli }: { subdomains: SubdomainOption[]; stimuli: StimulusOption[] }) {
  const [type, setType] = useState<QuestionType>("pg");
  const [subdomainCode, setSubdomainCode] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [cognitiveLevel, setCognitiveLevel] = useState("");
  const [explanation, setExplanation] = useState("");
  const [pairIndex, setPairIndex] = useState(0);
  const [options, setOptions] = useState<OptionDraft[]>(emptyOptions(4));
  const [stimulusId, setStimulusId] = useState("");
  const [stimulusOrder, setStimulusOrder] = useState("1");
  const [errors, setErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  const subdomain = subdomains.find((s) => s.code === subdomainCode);
  const limits = LIMITS[type];
  const pair = CATEGORY_PAIRS[pairIndex];
  const groups = [...new Set(subdomains.map((s) => s.group))];

  function changeType(next: QuestionType) {
    setType(next);
    const { min, max } = LIMITS[next];
    // Pertahankan teks opsi, sesuaikan jumlah & bersihkan kunci lama.
    setOptions((prev) => {
      const resized = prev.slice(0, max);
      while (resized.length < min) resized.push({ text: "", isCorrect: false, correctCategory: null });
      return resized.map((o) => ({ ...o, isCorrect: false, correctCategory: null }));
    });
    setSaved(false);
  }

  function updateOption(i: number, patch: Partial<OptionDraft>) {
    setOptions((prev) => prev.map((o, j) => (j === i ? { ...o, ...patch } : o)));
    setSaved(false);
  }

  function toggleKey(i: number) {
    if (type === "pg") setOptions((prev) => prev.map((o, j) => ({ ...o, isCorrect: j === i })));
    else updateOption(i, { isCorrect: !options[i].isCorrect });
    setSaved(false);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const problems: string[] = [];
    if (!subdomain) problems.push("Pilih subdomain dari kerangka asesmen.");
    if (subdomain && subdomain.levels.length > 0 && !cognitiveLevel) problems.push("Pilih level kognitif untuk mata uji ini.");

    const parsed = questionInput.safeParse({
      type,
      // TODO: server action memetakan kode subdomain → subtopics.id.
      subtopicId: 1,
      questionText,
      difficulty,
      cognitiveLevel: cognitiveLevel || null,
      explanationText: explanation || null,
      categoryLabels: type === "pgk_kategori" ? [...pair] : undefined,
      stimulusId: stimulusId ? Number(stimulusId) : null,
      stimulusOrder: stimulusId ? Number(stimulusOrder) : null,
      options: options.map((o, i) => ({
        label: OPTION_LABELS[i],
        optionText: o.text,
        isCorrect: o.isCorrect,
        correctCategory: type === "pgk_kategori" ? o.correctCategory : null,
      })),
    });
    if (!parsed.success) problems.push(...new Set(parsed.error.issues.map((i) => i.message)));
    setErrors(problems);
    setSaved(problems.length === 0);
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="flex flex-col gap-6">
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
                onClick={() => changeType(t)}
                className={cn(
                  "flex flex-col gap-1 rounded-xl border p-4 text-left transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/25",
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
                setSaved(false);
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
                  disabled={options.length <= limits.min}
                  onClick={() => setOptions((prev) => prev.slice(0, -1))}
                >
                  <Minus aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label={`Tambah ${limits.unit}`}
                  disabled={options.length >= limits.max}
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
            <select id="stimulus" value={stimulusId} onChange={(e) => setStimulusId(e.target.value)} className={selectClass}>
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
        {saved && (
          <p role="status" className="flex gap-2 rounded-xl border border-success/40 bg-success-soft p-4 text-sm text-success">
            <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
            Soal valid. Penyimpanan ke bank soal aktif setelah database tersambung.
          </p>
        )}
        <Button type="submit" size="lg">
          Validasi & simpan draft
        </Button>
      </aside>
    </form>
  );
}
