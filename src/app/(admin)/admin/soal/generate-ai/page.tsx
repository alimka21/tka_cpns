import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Generate Soal AI" };

export default function AdminGenerateAiPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Generate Soal AI"
        description="Buat draf soal dengan Gemini API milikmu sendiri. Hasilnya selalu masuk antrean review sebelum tayang."
      />
      <div className="surface-card flex flex-col items-center gap-4 px-6 py-16 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
          <Sparkles className="size-7" aria-hidden />
        </span>
        <div>
          <h2 className="text-lg font-bold">Hadir di Fase 2</h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Siapkan dulu API key Gemini di halaman Pengaturan. Key disimpan terenkripsi dan hanya dipakai di server.
          </p>
        </div>
        <Button variant="outline" nativeButton={false} render={<Link href="/pengaturan" />}>
          <KeyRound aria-hidden /> Atur API key
        </Button>
      </div>
    </div>
  );
}
