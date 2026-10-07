import Image from "next/image";
import Link from "next/link";
import { SITE_NAME } from "@/lib/site";
import { cn } from "@/lib/utils";

type Props = {
  href?: string;
  /** Teks kecil di bawah nama, mis. "Admin Panel". */
  caption?: string;
  className?: string;
  /** Muat lebih awal (logo di header halaman pertama). */
  priority?: boolean;
};

/** Logo horizontal: simbol TKA + tulisan "PAKAR TKA" (aset di public/brand, sumber: logo pemilik produk). */
export function Logo({ href = "/", caption, className, priority }: Props) {
  return (
    <Link href={href} aria-label={caption ? `${SITE_NAME} — ${caption}` : `${SITE_NAME} — beranda`} className={cn("flex items-center gap-2.5 rounded-lg", className)}>
      <BrandMark className="h-7 w-auto sm:h-8" priority={priority} />
      <span className="flex flex-col gap-1">
        <Image src="/brand/pakar-tka-wordmark.png" alt="" width={900} height={106} priority={priority} className="h-3.5 w-auto sm:h-4" />
        {caption && <span className="text-xs leading-none font-medium text-muted-foreground">{caption}</span>}
      </span>
    </Link>
  );
}

/** Simbol TKA saja (mis. header ujian). Dekoratif bila berdampingan dengan teks. */
export function BrandMark({ className, priority }: { className?: string; priority?: boolean }) {
  return <Image src="/brand/pakar-tka-mark.png" alt="" width={800} height={331} priority={priority} className={className} />;
}

/** Logo lengkap bertumpuk (simbol di atas tulisan) — untuk area besar seperti footer. */
export function BrandLockup({ className }: { className?: string }) {
  return <Image src="/brand/pakar-tka-logo.png" alt={SITE_NAME} width={1200} height={663} className={className} />;
}
