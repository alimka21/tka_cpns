"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Tunggu font & semua gambar selesai dimuat supaya PDF tidak bolong. */
async function contentReady() {
  await document.fonts?.ready;
  await Promise.all(
    [...document.images]
      .filter((img) => !img.complete)
      .map(
        (img) =>
          new Promise((resolve) => {
            img.addEventListener("load", resolve, { once: true });
            img.addEventListener("error", resolve, { once: true });
          }),
      ),
  );
}

/**
 * Bilah atas lembar unduhan (tidak ikut tercetak). Dibuka dengan `?otomatis=1`
 * → dialog cetak/Simpan PDF langsung terbuka setelah konten siap.
 */
export function PrintToolbar({ backHref }: { backHref: string }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    contentReady().then(() => {
      if (cancelled) return;
      setReady(true);
      const url = new URL(window.location.href);
      if (url.searchParams.get("otomatis") === "1") {
        // Hapus parameter supaya muat ulang tidak membuka dialog lagi.
        url.searchParams.delete("otomatis");
        window.history.replaceState(null, "", url);
        window.print();
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="sticky top-0 z-10 border-b bg-white/95 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-[210mm] flex-wrap items-center gap-3 px-4 py-3">
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={backHref} />}>
          <ArrowLeft aria-hidden /> Kembali
        </Button>
        <p className="min-w-0 flex-1 text-xs text-muted-foreground">
          Di jendela cetak, pilih tujuan <strong className="text-foreground">Simpan sebagai PDF</strong>, ukuran kertas A4.
        </p>
        <Button size="sm" onClick={() => window.print()} disabled={!ready}>
          {ready ? <Download aria-hidden /> : <LoaderCircle className="animate-spin" aria-hidden />} Unduh PDF
        </Button>
      </div>
    </div>
  );
}
