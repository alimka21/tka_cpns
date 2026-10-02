"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { CircleAlert, CircleCheck, FileText, LoaderCircle, Sparkles, TriangleAlert, UploadCloud } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichHtml } from "@/components/tes/rich-html";
import { checkPackageRules, packageRuleFor, type SubjectOutline } from "@/lib/package-rules";
import type { PdfCrop, PdfDraftQuestion, PdfDraftStimulus } from "@/lib/pdf-import-types";
import { QUESTION_TYPE_META } from "@/lib/question-forms";
import { cn } from "@/lib/utils";
import { uploadQuestionImageAction } from "@/server/actions/question-images";
import { extractPdfAction, savePdfImportAction } from "@/server/actions/pdf-import";
import { canvasToBlob, cropCanvas, openPdf, renderPage } from "./pdf-pages";

export type PdfImportSubject = { code: string; name: string; jenjang: string; type: "wajib" | "pilihan"; outline: SubjectOutline };

const MAX_FILE_MB = 30;
const MAX_PAGES = 40;
/** Lebar halaman untuk Gemini (cukup tajam dibaca, request tetap < 11 MB). */
const AI_WIDTH = 1240;
/** Lebar halaman untuk potongan gambar soal (lebih tajam). */
const CROP_WIDTH = 2400;
const selectClass =
  "h-10 w-full rounded-lg border border-input bg-card px-3 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15 focus-visible:outline-none";

type Phase =
  | { kind: "idle" }
  | { kind: "rendering"; done: number; total: number }
  | { kind: "reading" }
  | { kind: "preview" }
  | { kind: "saving"; step: string }
  | { kind: "done"; created: number; packageId: number | null };

type Preview = { title: string; stimuli: PdfDraftStimulus[]; questions: PdfDraftQuestion[]; warnings: string[] };

const cropKey = (c: PdfCrop) => `${c.page}:${c.box.join(",")}`;

export function PdfImporter({ subjects }: { subjects: PdfImportSubject[] }) {
  const [subjectCode, setSubjectCode] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  /** Nomor soal yang ikut disimpan. */
  const [included, setIncluded] = useState<Set<number>>(new Set());
  /** Kunci crop yang TIDAK dipakai (admin mematikan gambar). */
  const [droppedCrops, setDroppedCrops] = useState<Set<string>>(new Set());
  const [crops, setCrops] = useState<Record<string, string>>({});
  const [makePackage, setMakePackage] = useState(true);
  const [packageTitle, setPackageTitle] = useState("");
  const docRef = useRef<PDFDocumentProxy | null>(null);
  const cropCanvases = useRef<Map<string, HTMLCanvasElement>>(new Map());

  const subject = subjects.find((s) => s.code === subjectCode) ?? null;
  const jenjangs = [...new Set(subjects.map((s) => s.jenjang))];

  async function start() {
    if (!file || !subject) return;
    setError(null);
    if (file.size > MAX_FILE_MB * 1024 * 1024) return setError(`Ukuran PDF maksimal ${MAX_FILE_MB} MB.`);
    try {
      const doc = await openPdf(file);
      docRef.current = doc;
      if (doc.numPages > MAX_PAGES) return setError(`PDF berisi ${doc.numPages} halaman — maksimal ${MAX_PAGES}. Pecah dulu PDF-nya.`);
      const form = new FormData();
      form.set("subjectCode", subject.code);
      for (let p = 1; p <= doc.numPages; p++) {
        setPhase({ kind: "rendering", done: p - 1, total: doc.numPages });
        const blob = await canvasToBlob(await renderPage(doc, p, AI_WIDTH), "image/jpeg", 0.72);
        form.append("page", new File([blob], `halaman-${p}.jpg`, { type: "image/jpeg" }));
      }
      setPhase({ kind: "reading" });
      const result = await extractPdfAction(form);
      if (!result.ok) {
        setPhase({ kind: "idle" });
        return setError(result.error);
      }
      setPreview(result);
      setIncluded(new Set(result.questions.filter((q) => q.errors.length === 0).map((q) => q.number)));
      setDroppedCrops(new Set());
      setPackageTitle(result.title || file.name.replace(/\.pdf$/i, ""));
      setPhase({ kind: "preview" });
    } catch {
      setPhase({ kind: "idle" });
      setError("PDF tidak bisa dibuka. Pastikan file tidak rusak atau terkunci kata sandi.");
    }
  }

  // Potong gambar setelah pratinjau datang (halaman dirender ulang lebih tajam).
  useEffect(() => {
    const doc = docRef.current;
    if (!preview || !doc) return;
    let cancelled = false;
    (async () => {
      const all = [...preview.stimuli.map((s) => s.image), ...preview.questions.map((q) => q.image)].filter((c): c is PdfCrop => c != null);
      const pages = new Map<number, HTMLCanvasElement>();
      for (const c of all) {
        if (cancelled) return;
        const page = pages.get(c.page) ?? (await renderPage(doc, c.page, CROP_WIDTH));
        pages.set(c.page, page);
        const canvas = cropCanvas(page, c);
        cropCanvases.current.set(cropKey(c), canvas);
        const url = URL.createObjectURL(await canvasToBlob(canvas, "image/png"));
        if (!cancelled) setCrops((prev) => ({ ...prev, [cropKey(c)]: url }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [preview]);

  const chosen = useMemo(() => preview?.questions.filter((q) => included.has(q.number)) ?? [], [preview, included]);

  const rules = useMemo(() => {
    if (!subject) return null;
    const rule = packageRuleFor(subject.jenjang, { code: subject.code, type: subject.type });
    return checkPackageRules({
      jenjang: subject.jenjang,
      subject: { code: subject.code, type: subject.type },
      durationMinutes: rule?.durationMinutes ?? 0,
      outline: subject.outline,
      questions: chosen.map((q) => ({
        type: q.type,
        subjectCode: subject.code,
        subtopicCode: q.subtopicCode,
        stimulusKey: q.stimulusKey,
        hasImage: q.image != null && !droppedCrops.has(cropKey(q.image)),
      })),
    });
  }, [subject, chosen, droppedCrops]);

  async function save() {
    if (!preview || !subject) return;
    setError(null);
    try {
      const usedKeys = new Set(chosen.map((q) => q.stimulusKey).filter(Boolean));
      const stimuli = preview.stimuli.filter((s) => usedKeys.has(s.key));
      // 1) Unggah gambar satu per satu ke galeri (request kecil, ada progres).
      const imageIds = new Map<string, number>();
      const toUpload = [...stimuli.map((s) => ({ crop: s.image, label: s.title })), ...chosen.map((q) => ({ crop: q.image, label: `Soal ${q.number}` }))].filter(
        (x): x is { crop: PdfCrop; label: string } => x.crop != null && !droppedCrops.has(cropKey(x.crop)),
      );
      for (const [i, item] of toUpload.entries()) {
        const key = cropKey(item.crop);
        if (imageIds.has(key)) continue;
        setPhase({ kind: "saving", step: `Mengunggah gambar ${i + 1} dari ${toUpload.length}…` });
        const canvas = cropCanvases.current.get(key);
        if (!canvas) throw new Error("Gambar belum selesai dipotong — tunggu sebentar lalu coba lagi.");
        const blob = await canvasToBlob(canvas, "image/png");
        const form = new FormData();
        const name = `${(packageTitle || preview.title || "Impor PDF").slice(0, 80)} — ${item.label}.png`;
        form.set("file", new File([blob], name, { type: "image/png" }));
        const res = await uploadQuestionImageAction(form);
        if (!res.ok) throw new Error(res.error);
        imageIds.set(key, res.image.id);
      }
      // 2) Simpan bacaan & soal (divalidasi ulang di server).
      setPhase({ kind: "saving", step: "Menyimpan soal…" });
      const idFor = (c: PdfCrop | null) => (c ? (imageIds.get(cropKey(c)) ?? null) : null);
      const result = await savePdfImportAction({
        subjectCode: subject.code,
        stimuli: stimuli.map((s) => ({ key: s.key, title: s.title, content: s.content, imageId: idFor(s.image) })),
        questions: chosen.map((q) => ({
          number: q.number,
          stimulusKey: q.stimulusKey,
          subtopicCode: q.subtopicCode,
          type: q.type,
          text: q.text,
          options: q.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect, category: o.category })),
          categoryLabels: q.categoryLabels,
          explanation: q.explanation,
          cognitiveLevel: q.cognitiveLevel,
          difficulty: q.difficulty,
          imageId: idFor(q.image),
        })),
        packageTitle: makePackage ? packageTitle.trim() || null : null,
      });
      if (!result.ok) {
        setPhase({ kind: "preview" });
        return setError(result.errors.join(" "));
      }
      setPhase({ kind: "done", created: result.created, packageId: result.packageId });
    } catch (e) {
      setPhase({ kind: "preview" });
      setError(e instanceof Error ? e.message : "Gagal menyimpan.");
    }
  }

  function reset() {
    setPreview(null);
    setFile(null);
    setCrops({});
    cropCanvases.current.clear();
    setPhase({ kind: "idle" });
    setError(null);
  }

  if (phase.kind === "done") {
    return (
      <div className="surface-card flex flex-col items-center gap-4 px-6 py-12 text-center">
        <CircleCheck className="size-10 text-success" aria-hidden />
        <div>
          <h2 className="text-lg font-bold">{phase.created} soal tersimpan sebagai “Menunggu tinjauan”</h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Periksa kunci & pembahasannya dulu — terutama yang ditandai “Kunci dari AI”. Setelah itu terbitkan paket dari daftar Paket Tes.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {phase.packageId && (
            <Button nativeButton={false} render={<Link href={`/admin/paket-tes/${phase.packageId}`} />}>
              Buka paket draf
            </Button>
          )}
          <Button variant="outline" nativeButton={false} render={<Link href="/admin/soal?status=pending_review" />}>
            Lihat di Bank Soal
          </Button>
          <Button variant="ghost" onClick={reset}>
            Impor PDF lain
          </Button>
        </div>
      </div>
    );
  }

  const busy = phase.kind === "rendering" || phase.kind === "reading" || phase.kind === "saving";

  return (
    <div className="flex flex-col gap-6">
      {!preview && (
        <section className="surface-card flex flex-col gap-4 p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              Mata pelajaran
              <select className={selectClass} value={subjectCode} onChange={(e) => setSubjectCode(e.target.value)} disabled={busy}>
                <option value="">Pilih mata pelajaran…</option>
                {jenjangs.map((j) => (
                  <optgroup key={j} label={j}>
                    {subjects
                      .filter((s) => s.jenjang === j)
                      .map((s) => (
                        <option key={s.code} value={s.code}>
                          {j} — {s.name}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              File PDF (maks. {MAX_PAGES} halaman, {MAX_FILE_MB} MB)
              <Input type="file" accept="application/pdf" disabled={busy} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
          </div>
          <p className="text-xs text-muted-foreground">
            Halaman PDF diubah jadi gambar di browser, lalu dibaca Gemini memakai API key milikmu. PDF hasil scan pun bisa. Untuk ±25 soal biasanya butuh 1–3 menit.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={start} disabled={!file || !subject || busy}>
              {busy ? <LoaderCircle className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />}
              Baca PDF dengan Gemini
            </Button>
            {phase.kind === "rendering" && <span className="text-sm text-muted-foreground">Menyiapkan halaman {phase.done + 1} dari {phase.total}…</span>}
            {phase.kind === "reading" && <span className="text-sm text-muted-foreground">Gemini sedang membaca dokumen… jangan tutup halaman ini.</span>}
          </div>
        </section>
      )}

      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden /> {error}
        </p>
      )}

      {preview && subject && (
        <>
          <section className="surface-card flex flex-col gap-4 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <FileText className="size-5 text-primary" aria-hidden /> {preview.title || file?.name}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {preview.questions.length} soal terbaca · {preview.stimuli.length} bacaan · {chosen.length} dipilih ·{" "}
                  {preview.questions.filter((q) => q.keySource === "ai").length} kunci ditentukan AI
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={reset} disabled={busy}>
                Ganti PDF
              </Button>
            </div>
            {preview.warnings.length > 0 && (
              <ul className="flex flex-col gap-1 rounded-lg bg-warning-soft p-3 text-xs text-warning-strong">
                {preview.warnings.map((w, i) => (
                  <li key={i} className="flex gap-1.5">
                    <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden /> {w}
                  </li>
                ))}
              </ul>
            )}
            {rules && (
              <div className="grid gap-1.5 text-sm sm:grid-cols-2">
                {[...rules.required.map((c) => ({ ...c, req: true })), ...rules.recommended.map((c) => ({ ...c, req: false }))].map((c) => (
                  <p key={c.label} className={cn("flex items-start gap-1.5", c.ok ? "text-success-strong" : c.req ? "text-destructive" : "text-warning-strong")}>
                    {c.ok ? <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden /> : <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />}
                    <span>
                      {c.label} <span className="text-muted-foreground">— {c.detail}</span>
                    </span>
                  </p>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Aturan paket hanya informasi — soal tetap bisa disimpan; lengkapi paketnya nanti di halaman Paket Tes.</p>
          </section>

          <ol className="flex flex-col gap-4">
            {preview.questions.map((q, i) => {
              const stimulus = q.stimulusKey ? preview.stimuli.find((s) => s.key === q.stimulusKey) : null;
              const firstOfStimulus = stimulus && preview.questions.findIndex((x) => x.stimulusKey === q.stimulusKey) === i;
              const on = included.has(q.number);
              return (
                <li key={q.number} className="flex flex-col gap-3">
                  {firstOfStimulus && stimulus && (
                    <div className="surface-card border-l-4 border-l-primary p-5">
                      <p className="text-xs font-semibold text-primary">Bacaan</p>
                      <h3 className="font-bold">{stimulus.title}</h3>
                      <div className="mt-2 max-h-72 overflow-y-auto text-sm leading-relaxed">
                        <RichHtml html={stimulus.html} />
                      </div>
                      {stimulus.image && <CropView crop={stimulus.image} url={crops[cropKey(stimulus.image)]} dropped={droppedCrops} setDropped={setDroppedCrops} />}
                    </div>
                  )}
                  <div className={cn("surface-card p-5", !on && "opacity-60")}>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="flex items-center gap-2 text-sm font-bold">
                        <input
                          type="checkbox"
                          className="size-4"
                          checked={on}
                          disabled={q.errors.length > 0 || busy}
                          onChange={(e) =>
                            setIncluded((prev) => {
                              const next = new Set(prev);
                              if (e.target.checked) next.add(q.number);
                              else next.delete(q.number);
                              return next;
                            })
                          }
                        />
                        Soal {q.number}
                      </label>
                      <Badge variant="info">{QUESTION_TYPE_META[q.type].short}</Badge>
                      <Badge variant="muted" title={q.subtopicName}>
                        {q.subtopicCode}
                      </Badge>
                      {q.cognitiveLevel && <Badge variant="muted">{q.cognitiveLevel}</Badge>}
                      {q.keySource === "ai" ? <Badge variant="warning">Kunci dari AI — cek</Badge> : <Badge variant="success">Kunci dari PDF</Badge>}
                    </div>
                    {q.subtopicName && <p className="mt-1 text-xs text-muted-foreground">{q.subtopicName}</p>}
                    <div className="mt-3 text-sm leading-relaxed">
                      <RichHtml html={q.html} />
                    </div>
                    {q.image && <CropView crop={q.image} url={crops[cropKey(q.image)]} dropped={droppedCrops} setDropped={setDroppedCrops} />}
                    <ul className="mt-3 flex flex-col gap-1.5 text-sm">
                      {q.options.map((o, k) => {
                        const correct = q.type !== "pgk_kategori" && o.isCorrect;
                        return (
                          <li key={k} className={cn("flex items-start gap-2 rounded-lg border px-3 py-2", correct && "border-success/50 bg-success-soft")}>
                            <span className="font-semibold">{"ABCDE"[k]}.</span>
                            <RichHtml html={o.html} className="flex-1" />
                            {correct && <span className="text-xs font-semibold text-success-strong">Kunci</span>}
                            {q.type === "pgk_kategori" && <Badge variant={o.category ? "secondary" : "danger"}>{o.category ?? "?"}</Badge>}
                          </li>
                        );
                      })}
                    </ul>
                    {q.explanation && (
                      <div className="mt-3 rounded-lg bg-primary-soft/50 p-3 text-sm">
                        <p className="text-xs font-semibold text-primary">Pembahasan</p>
                        <RichHtml html={q.explanationHtml} />
                      </div>
                    )}
                    {q.errors.length > 0 && (
                      <ul className="mt-3 flex flex-col gap-1 text-sm text-destructive">
                        {q.errors.map((e) => (
                          <li key={e} className="flex gap-1.5">
                            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden /> {e}
                          </li>
                        ))}
                        <li className="text-xs text-muted-foreground">Soal ini tidak bisa disimpan — buat manual atau perbaiki setelah impor.</li>
                      </ul>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>

          <section className="surface-card sticky bottom-4 flex flex-col gap-3 p-4 shadow-lg sm:flex-row sm:items-center">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" className="size-4" checked={makePackage} onChange={(e) => setMakePackage(e.target.checked)} disabled={busy} />
              Sekaligus buat paket draf
            </label>
            {makePackage && (
              <Input value={packageTitle} onChange={(e) => setPackageTitle(e.target.value)} placeholder="Judul paket" className="sm:max-w-sm" disabled={busy} aria-label="Judul paket" />
            )}
            <div className="flex items-center gap-3 sm:ml-auto">
              {phase.kind === "saving" && <span className="text-sm text-muted-foreground">{phase.step}</span>}
              <Button onClick={save} disabled={busy || chosen.length === 0 || (makePackage && !packageTitle.trim())}>
                {phase.kind === "saving" ? <LoaderCircle className="animate-spin" aria-hidden /> : <UploadCloud aria-hidden />}
                Simpan {chosen.length} soal
              </Button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function CropView({
  crop,
  url,
  dropped,
  setDropped,
}: {
  crop: PdfCrop;
  url: string | undefined;
  dropped: Set<string>;
  setDropped: (fn: (prev: Set<string>) => Set<string>) => void;
}) {
  const key = cropKey(crop);
  const off = dropped.has(key);
  return (
    <figure className="mt-3 flex flex-col items-start gap-1.5">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- potongan lokal (blob:) dari halaman PDF
        <img src={url} alt={`Gambar dari halaman ${crop.page}`} className={cn("max-h-80 w-auto max-w-full rounded-lg border bg-white", off && "opacity-30 grayscale")} />
      ) : (
        <span className="flex h-24 w-48 items-center justify-center rounded-lg border text-xs text-muted-foreground">
          <LoaderCircle className="mr-1.5 size-4 animate-spin" aria-hidden /> Memotong gambar…
        </span>
      )}
      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={!off}
          onChange={(e) =>
            setDropped((prev) => {
              const next = new Set(prev);
              if (e.target.checked) next.delete(key);
              else next.add(key);
              return next;
            })
          }
        />
        Sertakan gambar (halaman {crop.page}) — bila potongannya meleset, matikan lalu unggah manual saat edit soal.
      </label>
    </figure>
  );
}
