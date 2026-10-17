"use client";

import { useState } from "react";
import Link from "next/link";
import { Crown, Download, FileText, Printer, ShieldCheck, X } from "lucide-react";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

const PERKS = [
  { icon: FileText, text: "Naskah soal rapi format A4, siap dicetak" },
  { icon: Printer, text: "Latihan di kertas, tanpa layar & tanpa sinyal" },
  { icon: Crown, text: "Semua paket tes Premium + pembahasan lengkap" },
];

/** Tombol merah mencolok "Unduh PDF" (sama untuk akun Premium & gratis). */
const DOWNLOAD_CLASS = "shrink-0 bg-destructive font-semibold text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/30";

/**
 * Tombol unduh naskah soal paket. Premium → buka lembar cetak (/unduh/[id])
 * di tab baru; akun gratis → popup ajakan Premium (tidak ada yang terunduh).
 */
export function DownloadPackageButton({ packageId, premium }: { packageId: number; premium: boolean }) {
  const [open, setOpen] = useState(false);

  if (premium) {
    return (
      <Button
        className={DOWNLOAD_CLASS}
        title="Unduh naskah soal paket ini (PDF)"
        nativeButton={false}
        render={<a href={`/unduh/${packageId}?otomatis=1`} target="_blank" rel="noopener" />}
      >
        <Download aria-hidden /> Unduh PDF
      </Button>
    );
  }

  return (
    <>
      <Button className={DOWNLOAD_CLASS} title="Unduh naskah soal (PDF) — khusus Premium" onClick={() => setOpen(true)}>
        <Download aria-hidden /> Unduh PDF
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] gap-0 overflow-y-auto p-0 data-[size=default]:max-w-md data-[size=default]:sm:max-w-md">
          <div className="relative bg-gradient-to-br from-primary to-[#1e40af] px-6 pt-6 pb-5 text-primary-foreground">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Tutup"
              className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-full text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground"
            >
              <X className="size-4" aria-hidden />
            </button>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
              <Crown className="size-3.5 text-cta" aria-hidden /> Fitur Premium
            </span>
            <AlertDialogTitle className="mt-3 text-xl leading-snug font-extrabold">Unduh paket soal khusus Premium</AlertDialogTitle>
            <AlertDialogDescription className="mt-2 text-sm text-primary-foreground/85">
              Tingkatkan akunmu ke Premium untuk mengunduh paket tes sebagai PDF — rapi seperti naskah soal resmi.
            </AlertDialogDescription>
          </div>
          <div className="flex flex-col gap-4 p-6">
            <ul className="flex flex-col gap-2.5">
              {PERKS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-2">
              <Button size="lg" variant="cta" className="w-full" nativeButton={false} render={<Link href="/langganan" />}>
                <Crown aria-hidden /> Tingkatkan ke Premium
              </Button>
              <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setOpen(false)}>
                Nanti saja
              </Button>
            </div>
            <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5 text-success-strong" aria-hidden /> Bayar QRIS · aktif begitu terverifikasi
            </p>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
