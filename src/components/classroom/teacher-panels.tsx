"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, Check, Copy, Download, GraduationCap, MessageCircle, Pencil, Plus, RefreshCw, Trash2, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createAssignmentAction,
  createClassAction,
  deleteAssignmentAction,
  enableTeacherAction,
  removeMemberAction,
  updateClassAction,
} from "@/server/actions/classroom";
import type { PackageChoice } from "@/server/services/classroom";

type Msg = { ok: boolean; text: string } | null;
type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

const selectClass = "h-10 w-full rounded-lg border border-input bg-card px-3 text-sm";

function useAction() {
  const router = useRouter();
  const [msg, setMsg] = useState<Msg>(null);
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<ActionResult>, after?: () => void) =>
    start(async () => {
      const r = await fn();
      setMsg(r.ok ? { ok: true, text: r.message ?? "Tersimpan." } : { ok: false, text: r.error });
      if (r.ok) {
        after?.();
        router.refresh();
      }
    });
  return { msg, pending, run };
}

function MsgLine({ msg }: { msg: Msg }) {
  return msg ? (
    <p role="status" className={`text-sm ${msg.ok ? "text-success-strong" : "text-destructive"}`}>
      {msg.text}
    </p>
  ) : null;
}

export function EnableTeacherButton() {
  const { msg, pending, run } = useAction();
  return (
    <div className="flex flex-col items-start gap-2">
      <Button onClick={() => run(() => enableTeacherAction())} disabled={pending}>
        <GraduationCap aria-hidden /> {pending ? "Mengaktifkan…" : "Aktifkan akun guru"}
      </Button>
      <MsgLine msg={msg} />
    </div>
  );
}

export function CreateClassForm({ defaultJenjang }: { defaultJenjang: string }) {
  const { msg, pending, run } = useAction();
  return (
    <form
      className="grid gap-3 sm:grid-cols-[1fr_10rem_auto] sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const f = new FormData(form);
        run(() => createClassAction({ name: String(f.get("name") ?? ""), jenjang: String(f.get("jenjang") ?? "") }), () => form.reset());
      }}
    >
      <div className="grid gap-1.5">
        <Label htmlFor="class-name">Nama kelas</Label>
        <Input id="class-name" name="name" required minLength={2} maxLength={100} placeholder="mis. 6A — Persiapan TKA" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="class-jenjang">Jenjang</Label>
        <select id="class-jenjang" name="jenjang" defaultValue={defaultJenjang} className={selectClass}>
          <option value="SD">SD</option>
          <option value="SMP">SMP</option>
          <option value="SMA">SMA</option>
        </select>
      </div>
      <Button type="submit" disabled={pending}>
        <Plus aria-hidden /> {pending ? "Membuat…" : "Buat kelas"}
      </Button>
      <div className="sm:col-span-3">
        <MsgLine msg={msg} />
      </div>
    </form>
  );
}

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (key: string, text: string) => {
    await navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied((c) => (c === key ? null : c)), 2000);
  };
  return { copied, copy };
}

/** Kode kelas + link gabung dengan tombol salin, WhatsApp, dan QR. */
export function ClassShare({ code, link, waText, qrPng, archived }: { code: string; link: string; waText: string; qrPng: string; archived: boolean }) {
  const { copied, copy } = useCopy();
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
      <div className="rounded-xl border bg-primary-soft/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Kode kelas</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span className="font-mono text-2xl font-bold tracking-[0.2em] text-primary">{code}</span>
          <Button size="sm" variant="outline" onClick={() => copy("code", code)}>
            {copied === "code" ? <Check aria-hidden /> : <Copy aria-hidden />}
            {copied === "code" ? "Tersalin" : "Salin"}
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {archived ? "Kelas diarsipkan — kode tidak menerima anggota baru." : "Siswa memasukkan kode ini di menu Kelas setelah daftar/masuk."}
        </p>
      </div>
      <div className="min-w-0 rounded-xl border p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Link gabung kelas</p>
        <p className="mt-2 truncate rounded-md bg-muted px-3 py-2 font-mono text-sm" title={link}>
          {link}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => copy("link", link)}>
            {copied === "link" ? <Check aria-hidden /> : <Copy aria-hidden />}
            {copied === "link" ? "Tersalin" : "Salin link"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => copy("wa", waText)}>
            {copied === "wa" ? <Check aria-hidden /> : <Copy aria-hidden />}
            {copied === "wa" ? "Tersalin" : "Salin pesan"}
          </Button>
          <Button size="sm" nativeButton={false} render={<a href={`https://wa.me/?text=${encodeURIComponent(waText)}`} target="_blank" rel="noopener noreferrer" />}>
            <MessageCircle aria-hidden /> Bagikan ke WhatsApp
          </Button>
        </div>
      </div>
      <div className="flex flex-col items-center gap-2 rounded-xl border p-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- data URL QR dari server */}
        <img src={qrPng} alt={`QR code gabung kelas ${code}`} width={120} height={120} className="rounded bg-white p-1" />
        <Button size="sm" variant="outline" nativeButton={false} render={<a href={qrPng} download={`qr-kelas-${code}.png`} />}>
          <Download aria-hidden /> Unduh QR
        </Button>
      </div>
    </div>
  );
}

/** Ganti nama, arsip, kode baru, hapus kelas. */
export function ClassSettings({ classId, name, archived }: { classId: number; name: string; archived: boolean }) {
  const router = useRouter();
  const { msg, pending, run } = useAction();
  const [editing, setEditing] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      {editing ? (
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            run(() => updateClassAction({ classId, action: "rename", name: String(f.get("name") ?? "") }), () => setEditing(false));
          }}
        >
          <div className="grid min-w-60 flex-1 gap-1.5">
            <Label htmlFor="rename-class">Nama kelas</Label>
            <Input id="rename-class" name="name" defaultValue={name} required minLength={2} maxLength={100} />
          </div>
          <Button type="submit" size="sm" disabled={pending}>
            Simpan
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Batal
          </Button>
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            <Pencil aria-hidden /> Ganti nama
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => {
              if (confirm("Buat kode kelas baru? Kode & link lama tidak berlaku lagi (siswa yang sudah bergabung tetap di kelas).")) {
                run(() => updateClassAction({ classId, action: "regenerate" }));
              }
            }}
          >
            <RefreshCw aria-hidden /> Kode baru
          </Button>
          <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => updateClassAction({ classId, action: archived ? "unarchive" : "archive" }))}>
            {archived ? <ArchiveRestore aria-hidden /> : <Archive aria-hidden />} {archived ? "Aktifkan lagi" : "Arsipkan"}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={pending}
            onClick={() => {
              if (confirm(`Hapus kelas "${name}"? Daftar anggota dan tugas ikut terhapus. Hasil tes siswa tidak terhapus.`)) {
                run(
                  () => updateClassAction({ classId, action: "delete" }),
                  () => router.push("/guru"),
                );
              }
            }}
          >
            <Trash2 aria-hidden /> Hapus kelas
          </Button>
        </div>
      )}
      <MsgLine msg={msg} />
    </div>
  );
}

export function RemoveMemberButton({ classId, userId, name }: { classId: number; userId: number; name: string }) {
  const { pending, run } = useAction();
  return (
    <Button
      size="icon-sm"
      variant="ghost"
      aria-label={`Keluarkan ${name}`}
      title="Keluarkan dari kelas"
      disabled={pending}
      onClick={() => {
        if (confirm(`Keluarkan ${name} dari kelas? Anda tidak bisa lagi melihat progresnya.`)) run(() => removeMemberAction({ classId, userId }));
      }}
    >
      <UserMinus aria-hidden />
    </Button>
  );
}

/** Nilai default datetime-local: jam berikutnya (zona waktu browser). */
function nextHourLocal() {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AssignmentForm({ classId, packages, nonPremiumCount }: { classId: number; packages: PackageChoice[]; nonPremiumCount: number }) {
  const { msg, pending, run } = useAction();
  const [pkgId, setPkgId] = useState("");
  const [startsAt] = useState(nextHourLocal);
  const chosen = packages.find((p) => String(p.id) === pkgId);
  const free = packages.filter((p) => !p.isPremium);
  const premium = packages.filter((p) => p.isPremium);
  const label = (p: PackageChoice) => `${p.subjectName ? `${p.subjectName} — ` : ""}${p.title} (${p.questionCount} soal, ${p.durationMinutes} menit)`;

  if (packages.length === 0) return <p className="text-sm text-muted-foreground">Belum ada paket tes tayang untuk jenjang kelas ini.</p>;

  return (
    <form
      className="grid gap-3 md:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const f = new FormData(form);
        const toIso = (v: FormDataEntryValue | null) => (v ? new Date(String(v)).toISOString() : "");
        run(
          () =>
            createAssignmentAction({
              classId,
              testPackageId: pkgId,
              startsAt: toIso(f.get("startsAt")),
              dueAt: toIso(f.get("dueAt")),
              note: String(f.get("note") ?? ""),
            }),
          () => {
            form.reset();
            setPkgId("");
          },
        );
      }}
    >
      <div className="grid gap-1.5 md:col-span-2">
        <Label htmlFor="asg-package">Paket tes</Label>
        <select id="asg-package" required value={pkgId} onChange={(e) => setPkgId(e.target.value)} className={selectClass}>
          <option value="" disabled>
            Pilih paket…
          </option>
          {free.length > 0 && (
            <optgroup label="Gratis — bisa dikerjakan semua siswa">
              {free.map((p) => (
                <option key={p.id} value={p.id}>
                  {label(p)}
                </option>
              ))}
            </optgroup>
          )}
          {premium.length > 0 && (
            <optgroup label="Premium — hanya siswa Premium">
              {premium.map((p) => (
                <option key={p.id} value={p.id}>
                  {label(p)}
                </option>
              ))}
            </optgroup>
          )}
        </select>
        {chosen?.isPremium && nonPremiumCount > 0 && (
          <p className="rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning-strong">
            Paket Premium: {nonPremiumCount} siswa di kelas ini belum Premium dan akan melihat tugas ini terkunci.
          </p>
        )}
        {chosen && !chosen.isPremium && (
          <p className="text-xs text-muted-foreground">
            Paket gratis tetap mengikuti batas akun gratis: 1 paket gratis per mata pelajaran. Siswa non-Premium yang sudah memakai jatahnya di paket lain
            akan melihat tugas ini terkunci.
          </p>
        )}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="asg-start">Mulai</Label>
        <Input id="asg-start" name="startsAt" type="datetime-local" required defaultValue={startsAt} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="asg-due">Batas waktu (opsional)</Label>
        <Input id="asg-due" name="dueAt" type="datetime-local" />
      </div>
      <div className="grid gap-1.5 md:col-span-2">
        <Label htmlFor="asg-note">Catatan untuk siswa (opsional)</Label>
        <Input id="asg-note" name="note" maxLength={500} placeholder="mis. Kerjakan sendiri, tanpa membuka buku." />
      </div>
      <div className="flex flex-wrap items-center gap-3 md:col-span-2">
        <Button type="submit" disabled={pending}>
          <Plus aria-hidden /> {pending ? "Menyimpan…" : "Buat tugas"}
        </Button>
        <MsgLine msg={msg} />
      </div>
    </form>
  );
}

export function DeleteAssignmentButton({ classId, assignmentId, title }: { classId: number; assignmentId: number; title: string }) {
  const { pending, run } = useAction();
  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={pending}
      onClick={() => {
        if (confirm(`Hapus tugas "${title}"? Hasil tes siswa tetap tersimpan.`)) run(() => deleteAssignmentAction({ classId, assignmentId }));
      }}
    >
      <Trash2 aria-hidden /> Hapus
    </Button>
  );
}
