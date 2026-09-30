import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { AiGenerateForm, type AiSourceQuestion } from "@/components/admin/ai-generate-form";
import { QuestionList } from "@/components/admin/question-bank";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { bankHref } from "@/lib/bank-filters";
import { renderMathToHtml } from "@/lib/math-html";
import { requireAdmin } from "@/server/auth/session";
import { getQuestionForEdit, searchQuestions } from "@/server/queries/question-bank";
import { getMaskedGeminiKey } from "@/server/services/ai-key";
import { listQuestionImages } from "@/server/services/question-images";
import { stimulusOptions, subdomainOptions } from "../form-options";

export const metadata: Metadata = { title: "Generate Soal AI" };
export const dynamic = "force-dynamic";

export default async function AdminGenerateAiPage({ searchParams }: PageProps<"/admin/soal/generate-ai">) {
  const { user } = await requireAdmin("/admin/soal/generate-ai");
  const { mode: modeParam, dari, gambar } = await searchParams;
  const mode = modeParam === "variasi" || modeParam === "gambar" || modeParam === "grup" ? modeParam : "baru";

  const sourceId = Number(dari);
  const [masked, sourceRow, images, pendingAi, stimuli] = await Promise.all([
    getMaskedGeminiKey(Number(user.id)),
    Number.isInteger(sourceId) && sourceId > 0 ? getQuestionForEdit(sourceId) : undefined,
    listQuestionImages(),
    searchQuestions({ sumber: "ai", status: "pending_review" }),
    stimulusOptions(),
  ]);
  const source: AiSourceQuestion | null = sourceRow
    ? {
        id: sourceRow.id,
        subdomainCode: sourceRow.subdomainCode,
        type: sourceRow.type,
        questionText: sourceRow.questionText,
        html: renderMathToHtml(sourceRow.questionText),
        difficulty: sourceRow.difficulty,
        cognitiveLevel: sourceRow.cognitiveLevel,
        hasImage: sourceRow.imageUrl != null,
      }
    : null;
  const imageId = Number(gambar);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Generate Soal AI"
        description="Buat draf soal dengan Gemini API milikmu sendiri — soal baru, variasi soal yang ada, beberapa soal dari satu gambar, atau soal grup berbasis bacaan. Hasilnya selalu masuk antrean review sebelum tayang."
      />

      {!masked ? (
        <div className="surface-card flex flex-col items-center gap-4 px-6 py-14 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <KeyRound className="size-7" aria-hidden />
          </span>
          <div>
            <h2 className="text-lg font-bold">Simpan API key Gemini dulu</h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Key milikmu sendiri (gratis dari Google AI Studio), disimpan terenkripsi dan hanya dipakai di server.
            </p>
          </div>
          <Button nativeButton={false} render={<Link href="/pengaturan" />}>
            <KeyRound aria-hidden /> Atur API key
          </Button>
        </div>
      ) : (
        <AiGenerateForm
          initialMode={mode}
          subdomains={subdomainOptions()}
          source={source}
          images={images.map((i) => ({ id: i.id, title: i.title }))}
          initialImageId={Number.isInteger(imageId) && images.some((i) => i.id === imageId) ? imageId : null}
          stimuli={stimuli}
        />
      )}

      <section aria-labelledby="antrian-heading" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="antrian-heading" className="text-lg font-bold">
              Antrean review soal AI ({pendingAi.total})
            </h2>
            <p className="text-sm text-muted-foreground">Periksa kunci & pembahasan, edit bila perlu, lalu Terbitkan. Soal yang salah bisa dihapus dari halaman edit.</p>
          </div>
          {pendingAi.total > pendingAi.rows.length && (
            <Link href={bankHref({ sumber: "ai", status: "pending_review" })} className="text-sm font-semibold text-primary hover:underline">
              Lihat semua
            </Link>
          )}
        </div>
        {pendingAi.rows.length === 0 ? (
          <p className="surface-card px-6 py-8 text-center text-sm text-muted-foreground">Tidak ada soal AI yang menunggu review.</p>
        ) : (
          <QuestionList questions={pendingAi.rows} />
        )}
      </section>
    </div>
  );
}
