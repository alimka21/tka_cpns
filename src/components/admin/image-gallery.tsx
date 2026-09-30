"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleAlert, CircleCheck, ImagePlus, LoaderCircle, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { deleteQuestionImageAction, renameQuestionImageAction, uploadQuestionImageAction } from "@/server/actions/question-images";

export type GalleryImage = { id: number; title: string; width: number; height: number; sizeBytes: number; usedBy: number };

type UploadRow = { key: string; name: string; state: "waiting" | "uploading" | "done" | "duplicate" | "error"; message?: string };

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

export function ImageUploader() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<UploadRow[]>([]);
  const [dragging, setDragging] = useState(false);
  const busy = rows.some((r) => r.state === "waiting" || r.state === "uploading");

  async function upload(files: File[]) {
    if (files.length === 0) return;
    const batch = files.map((f, i) => ({ key: `${Date.now()}-${i}`, name: f.name, state: "waiting" as const }));
    setRows((prev) => [...batch, ...prev]);
    const set = (key: string, patch: Partial<UploadRow>) => setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
    // Satu per satu: request kecil & progres jelas per file.
    for (const [i, file] of files.entries()) {
      const key = batch[i].key;
      set(key, { state: "uploading" });
      const form = new FormData();
      form.set("file", file);
      const result = await uploadQuestionImageAction(form).catch(() => ({ ok: false as const, error: "Koneksi terputus." }));
      if (!result.ok) set(key, { state: "error", message: result.error });
      else set(key, { state: result.image.duplicate ? "duplicate" : "done", message: result.image.duplicate ? `Sudah ada (#${result.image.id})` : `#${result.image.id}` });
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void upload([...e.dataTransfer.files].filter((f) => f.type.startsWith("image/")));
        }}
        className={cn(
          "flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors hover:border-primary/60 hover:bg-primary-soft/40",
          dragging && "border-primary bg-primary-soft",
        )}
      >
        <ImagePlus className="size-8 text-primary" aria-hidden />
        <span className="font-semibold">Seret gambar ke sini, atau klik untuk memilih</span>
        <span className="text-xs text-muted-foreground">
          Bisa banyak sekaligus · JPG/PNG/WebP/GIF · maks 10 MB per file · otomatis dikompres (maks 1600 px)
        </span>
      </button>
      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => {
          void upload([...(e.target.files ?? [])]);
          e.target.value = "";
        }}
      />
      {rows.length > 0 && (
        <ul className="surface-card divide-y text-sm" aria-live="polite">
          {rows.slice(0, 30).map((r) => (
            <li key={r.key} className="flex items-center gap-3 px-4 py-2">
              {r.state === "uploading" || r.state === "waiting" ? (
                <LoaderCircle className={cn("size-4 shrink-0 text-muted-foreground", r.state === "uploading" && "animate-spin text-primary")} aria-hidden />
              ) : r.state === "error" ? (
                <CircleAlert className="size-4 shrink-0 text-destructive" aria-hidden />
              ) : (
                <CircleCheck className="size-4 shrink-0 text-success-strong" aria-hidden />
              )}
              <span className="min-w-0 flex-1 truncate">{r.name}</span>
              <span className={cn("text-xs", r.state === "error" ? "text-destructive" : "text-muted-foreground")}>
                {r.state === "waiting" ? "Menunggu" : r.state === "uploading" ? "Mengunggah…" : r.message}
              </span>
            </li>
          ))}
        </ul>
      )}
      {busy && <p className="text-xs text-muted-foreground">Jangan tutup halaman sampai semua selesai.</p>}
    </div>
  );
}

export function ImageCard({ image }: { image: GalleryImage }) {
  const router = useRouter();
  const [title, setTitle] = useState(image.title);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    if (title.trim() === image.title) return;
    startTransition(async () => {
      const r = await renameQuestionImageAction({ id: image.id, title });
      if (!r.ok) setError(r.error);
    });
  }

  return (
    <li className="surface-card flex flex-col overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element -- gambar dari route /gambar (DB), bukan aset statis */}
      <img src={`/gambar/${image.id}`} alt={image.title} loading="lazy" className="aspect-[4/3] w-full bg-muted object-contain" />
      <div className="flex flex-1 flex-col gap-2 p-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={save}
          aria-label={`Judul gambar #${image.id}`}
          className="h-8 text-sm"
        />
        <p className="text-xs text-muted-foreground tabular-nums">
          #{image.id} · {image.width}×{image.height} · {Math.round(image.sizeBytes / 1024)} KB ·{" "}
          {image.usedBy > 0 ? `dipakai ${image.usedBy} soal` : "belum dipakai"}
        </p>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="mt-auto flex gap-2">
          <Button size="sm" className="flex-1" nativeButton={false} render={<Link href={`/admin/soal/generate-ai?mode=gambar&gambar=${image.id}`} />}>
            <Sparkles aria-hidden /> Buat soal
          </Button>
          <Button
            size="icon-sm"
            variant="outline"
            aria-label={`Hapus gambar #${image.id}`}
            disabled={pending || image.usedBy > 0}
            title={image.usedBy > 0 ? "Dipakai soal — tidak bisa dihapus" : "Hapus"}
            onClick={() => {
              if (!window.confirm(`Hapus gambar "${image.title}"?`)) return;
              startTransition(async () => {
                const r = await deleteQuestionImageAction(image.id);
                if (!r.ok) setError(r.error);
                else router.refresh();
              });
            }}
          >
            <Trash2 aria-hidden />
          </Button>
        </div>
      </div>
    </li>
  );
}
