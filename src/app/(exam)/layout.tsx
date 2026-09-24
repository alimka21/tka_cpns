import type { Metadata } from "next";

// Layout pengerjaan tes: tanpa navigasi situs supaya minim distraksi
// (docs/UI_UX.md §4.8). Header ujian dirender oleh ExamShell.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function ExamLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 flex-col">{children}</div>;
}
