"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Shape = "normal" | "wide" | "tall";

/** Rasio lebar:tinggi → bentuk tampilan. */
function shapeOf(width: number, height: number): Shape {
  if (!width || !height) return "normal";
  const ratio = width / height;
  if (ratio >= 2.2) return "wide";
  if (ratio <= 0.7) return "tall";
  return "normal";
}

// Rasio asli SELALU dipertahankan (h-auto/w-auto + object-contain, tidak ada
// tinggi & lebar tetap bersamaan). Yang disesuaikan hanya batas ukurannya:
// - wide (tabel/diagram melebar, rasio ≥ 2,2): selebar kolom supaya teksnya
//   tidak tampak gepeng & kecil di HP (diperbesar maks. 2× ukuran asli);
// - tall (rasio ≤ 0,7): tinggi maks ±80% layar, di tengah;
// - normal: tinggi maks ±75% layar.
const SHAPE_CLASS: Record<Shape, string> = {
  normal: "h-auto w-auto max-w-full max-h-[min(75vh,44rem)]",
  wide: "h-auto w-full",
  tall: "mx-auto h-auto w-auto max-w-full max-h-[min(80vh,48rem)]",
};

/**
 * Gambar soal/stimulus. Gambar galeri (`/gambar/<id>`) dikirim dalam ukuran
 * lebih kecil untuk layar HP/tablet (`?w=`, dikompres otomatis di server);
 * ukuran tampilnya tetap sama karena varian tidak pernah lebih kecil dari
 * lebar kolom di layar tersebut. Bisa diklik untuk dibuka ukuran penuh.
 */
export function QuestionImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [shape, setShape] = useState<Shape>("normal");
  const [natural, setNatural] = useState<number | null>(null);
  const gallery = /^\/gambar\/\d+$/.test(src);

  const img = (
    // eslint-disable-next-line @next/next/no-img-element -- gambar dari route /gambar (DB) atau tautan admin
    <img
      src={src}
      alt={alt}
      decoding="async"
      loading="lazy"
      onLoad={(e) => {
        const el = e.currentTarget;
        setShape(shapeOf(el.naturalWidth, el.naturalHeight));
        setNatural(el.naturalWidth);
      }}
      // Gambar lebar boleh mengisi kolom, tetapi tidak diperbesar lebih dari 2× (tetap tajam).
      style={shape === "wide" && natural ? { maxWidth: `min(100%, ${natural * 2}px)` } : undefined}
      className={cn("block rounded-lg border bg-white object-contain", SHAPE_CLASS[shape])}
    />
  );

  return (
    <figure className={cn("flex max-w-full flex-col gap-1", shape === "tall" ? "items-center" : "items-start", shape === "wide" && "w-full", className)}>
      <a href={src} target="_blank" rel="noreferrer" title="Buka gambar ukuran penuh" className={cn("block max-w-full", shape === "wide" && "w-full")}>
        {gallery ? (
          <picture className={cn("block max-w-full", shape === "wide" && "w-full")}>
            <source media="(max-width: 640px)" srcSet={`${src}?w=800`} />
            <source media="(max-width: 1024px)" srcSet={`${src}?w=1200`} />
            {img}
          </picture>
        ) : (
          img
        )}
      </a>
      <figcaption className="text-xs text-muted-foreground">Klik gambar untuk memperbesar.</figcaption>
    </figure>
  );
}
