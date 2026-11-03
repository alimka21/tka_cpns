"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, CircleCheck, ImageIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { LEAD_MAGNET_ACCEPT, LEAD_MAGNET_MAX_BYTES, LEAD_MAGNET_PREVIEW_MAX_BYTES, leadMagnetInput } from "@/lib/validation/lead-magnet";
import { saveLeadMagnetAction, saveLeadMagnetPreviewAction } from "@/server/actions/lead-magnets";
import type { LeadMagnetEdit } from "@/server/services/lead-magnets";

type PackageOption = { id: number; title: string; isPremium: boolean };

const fieldClass = "w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25";
const PREVIEW_ACCEPT = "image/png,image/jpeg,image/webp";
const mb = (bytes: number) => `${Math.round(bytes / 1024 / 1024)} MB`;

export function LeadMagnetForm({ initial, packages, siteUrl }: { initial?: LeadMagnetEdit; packages: PackageOption[]; siteUrl: string }) {
  const router = useRouter();
  const [saving, startSaving] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [requiresLogin, setRequiresLogin] = useState(initial?.requiresLogin ?? true);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [removePreview, setRemovePreview] = useState(false);
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const key = initial?.id ?? "new";

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const el = e.currentTarget;
    const form = new FormData(el);
    const file = form.get("file");
    const preview = form.get("preview");
    form.delete("preview");
    form.set("requiresLogin", String(requiresLogin));
    form.set("isActive", String(isActive));
    if (initial) form.set("id", String(initial.id));

    const parsed = leadMagnetInput.safeParse({
      slug: form.get("slug"),
      title: form.get("title"),
      requiresLogin,
      isActive,
    });
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    if (!initial && !(file instanceof File && file.size > 0)) return setError("Pilih file materi (PDF, PNG, JPG, atau WebP).");
    if (file instanceof File && file.size > LEAD_MAGNET_MAX_BYTES) return setError(`File materi maksimal ${mb(LEAD_MAGNET_MAX_BYTES)}.`);
    if (preview instanceof File && preview.size > LEAD_MAGNET_PREVIEW_MAX_BYTES) return setError(`Gambar pratinjau maksimal ${mb(LEAD_MAGNET_PREVIEW_MAX_BYTES)}.`);

    setError(null);
    setSaved(false);
    startSaving(async () => {
      const failed = { ok: false as const, error: "Koneksi terputus. Coba lagi." };
      const result = await saveLeadMagnetAction(form).catch(() => failed);
      if (!result.ok) return setError(result.error);
      // Pratinjau di request terpisah (batas ukuran server action).
      if ((preview instanceof File && preview.size > 0) || removePreview) {
        const previewForm = new FormData();
        previewForm.set("id", String(result.id));
        if (preview instanceof File && preview.size > 0) previewForm.set("file", preview);
        else previewForm.set("remove", "true");
        const previewResult = await saveLeadMagnetPreviewAction(previewForm).catch(() => failed);
        if (!previewResult.ok) return setError(`Materi tersimpan, tetapi gambar pratinjau gagal: ${previewResult.error}`);
      }
      if (!initial) {
        router.push(`/admin/materi/${result.id}?baru=1`);
        return;
      }
      setSaved(true);
      setRemovePreview(false);
      // File yang sudah terunggah tidak dikirim ulang di simpan berikutnya.
      el.querySelectorAll<HTMLInputElement>('input[type="file"]').forEach((input) => (input.value = ""));
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="surface-card flex flex-col gap-5 p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`lm-title-${key}`} className="font-semibold">
            Judul
          </Label>
          <Input id={`lm-title-${key}`} name="title" required maxLength={200} defaultValue={initial?.title} placeholder="Tips Lolos TKA Gelombang 2" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`lm-slug-${key}`} className="font-semibold">
            Slug (alamat halaman)
          </Label>
          <Input
            id={`lm-slug-${key}`}
            name="slug"
            required
            maxLength={80}
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
            placeholder="tips-gelombang-2"
          />
          <p className="break-all text-xs text-muted-foreground">
            {siteUrl}/materi/{slug || "…"}
            {initial && slug !== initial.slug && " — slug berubah: link kampanye lama tidak berlaku lagi."}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`lm-desc-${key}`} className="font-semibold">
          Deskripsi <span className="font-normal text-muted-foreground">(tampil ke pengunjung)</span>
        </Label>
        <textarea id={`lm-desc-${key}`} name="description" rows={3} maxLength={2000} defaultValue={initial?.description ?? ""} className={fieldClass} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`lm-preview-text-${key}`} className="font-semibold">
          Cuplikan isi <span className="font-normal text-muted-foreground">(opsional, teks pratinjau sebelum unduh)</span>
        </Label>
        <textarea id={`lm-preview-text-${key}`} name="previewText" rows={5} maxLength={5000} defaultValue={initial?.previewText ?? ""} className={fieldClass} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`lm-file-${key}`} className="font-semibold">
            File materi {initial && <span className="font-normal text-muted-foreground">(kosongkan bila tidak diganti)</span>}
          </Label>
          <input id={`lm-file-${key}`} name="file" type="file" accept={LEAD_MAGNET_ACCEPT} required={!initial} className={fieldClass} />
          <p className="text-xs text-muted-foreground">
            PDF, PNG, JPG, atau WebP · maks {mb(LEAD_MAGNET_MAX_BYTES)}
            {initial && ` · sekarang: ${initial.fileName} (${Math.ceil(initial.fileSize / 1024)} KB)`}
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`lm-preview-${key}`} className="font-semibold">
            Gambar pratinjau <span className="font-normal text-muted-foreground">(opsional, publik)</span>
          </Label>
          <input id={`lm-preview-${key}`} name="preview" type="file" accept={PREVIEW_ACCEPT} className={fieldClass} />
          <p className="text-xs text-muted-foreground">PNG, JPG, atau WebP · maks {mb(LEAD_MAGNET_PREVIEW_MAX_BYTES)} · dikompres otomatis</p>
          {initial?.previewUrl && !removePreview && (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- gambar dari route /materi/<slug>/pratinjau (DB) */}
              <img src={initial.previewUrl} alt="Pratinjau sekarang" className="h-16 w-auto rounded border" />
              <Button type="button" variant="ghost" size="sm" onClick={() => setRemovePreview(true)}>
                <Trash2 aria-hidden /> Hapus gambar
              </Button>
            </div>
          )}
          {removePreview && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ImageIcon className="size-3.5" aria-hidden /> Gambar pratinjau akan dihapus saat disimpan.
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5 sm:max-w-md">
        <Label htmlFor={`lm-cta-${key}`} className="font-semibold">
          Paket tes yang ditawarkan
        </Label>
        <select id={`lm-cta-${key}`} name="ctaPackageId" defaultValue={initial?.ctaPackageId ?? ""} className="h-10 rounded-lg border border-input bg-card px-3 text-sm">
          <option value="">— Demo Tes (tanpa daftar) —</option>
          {packages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.isPremium ? "[Premium] " : "[Gratis] "}
              {p.title}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-3 text-sm">
          <Switch checked={requiresLogin} onCheckedChange={setRequiresLogin} label="Wajib login untuk unduh" />
          <span>
            <span className="font-semibold">Wajib daftar/login untuk unduh</span>
            <span className="block text-xs text-muted-foreground">Mati = siapa pun bisa unduh langsung (tetap tercatat).</span>
          </span>
        </label>
        <label className="flex items-center gap-3 text-sm">
          <Switch checked={isActive} onCheckedChange={setIsActive} label="Aktif" />
          <span>
            <span className="font-semibold">Aktif</span>
            <span className="block text-xs text-muted-foreground">Nonaktif = halaman /materi/{slug || "…"} tidak bisa dibuka.</span>
          </span>
        </label>
      </div>

      {error && (
        <p role="alert" className="flex gap-2 rounded-lg border border-destructive/40 bg-destructive-soft p-3 text-sm text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden /> {error}
        </p>
      )}
      {saved && (
        <p role="status" className="flex gap-2 rounded-lg border border-success/40 bg-success-soft p-3 text-sm text-success-strong">
          <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden /> Perubahan tersimpan.
        </p>
      )}
      <Button type="submit" className="w-fit" disabled={saving}>
        {saving ? "Menyimpan…" : initial ? "Simpan perubahan" : "Simpan materi"}
      </Button>
    </form>
  );
}
