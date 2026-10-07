"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, BookOpenText, Check, Crown, Dumbbell, Layers, ShieldCheck, X } from "lucide-react";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

const BENEFITS = [
  { icon: BookOpenText, title: "Pembahasan setiap soal", text: "Pahami kenapa jawabanmu salah dan cara yang benar." },
  { icon: BarChart3, title: "Statistik kelemahan per subtopik", text: "Tahu persis bagian mana yang menahan skormu." },
  { icon: Dumbbell, title: "Latihan kelemahan otomatis", text: "Latih subtopik yang lemah sampai kuat." },
  { icon: Layers, title: "Semua paket tes Premium", text: "Tidak dibatasi 1 paket per mata pelajaran." },
];

/**
 * Popup ajakan Premium di halaman hasil akun gratis. Muncul sekali per
 * percobaan tes (`storageKey`), beberapa detik setelah hasil tampil — siswa
 * sempat melihat skornya dulu. Isinya personal (skor, jumlah salah) & jujur:
 * tanpa hitung mundur palsu atau testimoni buatan.
 */
export function UpgradeModal({
  storageKey,
  delayMs = 3000,
  correct,
  total,
  wrong,
  weakCount,
  priceText,
}: {
  storageKey: string;
  delayMs?: number;
  correct: number;
  total: number;
  wrong: number;
  weakCount: number;
  priceText: string | null;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem(storageKey) === "1";
    } catch {
      // localStorage tidak tersedia → tetap tampilkan sekali di sesi ini
    }
    if (seen) return;
    const t = setTimeout(() => {
      setOpen(true);
      try {
        localStorage.setItem(storageKey, "1");
      } catch {}
    }, delayMs);
    return () => clearTimeout(t);
  }, [storageKey, delayMs]);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] gap-0 overflow-y-auto p-0 data-[size=default]:max-w-lg data-[size=default]:sm:max-w-lg">
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
            <Crown className="size-3.5 text-cta" aria-hidden /> Premium Pakar TKA
          </span>
          <AlertDialogTitle className="mt-3 text-xl leading-snug font-extrabold sm:text-2xl">
            {wrong > 0 ? `Ada ${wrong} soal yang bisa jadi poin tambahanmu` : "Skormu bisa lebih tinggi lagi"}
          </AlertDialogTitle>
          <AlertDialogDescription className="mt-2 text-sm text-primary-foreground/85">
            Kamu benar {correct} dari {total} soal.
            {weakCount > 0 ? ` Kami menemukan ${weakCount} subtopik yang perlu diperkuat` : " Lihat bagian mana yang masih bisa ditingkatkan"} — Premium
            menunjukkan yang mana dan cara memperbaikinya.
          </AlertDialogDescription>
        </div>

        <div className="flex flex-col gap-4 p-6">
          <ul className="flex flex-col gap-3">
            {BENEFITS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <Icon className="size-[18px]" aria-hidden />
                </span>
                <span>
                  <span className="block text-sm font-bold">{title}</span>
                  <span className="block text-sm text-muted-foreground">{text}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-2">
            <Button size="lg" variant="cta" className="w-full" nativeButton={false} render={<Link href="/langganan" />}>
              <Crown aria-hidden /> Tingkatkan ke Premium{priceText ? ` — ${priceText}` : ""}
            </Button>
            <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setOpen(false)}>
              Lihat hasil dulu
            </Button>
          </div>

          <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <ShieldCheck className="size-3.5 text-success-strong" aria-hidden /> Bayar QRIS
            </span>
            <span className="flex items-center gap-1">
              <Check className="size-3.5 text-success-strong" aria-hidden /> Aktif otomatis
            </span>
            <span className="flex items-center gap-1">
              <Check className="size-3.5 text-success-strong" aria-hidden /> Tanpa perpanjangan otomatis
            </span>
          </p>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
