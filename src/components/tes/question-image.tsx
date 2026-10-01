import { cn } from "@/lib/utils";

/**
 * Gambar soal/stimulus. Rasio asli selalu dipertahankan (w-auto h-auto —
 * tidak pernah direntangkan oleh flex), tinggi maks ±75% layar supaya
 * infografis tetap terbaca, dan bisa diklik untuk dibuka ukuran penuh.
 */
export function QuestionImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <figure className={cn("flex max-w-full flex-col items-start gap-1", className)}>
      <a href={src} target="_blank" rel="noreferrer" title="Buka gambar ukuran penuh" className="block max-w-full">
        {/* eslint-disable-next-line @next/next/no-img-element -- gambar dari route /gambar (DB) atau tautan admin */}
        <img
          src={src}
          alt={alt}
          decoding="async"
          loading="lazy"
          className="block h-auto max-h-[min(75vh,44rem)] w-auto max-w-full rounded-lg border bg-white object-contain"
        />
      </a>
      <figcaption className="text-xs text-muted-foreground">Klik gambar untuk memperbesar.</figcaption>
    </figure>
  );
}
