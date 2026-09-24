import katex from "katex";
import { cn } from "@/lib/utils";

// Pisahkan teks biasa dan rumus: $$...$$ (blok) atau $...$ (inline).
const MATH_PATTERN = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;

export function MathText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(MATH_PATTERN);
  return (
    <span className={cn("whitespace-pre-wrap", className)}>
      {parts.map((part, i) => {
        if (i % 2 === 0) return part;
        const displayMode = part.startsWith("$$");
        const tex = part.slice(displayMode ? 2 : 1, displayMode ? -2 : -1);
        const html = katex.renderToString(tex, { displayMode, throwOnError: false, trust: false });
        return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
      })}
    </span>
  );
}
