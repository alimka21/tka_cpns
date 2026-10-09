import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";

/**
 * Tampilkan HTML hasil `renderMathToHtml` (inline) atau `renderRichText` (blok:
 * paragraf, list, tabel — gaya `.rich-text` di globals.css). Aman dipakai di
 * client component — tidak membawa library KaTeX, hanya CSS-nya.
 */
export function RichHtml({ html, className }: { html: string; className?: string }) {
  if (html.startsWith('<div class="rich-text">')) return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
  return <span className={cn("whitespace-pre-wrap", className)} dangerouslySetInnerHTML={{ __html: html }} />;
}
