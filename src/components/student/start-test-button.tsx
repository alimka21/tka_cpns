"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, FileQuestion, LoaderCircle, Play, RotateCcw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

/**
 * Tombol masuk ke tes dengan konfirmasi dulu: judul paket, jumlah soal, durasi,
 * lalu "Lanjutkan" (ke /tes/...) atau "Batal". Timer server baru berjalan setelah lanjut.
 */
export function StartTestButton({
  href,
  title,
  questionCount,
  durationMinutes,
  label = "Mulai Tes",
  variant,
  className,
  retake = false,
}: {
  href: string;
  title: string;
  questionCount: number;
  durationMinutes: number;
  label?: string;
  variant?: "default" | "outline";
  className?: string;
  /** Mengerjakan ulang paket yang sudah pernah dikerjakan (ikon putar ulang). */
  retake?: boolean;
}) {
  // Ikon dipilih di sini, bukan lewat prop: komponen server tidak boleh mengirim fungsi (komponen ikon) ke komponen client.
  const Icon = retake ? RotateCcw : Play;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [going, setGoing] = useState(false);

  return (
    <>
      <Button variant={variant} className={className} onClick={() => setOpen(true)}>
        <Icon aria-hidden /> {label}
      </Button>
      <AlertDialog open={open} onOpenChange={(o) => !going && setOpen(o)}>
        <AlertDialogContent className="data-[size=default]:max-w-md data-[size=default]:sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">{retake ? "Kerjakan ulang paket ini?" : "Mulai mengerjakan paket tes?"}</AlertDialogTitle>
            <AlertDialogDescription>
              Kamu akan mengerjakan <strong className="text-foreground">{title}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <dl className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 rounded-xl bg-primary-soft p-3">
              <FileQuestion className="size-6 shrink-0 text-primary" aria-hidden />
              <div>
                <dt className="text-xs text-muted-foreground">Jumlah soal</dt>
                <dd className="text-lg font-bold tabular-nums">{questionCount} soal</dd>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-warning-soft p-3">
              <Clock className="size-6 shrink-0 text-warning-strong" aria-hidden />
              <div>
                <dt className="text-xs text-muted-foreground">Durasi</dt>
                <dd className="text-lg font-bold tabular-nums">{durationMinutes} menit</dd>
              </div>
            </div>
          </dl>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-muted-foreground">
            <li>Waktu mulai berjalan begitu kamu menekan Lanjutkan dan tidak berhenti walau halaman ditutup.</li>
            <li>Jawaban tersimpan otomatis; tes terkumpul otomatis saat waktu habis.</li>
            {!retake && <li>Bila tes ini sedang berlangsung, kamu melanjutkan dari jawaban terakhir.</li>}
          </ul>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={going}>Batal</AlertDialogCancel>
            <Button
              disabled={going}
              onClick={() => {
                setGoing(true);
                router.push(href);
              }}
            >
              {going ? <LoaderCircle className="animate-spin" aria-hidden /> : <Play aria-hidden />}
              {going ? "Menyiapkan tes…" : "Lanjutkan"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
