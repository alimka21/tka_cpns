import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { SITE_NAME } from "@/lib/site";
import { cn } from "@/lib/utils";

type Props = {
  href?: string;
  /** Teks kecil di bawah nama, mis. "Admin Panel". */
  caption?: string;
  className?: string;
};

export function Logo({ href = "/", caption, className }: Props) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5 rounded-lg", className)}>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <GraduationCap className="size-5" aria-hidden />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-base font-bold tracking-tight text-primary">{SITE_NAME}</span>
        {caption && <span className="text-xs font-medium text-muted-foreground">{caption}</span>}
      </span>
    </Link>
  );
}
