"use client";

import { useRef, useState, useTransition } from "react";
import { CircleAlert, CircleCheck, Download, FileSpreadsheet, LoaderCircle, UploadCloud, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  previewQuestionImport,
  type ImportPreviewResult,
  type ImportPreviewRow,
} from "@/server/actions/question-import";
import { cn } from "@/lib/utils";

const MAX_MB = 5;
const difficultyLabel = { easy: "Mudah", medium: "Sedang", hard: "Sulit" } as const;

type Row =
  | ({ kind: "valid" } & ImportPreviewRow)
  | { kind: "error"; rowNumber: number; messages: string[] };

export function ImportUploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState<ImportPreviewResult | null>(null);
  const [pending, startTransition] = useTransition();

  function pick(next: File | undefined) {
    if (!next) return;
    setFile(next);
    setResult(null);
    const data = new FormData();
    data.set("file", next);
    startTransition(async () => setResult(await previewQuestionImport(data)));
  }

  function reset() {
    setFile(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const rows: Row[] =
    result?.ok === true
      ? [
          ...result.valid.map((r) => ({ kind: "valid" as const, ...r })),
          ...result.errors.map((e) => ({ kind: "error" as const, ...e })),
        ].sort((a, b) => a.rowNumber - b.rowNumber)
      : [];

  return (
    <div className="flex flex-col gap-6">
      <ol className="grid gap-4 md:grid-cols-3">
        <Step n={1} title="Unduh template" active={!file}>
          <a
            href="/admin/soal/import/template"
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <Download className="size-4" aria-hidden /> template-import-soal.xlsx
          </a>
        </Step>
        <Step n={2} title="Upload file" active={!!file && !result}>
          <p className="mt-1 text-sm text-muted-foreground">Format .xlsx, maksimal {MAX_MB} MB / 1.000 soal.</p>
        </Step>
        <Step n={3} title="Periksa & konfirmasi" active={result?.ok === true}>
          <p className="mt-1 text-sm text-muted-foreground">Soal valid disimpan sebagai draft untuk direview.</p>
        </Step>
      </ol>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          pick(e.dataTransfer.files[0]);
        }}
        className={cn(
          "flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-input bg-card px-6 py-12 text-center transition-colors",
          dragging && "border-primary bg-primary-soft",
        )}
      >
        {file ? (
          <>
            <span className="flex size-14 items-center justify-center rounded-2xl bg-success-soft text-success">
              <FileSpreadsheet className="size-7" aria-hidden />
            </span>
            <div>
              <div className="font-semibold">{file.name}</div>
              <div className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={pending}>
                Ganti file
              </Button>
              <Button variant="ghost" onClick={reset} disabled={pending}>
                <X aria-hidden /> Batal
              </Button>
            </div>
          </>
        ) : (
          <>
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <UploadCloud className="size-7" aria-hidden />
            </span>
            <div>
              <div className="font-semibold">Tarik & lepas file Excel di sini</div>
              <div className="text-sm text-muted-foreground">atau pilih dari perangkatmu</div>
            </div>
            <Button onClick={() => inputRef.current?.click()}>Pilih file .xlsx</Button>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="sr-only"
          aria-label="File Excel soal"
          onChange={(e) => pick(e.target.files?.[0])}
        />
      </div>

      {pending && (
        <p role="status" className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin" aria-hidden /> Membaca & memvalidasi file…
        </p>
      )}

      {result?.ok === false && (
        <p role="alert" className="flex gap-2 rounded-lg border border-destructive/40 bg-destructive-soft px-4 py-3 text-sm text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden /> {result.error}
        </p>
      )}

      {result?.ok === true && (
        <section aria-labelledby="preview-heading" className="surface-card overflow-hidden">
          <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 id="preview-heading" className="text-lg font-bold">
                Pratinjau hasil parsing
              </h2>
              <p className="mt-1 flex flex-wrap gap-x-4 text-sm">
                <span className="flex items-center gap-1.5 text-success">
                  <CircleCheck className="size-4" aria-hidden /> {result.valid.length} baris valid
                </span>
                <span className={cn("flex items-center gap-1.5", result.errors.length ? "text-destructive" : "text-muted-foreground")}>
                  <CircleAlert className="size-4" aria-hidden /> {result.errors.length} baris error
                </span>
              </p>
            </div>
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs font-semibold text-muted-foreground uppercase">
                <tr>
                  <th className="px-5 py-3">Baris</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Topik / Subtopik</th>
                  <th className="px-5 py-3">Pertanyaan</th>
                  <th className="px-5 py-3">Kunci</th>
                  <th className="px-5 py-3">Tingkat</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((row) =>
                  row.kind === "valid" ? (
                    <tr key={row.rowNumber}>
                      <td className="px-5 py-3 tabular-nums text-muted-foreground">{row.rowNumber}</td>
                      <td className="px-5 py-3">
                        <Badge variant="success">Valid</Badge>
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-medium">{row.topicName}</div>
                        <div className="text-xs text-muted-foreground">{row.subtopicName}</div>
                      </td>
                      <td className="max-w-md px-5 py-3">
                        <p className="line-clamp-2">{row.questionText}</p>
                      </td>
                      <td className="px-5 py-3 font-semibold">
                        {row.answer} <span className="text-xs font-normal text-muted-foreground">/ {row.optionCount} opsi</span>
                      </td>
                      <td className="px-5 py-3">{difficultyLabel[row.difficulty]}</td>
                    </tr>
                  ) : (
                    <tr key={row.rowNumber} className="bg-destructive-soft/50">
                      <td className="px-5 py-3 tabular-nums text-muted-foreground">{row.rowNumber}</td>
                      <td className="px-5 py-3">
                        <Badge variant="danger">Error</Badge>
                      </td>
                      <td colSpan={4} className="px-5 py-3 text-destructive">
                        {row.messages.join(" · ")}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
          <ul className="divide-y md:hidden">
            {rows.map((row) => (
              <li key={row.rowNumber} className="flex flex-col gap-1.5 p-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Baris {row.rowNumber}</span>
                  <Badge variant={row.kind === "valid" ? "success" : "danger"}>{row.kind === "valid" ? "Valid" : "Error"}</Badge>
                </div>
                {row.kind === "valid" ? (
                  <>
                    <p className="line-clamp-2">{row.questionText}</p>
                    <span className="text-xs text-muted-foreground">
                      {row.topicName} · {row.subtopicName} · Kunci {row.answer} · {difficultyLabel[row.difficulty]}
                    </span>
                  </>
                ) : (
                  <p className="text-destructive">{row.messages.join(" · ")}</p>
                )}
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-3 border-t bg-muted/30 p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {result.errors.length > 0
                ? "Perbaiki baris error di Excel lalu upload ulang, atau lanjutkan hanya dengan baris valid."
                : "Semua baris valid."}
            </p>
            <Button
              disabled
              title="Penyimpanan ke bank soal tersedia setelah database tersambung"
              className="shrink-0"
            >
              Simpan {result.valid.length} soal sebagai draft
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}

function Step({ n, title, active, children }: { n: number; title: string; active: boolean; children: React.ReactNode }) {
  return (
    <li className={cn("surface-card flex gap-4 p-5", active && "border-primary/40 ring-1 ring-primary/20")}>
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground",
          active && "bg-primary text-primary-foreground",
        )}
      >
        {n}
      </span>
      <div>
        <div className="font-semibold">{title}</div>
        {children}
      </div>
    </li>
  );
}
