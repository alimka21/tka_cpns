import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";

/**
 * Tampilkan HTML hasil `renderMathToHtml` (server). Aman dipakai di client
 * component — tidak membawa library KaTeX, hanya CSS-nya.
 */
export function RichHtml({ html, className }: { html: string; className?: string }) {
  return <span className={cn("whitespace-pre-wrap", className)} dangerouslySetInnerHTML={{ __html: html }} />;
}
