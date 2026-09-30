import type { Metadata } from "next";
import { ImageCard, ImageUploader } from "@/components/admin/image-gallery";
import { PageHeader } from "@/components/layout/page-header";
import { listQuestionImages } from "@/server/services/question-images";

export const metadata: Metadata = { title: "Gambar Soal" };
export const dynamic = "force-dynamic";

export default async function AdminGambarSoalPage() {
  const images = await listQuestionImages();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Gambar Soal"
        description="Unggah gambar (grafik, tabel, peta, diagram, ilustrasi) lalu jadikan soal bergambar — manual lewat form soal, atau biarkan AI membuat beberapa soal sekaligus dari satu gambar."
      />
      <ImageUploader />
      <section aria-labelledby="galeri-heading" className="flex flex-col gap-3">
        <h2 id="galeri-heading" className="font-bold">
          Galeri ({images.length})
        </h2>
        {images.length === 0 ? (
          <p className="surface-card px-6 py-10 text-center text-sm text-muted-foreground">Belum ada gambar.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {images.map((img) => (
              <ImageCard key={img.id} image={img} />
            ))}
          </ul>
        )}
        <p className="text-xs text-muted-foreground">
          Tips: beri judul yang menjelaskan isi gambar (mis. &ldquo;Grafik penjualan buah 5 bulan&rdquo;) — judul ikut dikirim ke AI
          sebagai petunjuk.
        </p>
      </section>
    </div>
  );
}
