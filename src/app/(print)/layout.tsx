import type { Metadata } from "next";

// Layout lembar cetak/unduh: tanpa navigasi situs, latar kertas.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 flex-col bg-neutral-200 print:bg-white">{children}</div>;
}
