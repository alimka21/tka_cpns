import "katex/dist/katex.min.css";
import { isRtlHtml } from "@/lib/text-direction";
import { cn } from "@/lib/utils";

/**
 * Tampilkan HTML hasil `renderMathToHtml` (inline) atau `renderRichText` (blok:
 * paragraf, list, tabel — gaya `.rich-text` di globals.css). Aman dipakai di
 * client component — tidak membawa library KaTeX, hanya CSS-nya.
 */
export function RichHtml({ html, className }: { html: string; className?: string }) {
  if (html.startsWith('<div class="rich-text">')) return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
  // Pilihan jawaban yang seluruhnya berbahasa Arab tampil kanan-ke-kiri (lib/text-direction.ts).
  return <span dir={isRtlHtml(html) ? "rtl" : undefined} className={cn("whitespace-pre-wrap", className)} dangerouslySetInnerHTML={{ __html: html }} />;
}
