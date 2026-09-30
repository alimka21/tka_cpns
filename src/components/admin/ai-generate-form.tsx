"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleAlert, CircleCheck, ImageIcon, LoaderCircle, Pencil, Sparkles, Wand2 } from "lucide-react";
import { RichHtml } from "@/components/tes/rich-html";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { QUESTION_TYPE_META } from "@/lib/question-forms";
import { cn } from "@/lib/utils";
import { DIFFICULTIES, QUESTION_TYPES, type Difficulty, type QuestionType } from "@/lib/validation/enums";
import { generateAiQuestionsAction } from "@/server/actions/ai-generate";
import type { SubdomainOption } from "./question-form";

type Mode = "baru" | "variasi" | "gambar";

export type AiSourceQuestion = {
  id: number;
  subdomainCode: string;
  type: QuestionType;
  questionText: string;
  /** questionText yang sudah dirender KaTeX (server). */
  html: string;
  difficulty: Difficulty;
  cognitiveLevel: string | null;
  hasImage: boolean;
};

export type AiImageOption = { id: number; title: string };

const MODES: { id: Mode; label: string; icon: typeof Sparkles; hint: string }[] = [
  { id: "baru", label: "Soal baru", icon: Sparkles, hint: "AI menulis soal baru sesuai cakupan & batasan subtopik di kerangka asesmen." },
  { id: "variasi", label: "Variasi soal", icon: Wand2, hint: "AI memodifikasi soal yang sudah ada di bank (angka, konteks, atau tingkat kesulitan)." },
  { id: "gambar", label: "Dari gambar", icon: ImageIcon, hint: "AI membaca satu gambar dari galeri lalu membuat beberapa soal berbeda darinya." },
];

const VARIATIONS = [
  { id: "bebas", label: "Campuran" },
  { id: "angka", label: "Ganti angka/data" },
  { id: "konteks", label: "Ganti konteks cerita" },
  { id: "lebih_sulit", label: "Lebih sulit" },
  { id: "lebih_mudah", label: "Lebih mudah" },
] as const;

const DIFFICULTY_LABEL: Record<Difficulty, string> = { easy: "Mudah", medium: "Sedang", hard: "Sulit" };

const selectClass =
  "h-10 w-full rounded-lg border border-input bg-card px-3 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15 focus-visible:outline-none disabled:opacity-60";

type Props = {
  initialMode: Mode;
  subdomains: SubdomainOption[];
  source: AiSourceQuestion | null;
  images: AiImageOption[];
  initialImageId: number | null;
};

export function AiGenerateForm({ initialMode, subdomains, source, images, initialImageId }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [subdomainCode, setSubdomainCode] = useState(source?.subdomainCode ?? "");
  const [cognitiveLevel, setCognitiveLevel] = useState(source?.cognitiveLevel ?? "");
  const [form, setForm] = useState<QuestionType>(source?.type ?? "pg");
  const [difficulty, setDifficulty] = useState<Difficulty>(source?.difficulty ?? "medium");
  const [count, setCount] = useState(mode === "gambar" ? 3 : 5);
  const [variation, setVariation] = useState<(typeof VARIATIONS)[number]["id"]>("bebas");
  const [imageId, setImageId] = useState<number | null>(initialImageId);
  const [extra, setExtra] = useState("");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<Awaited<ReturnType<typeof generateAiQuestionsAction>> | null>(null);

  const variasiLocked = mode === "variasi" && source != null;
  const code = variasiLocked ? source.subdomainCode : subdomainCode;
  const subdomain = subdomains.find((s) => s.code === code);
  const groups = [...new Set(subdomains.map((s) => s.group))];
  const missing =
    !subdomain
      ? "Pilih subtopik."
      : subdomain.levels.length > 0 && !cognitiveLevel
        ? "Pilih level kognitif."
        : mode === "variasi" && !source
          ? "Pilih soal asal dari Bank Soal (tombol “Variasi AI”)."
          : mode === "gambar" && !imageId
            ? "Pilih gambar."
            : null;

  function submit() {
    setResult(null);
    startTransition(async () => {
      const r = await generateAiQuestionsAction({
        mode,
        subdomainCode: code,
        form,
        count,
        difficulty,
        cognitiveLevel: subdomain?.levels.length ? cognitiveLevel : null,
        sourceQuestionId: mode === "variasi" ? source?.id : null,
        variation: mode === "variasi" ? variation : undefined,
        imageId: mode === "gambar" ? imageId : null,
        extraInstruction: extra || null,
      }).catch(() => ({ ok: false as const, error: "Koneksi terputus atau server terlalu lama merespons." }));
      setResult(r);
      if (r.ok) router.refresh();
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="flex flex-col gap-6">
        <div role="tablist" aria-label="Cara membuat soal" className="grid gap-3 md:grid-cols-3">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={mode === m.id}
              onClick={() => {
                setMode(m.id);
                setResult(null);
              }}
              className={cn(
                "flex flex-col gap-1 rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/40",
                mode === m.id && "border-primary bg-primary-soft shadow-[0_0_0_1px_var(--primary)]",
              )}
            >
              <span className="flex items-center gap-2 font-bold">
                <m.icon className="size-4 text-primary" aria-hidden /> {m.label}
              </span>
              <span className="text-xs text-muted-foreground">{m.hint}</span>
            </button>
          ))}
        </div>

        {mode === "variasi" && (
          <section className="surface-card flex flex-col gap-3 p-6">
            <h2 className="font-bold">Soal asal</h2>
            {source ? (
              <>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="info">{QUESTION_TYPE_META[source.type].short}</Badge>
                  <Badge variant="outline">{DIFFICULTY_LABEL[source.difficulty]}</Badge>
                  <span className="text-muted-foreground">#{source.id} · {source.subdomainCode}</span>
                  <Link href={`/admin/soal/${source.id}`} className="ml-auto font-semibold text-primary hover:underline">
                    Lihat soal
                  </Link>
                </div>
                <RichHtml html={source.html} className="line-clamp-4 block rounded-lg bg-muted/50 p-3 text-sm leading-relaxed" />
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-semibold">Jenis modifikasi</span>
                  <div role="radiogroup" aria-label="Jenis modifikasi" className="flex flex-wrap gap-2">
                    {VARIATIONS.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        role="radio"
                        aria-checked={variation === v.id}
                        onClick={() => setVariation(v.id)}
                        className={cn(
                          "rounded-full border px-4 py-1.5 text-sm font-semibold text-muted-foreground",
                          variation === v.id && "border-primary bg-primary text-primary-foreground",
                        )}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Buka{" "}
                <Link href="/admin/soal" className="font-semibold text-primary hover:underline">
                  Bank Soal
                </Link>
                , cari soalnya, lalu klik <strong>Variasi AI</strong> pada soal tersebut.
              </p>
            )}
          </section>
        )}

        {mode === "gambar" && (
          <section className="surface-card flex flex-col gap-3 p-6">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-bold">Pilih gambar</h2>
              <Link href="/admin/soal/gambar" className="text-sm font-semibold text-primary hover:underline">
                Kelola / unggah gambar
              </Link>
            </div>
            {images.length === 0 ? (
              <p className="text-sm text-muted-foreground">Galeri masih kosong. Unggah gambar dulu.</p>
            ) : (
              <ul role="radiogroup" aria-label="Gambar" className="grid max-h-[28rem] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 lg:grid-cols-4">
                {images.map((img) => (
                  <li key={img.id}>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={imageId === img.id}
                      onClick={() => setImageId(img.id)}
                      className={cn(
                        "flex w-full flex-col overflow-hidden rounded-xl border text-left",
                        imageId === img.id && "border-primary ring-2 ring-primary",
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- gambar dari route /gambar (DB) */}
                      <img src={`/gambar/${img.id}`} alt="" loading="lazy" className="aspect-[4/3] w-full bg-muted object-contain" />
                      <span className="truncate px-2 py-1.5 text-xs font-medium">{img.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <section className="surface-card flex flex-col gap-4 p-6">
          <h2 className="font-bold">Pengaturan soal</h2>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ai-subdomain" className="font-semibold">
              Subtopik {variasiLocked && <span className="font-normal text-muted-foreground">(mengikuti soal asal)</span>}
            </Label>
            <select
              id="ai-subdomain"
              className={selectClass}
              value={code}
              disabled={variasiLocked}
              onChange={(e) => {
                setSubdomainCode(e.target.value);
                setCognitiveLevel("");
              }}
            >
              <option value="">Pilih subtopik…</option>
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
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ai-form" className="font-semibold">
                Bentuk soal
              </Label>
              <select id="ai-form" className={selectClass} value={form} onChange={(e) => setForm(e.target.value as QuestionType)}>
                {QUESTION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {QUESTION_TYPE_META[t].label}
                  </option>
                ))}
              </select>
            </div>
            {subdomain && subdomain.levels.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ai-level" className="font-semibold">
                  Level kognitif
                </Label>
                <select id="ai-level" className={selectClass} value={cognitiveLevel} onChange={(e) => setCognitiveLevel(e.target.value)}>
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
                    className={cn("h-10 rounded-lg border text-sm font-semibold text-muted-foreground", difficulty === d && "border-primary bg-primary-soft text-primary")}
                  >
                    {DIFFICULTY_LABEL[d]}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ai-count" className="font-semibold">
                Jumlah soal (1–10)
              </Label>
              <input
                id="ai-count"
                type="number"
                min={1}
                max={10}
                value={count}
                onChange={(e) => setCount(Math.min(10, Math.max(1, Number(e.target.value) || 1)))}
                className={selectClass}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ai-extra" className="font-semibold">
              Instruksi tambahan <span className="font-normal text-muted-foreground">(opsional)</span>
            </Label>
            <textarea
              id="ai-extra"
              rows={2}
              maxLength={500}
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              placeholder="Mis. gunakan konteks pasar tradisional; hindari soal cerita yang panjang."
              className="w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15 focus-visible:outline-none"
            />
          </div>
        </section>
      </div>

      <aside className="flex flex-col gap-4">
        <div className="surface-card flex flex-col gap-3 p-6">
          <p className="text-sm text-muted-foreground">
            Soal hasil AI masuk sebagai <Badge variant="warning">Menunggu review</Badge> — periksa kunci & pembahasannya, edit bila
            perlu, lalu terbitkan dari Bank Soal.
          </p>
          <Button size="lg" disabled={pending || missing != null} onClick={submit}>
            {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />}
            {pending ? "AI sedang menulis soal…" : `Buat ${count} soal`}
          </Button>
          {missing && <p className="text-xs text-muted-foreground">{missing}</p>}
          {pending && <p className="text-xs text-muted-foreground">Biasanya 10–60 detik. Jangan tutup halaman.</p>}
        </div>

        {result && !result.ok && (
          <div role="alert" className="rounded-xl border border-destructive/40 bg-destructive-soft p-4 text-sm text-destructive">
            <div className="flex items-center gap-2 font-semibold">
              <CircleAlert className="size-4" aria-hidden /> {result.error}
            </div>
            {result.rejected && result.rejected.length > 0 && (
              <ul className="mt-2 list-disc pl-5 text-xs">
                {result.rejected.slice(0, 6).map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        {result?.ok && (
          <div role="status" className="flex flex-col gap-3 rounded-xl border border-success/40 bg-success-soft p-4 text-sm">
            <div className="flex items-center gap-2 font-semibold text-success-strong">
              <CircleCheck className="size-4" aria-hidden /> {result.created.length} soal dibuat — menunggu review
            </div>
            <ul className="flex flex-col gap-2">
              {result.created.map((q) => (
                <li key={q.id} className="flex items-start gap-2 rounded-lg bg-card p-2">
                  <RichHtml html={q.html} className="line-clamp-2 block flex-1 text-xs" />
                  <Button size="icon-sm" variant="ghost" aria-label={`Periksa soal #${q.id}`} nativeButton={false} render={<Link href={`/admin/soal/${q.id}`} />}>
                    <Pencil aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>
            {result.rejected.length > 0 && (
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer">{result.rejected.length} soal AI dibuang karena tidak lolos validasi</summary>
                <ul className="mt-1 list-disc pl-5">
                  {result.rejected.slice(0, 10).map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
