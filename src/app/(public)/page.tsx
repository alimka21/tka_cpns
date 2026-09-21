import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const fitur = [
  {
    judul: "Analisis Per Subtopik",
    deskripsi:
      "Bukan cuma skor akhir — lihat subtopik mana yang paling lemah (mis. Aritmatika, Silogisme) supaya belajar lebih terarah.",
  },
  {
    judul: "Bank Soal Terorganisir",
    deskripsi:
      "Soal tersusun rapi per Kategori → Topik → Subtopik, lengkap dengan rumus (KaTeX) dan pembahasan.",
  },
  {
    judul: "Simulasi Tes CPNS (SKD)",
    deskripsi:
      "Mode skor TWK/TIU dan TKP mengikuti aturan resmi, dengan timer server-side yang tidak bisa dicurangi.",
  },
  {
    judul: "Generate Soal via AI",
    deskripsi:
      "Admin bisa membuat draf soal baru dengan Gemini API — pakai API key milik sendiri, hasilnya tetap direview manual sebelum tayang.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold">Web Tes Premium</span>
          <nav className="flex items-center gap-3">
            <Button
              variant="ghost"
              nativeButton={false}
              render={<Link href="/dashboard">Masuk</Link>}
            />
            <Button nativeButton={false} render={<Link href="/dashboard">Mulai Sekarang</Link>} />
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-6 py-24 text-center">
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
            Latihan Tes Akademik & CPNS, dengan Analisis Kelemahan yang Jelas
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Kerjakan paket tes, dan langsung tahu subtopik mana yang perlu
            diperkuat — bukan cuma angka skor di akhir.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              nativeButton={false}
              render={<Link href="/dashboard">Mulai Sekarang</Link>}
            />
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={<Link href="#fitur">Lihat Fitur</Link>}
            />
          </div>
        </section>

        <section id="fitur" className="border-t bg-muted/30">
          <div className="mx-auto grid w-full max-w-5xl gap-6 px-6 py-20 sm:grid-cols-2">
            {fitur.map((item) => (
              <Card key={item.judul}>
                <CardHeader>
                  <CardTitle>{item.judul}</CardTitle>
                  <CardDescription>{item.deskripsi}</CardDescription>
                </CardHeader>
                <CardContent />
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto w-full max-w-5xl px-6 text-sm text-muted-foreground">
          © {new Date().getFullYear()} Web Tes Premium.
        </div>
      </footer>
    </div>
  );
}
