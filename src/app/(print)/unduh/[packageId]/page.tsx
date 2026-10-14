import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PrintToolbar } from "@/components/unduh/print-toolbar";
import { RichHtml } from "@/components/tes/rich-html";
import { SITE_NAME } from "@/lib/site";
import { requireUser } from "@/server/auth/session";
import { getPackageDetail, getSubjectName, type PackageDetail } from "@/server/queries/packages";
import { hasPremium } from "@/server/services/billing";
import { renderMathToHtml, renderRichText } from "@/server/services/math-render";

// Lembar soal unduhan (khusus Premium): tampilan A4 seperti naskah soal resmi,
// tanpa sampul, tanpa kunci jawaban. "Unduh" = cetak browser → Simpan sebagai
// PDF, supaya rumus KaTeX, tabel, dan gambar tetap tajam tanpa generator PDF
// di server. Kunci (`isCorrect`) tidak pernah dirender.

export const dynamic = "force-dynamic";

async function loadPackage(idParam: string) {
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) notFound();
  return { id, pkg: await getPackageDetail(id) };
}

export async function generateMetadata({ params }: PageProps<"/unduh/[packageId]">): Promise<Metadata> {
  const { pkg } = await loadPackage((await params).packageId);
  // Judul dokumen = nama file PDF bawaan saat disimpan.
  return { title: { absolute: pkg ? `Soal ${pkg.title} - ${SITE_NAME}` : SITE_NAME } };
}

const LETTERS = "ABCDEFGHIJ";
const TYPE_NOTE = {
  pg: null,
  pgk_mcma: "Pilihlah jawaban yang benar. Jawaban benar lebih dari satu.",
  pgk_kategori: null,
} as const;

export default async function UnduhPaketPage({ params }: PageProps<"/unduh/[packageId]">) {
  const { id, pkg } = await loadPackage((await params).packageId);
  const { user } = await requireUser(`/unduh/${id}`);
  const isAdmin = user.role === "admin";
  if (!pkg || (pkg.status !== "published" && !isAdmin)) notFound();
  if (!(await hasPremium({ id: Number(user.id), role: user.role }, pkg.categoryCode))) redirect("/langganan");

  const subjectName = await getSubjectName(pkg.subjectId);
  const stimuli = new Map(pkg.stimuli.map((s) => [s.id, s]));
  const ranges = stimulusRanges(pkg);
  const hasMcma = pkg.questions.some((q) => q.type === "pgk_mcma");
  const hasKategori = pkg.questions.some((q) => q.type === "pgk_kategori");

  // Jejak pemilik di kaki setiap halaman (mencegah naskah premium disebar ulang).
  const owner = cssString(`${SITE_NAME} · Diunduh oleh ${user.name}`);
  const pageCss = `
    @page { size: A4; margin: 16mm 17mm 18mm;
      @bottom-left { content: "${owner}"; font: 7.5pt Arial, Helvetica, sans-serif; color: #777; }
      @bottom-right { content: "Halaman " counter(page) " dari " counter(pages); font: 7.5pt Arial, Helvetica, sans-serif; color: #777; }
    }
    .exam-paper { font-family: Arial, Helvetica, sans-serif; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .exam-paper .rich-text li::marker { color: inherit; }`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: pageCss }} />
      <PrintToolbar backHref={isAdmin ? `/admin/paket-tes/${id}/pratinjau` : "/dashboard"} />

      <main className="exam-paper mx-auto my-6 w-full max-w-[210mm] bg-white px-[17mm] py-[16mm] text-[10.5pt] leading-[1.55] text-black shadow-lg print:m-0 print:max-w-none print:p-0 print:shadow-none">
        {/* Kop naskah — bukan sampul, langsung diikuti soal. */}
        <header className="border-b-[2.5px] border-double border-black pb-2.5 text-center">
          <p className="text-[9pt] font-semibold tracking-[0.18em] uppercase">Latihan Tes Kemampuan Akademik (TKA)</p>
          <h1 className="mt-1 text-[14pt] leading-tight font-bold">{pkg.title}</h1>
        </header>
        <table className="mt-3 w-full text-[9.5pt]">
          <tbody>
            <tr>
              <MetaCell label="Mata Pelajaran" value={subjectName ?? "—"} />
              <MetaCell label="Jumlah Soal" value={`${pkg.questions.length} butir`} />
            </tr>
            <tr>
              <MetaCell label="Jenjang" value={pkg.categoryCode} />
              <MetaCell label="Waktu" value={`${pkg.durationMinutes} menit`} />
            </tr>
          </tbody>
        </table>
        <div className="mt-2 grid grid-cols-2 gap-x-8 text-[9.5pt]">
          <p className="flex items-end gap-2">
            <span className="shrink-0">Nama</span>
            <span className="mb-[3px] flex-1 border-b border-dotted border-black" />
          </p>
          <p className="flex items-end gap-2">
            <span className="shrink-0">Kelas / No. Peserta</span>
            <span className="mb-[3px] flex-1 border-b border-dotted border-black" />
          </p>
        </div>

        <section className="mt-4 rounded-sm border border-black px-3.5 py-2.5 text-[9pt] leading-snug" aria-label="Petunjuk umum">
          <p className="font-bold uppercase">Petunjuk Umum</p>
          <ol className="mt-1 list-decimal pl-4">
            <li>Bacalah setiap soal dengan teliti sebelum menjawab.</li>
            <li>Untuk soal pilihan ganda, pilihlah satu jawaban yang paling tepat.</li>
            {hasMcma && <li>Soal bertanda &ldquo;Jawaban benar lebih dari satu&rdquo; dijawab dengan memilih semua jawaban yang benar.</li>}
            {hasKategori && <li>Untuk soal berbentuk tabel, tentukan kategori yang sesuai pada setiap pernyataan.</li>}
            <li>Kerjakan dalam waktu {pkg.durationMinutes} menit dan periksa kembali jawaban sebelum selesai.</li>
          </ol>
        </section>

        <ol className="mt-5 flex flex-col gap-[5mm]">
          {pkg.questions.map((q, i) => {
            const range = ranges.get(i);
            const stimulus = range && q.stimulusId != null ? stimuli.get(q.stimulusId) : undefined;
            return (
              <li key={q.id} className="list-none">
                {stimulus && range && (
                  <div className="mb-[4mm] break-inside-avoid-page border-y border-black/60 py-2.5">
                    <p className="text-[9.5pt] font-semibold italic">
                      {range[0] === range[1] ? `Bacalah teks berikut untuk menjawab soal nomor ${range[0]}.` : `Bacalah teks berikut untuk menjawab soal nomor ${range[0]}–${range[1]}.`}
                    </p>
                    {stimulus.title && <p className="mt-1.5 text-center font-bold">{stimulus.title}</p>}
                    <RichHtml html={renderRichText(stimulus.content)} className="mt-1.5 text-justify" />
                    {stimulus.imageUrl && <PaperImage src={stimulus.imageUrl} alt={`Gambar ${stimulus.title}`} />}
                  </div>
                )}
                <QuestionBlock number={i + 1} q={q} />
              </li>
            );
          })}
        </ol>

        <p className="mt-[8mm] text-center text-[9pt] font-semibold tracking-[0.2em]">— SELAMAT MENGERJAKAN —</p>
      </main>
    </>
  );
}

type Question = PackageDetail["questions"][number];

function QuestionBlock({ number, q }: { number: number; q: Question }) {
  // Banyak soal sudah memuat petunjuknya sendiri — jangan diulang.
  const note = TYPE_NOTE[q.type] && !/lebih dari satu/i.test(q.questionText) ? TYPE_NOTE[q.type] : null;
  // Opsi pendek tanpa tabel/gambar → dua kolom, seperti naskah cetak resmi.
  const compact = q.type !== "pgk_kategori" && q.options.length >= 4 && q.options.every((o) => o.optionText.length <= 28 && !/[\n|<]|\$\$/.test(o.optionText));
  return (
    <div className="grid grid-cols-[7mm_1fr] break-inside-avoid-page">
      <span className="font-bold tabular-nums">{number}.</span>
      <div className="min-w-0">
        <RichHtml html={renderRichText(q.questionText)} className="text-justify" />
        {q.imageUrl && <PaperImage src={q.imageUrl} alt={`Gambar soal ${number}`} />}
        {note && <p className="mt-1.5 text-[9.5pt] italic">{note}</p>}

        {q.type === "pgk_kategori" ? (
          <CategoryTable q={q} />
        ) : (
          <ol className={compact ? "mt-1.5 grid grid-cols-2 gap-x-6 gap-y-1" : "mt-1.5 flex flex-col gap-1"}>
            {q.options.map((o, oi) => (
              <li key={o.id} className="grid grid-cols-[6.5mm_1fr] items-baseline">
                {q.type === "pgk_mcma" ? (
                  <span aria-hidden className="inline-block size-[3mm] translate-y-[0.4mm] border border-black" />
                ) : (
                  <span>{o.label || LETTERS[oi]}.</span>
                )}
                <RichHtml html={renderMathToHtml(o.optionText)} />
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

function CategoryTable({ q }: { q: Question }) {
  const [a, b] = q.categoryLabels ?? ["Benar", "Salah"];
  return (
    <table className="mt-2 w-full border-collapse text-[10pt]">
      <thead>
        <tr className="bg-neutral-100 print:bg-neutral-100">
          <th className="w-[8mm] border border-black px-1.5 py-1 font-bold">No</th>
          <th className="border border-black px-2 py-1 text-left font-bold">Pernyataan</th>
          <th className="w-[18mm] border border-black px-1.5 py-1 font-bold">{a}</th>
          <th className="w-[18mm] border border-black px-1.5 py-1 font-bold">{b}</th>
        </tr>
      </thead>
      <tbody>
        {q.options.map((o, oi) => (
          <tr key={o.id} className="break-inside-avoid">
            <td className="border border-black px-1.5 py-1 text-center align-top tabular-nums">{oi + 1}</td>
            <td className="border border-black px-2 py-1 align-top">
              <RichHtml html={renderMathToHtml(o.optionText)} />
            </td>
            <td className="border border-black" />
            <td className="border border-black" />
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <>
      <td className="w-[28mm] py-0.5 align-top">{label}</td>
      <td className="py-0.5 pr-6 align-top font-semibold">: {value}</td>
    </>
  );
}

function PaperImage({ src, alt }: { src: string; alt: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- gambar dari route /gambar (DB) atau tautan admin
    <img src={src} alt={alt} className="my-2 block h-auto max-h-[95mm] w-auto max-w-full break-inside-avoid object-contain" />
  );
}

/** Indeks soal pertama tiap grup stimulus → [nomor awal, nomor akhir] (1-based). */
function stimulusRanges(pkg: PackageDetail) {
  const ranges = new Map<number, [number, number]>();
  pkg.questions.forEach((q, i) => {
    if (q.stimulusId == null || pkg.questions[i - 1]?.stimulusId === q.stimulusId) return;
    let end = i;
    while (pkg.questions[end + 1]?.stimulusId === q.stimulusId) end++;
    ranges.set(i, [i + 1, end + 1]);
  });
  return ranges;
}

function cssString(text: string) {
  return text.replace(/[\\"]/g, "\\$&").replace(/[\n\r<>]/g, " ");
}
