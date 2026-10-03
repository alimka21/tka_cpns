// Kartu pembahasan satu soal: jawaban siswa vs kunci + pembahasan.
// Server component (tanpa state) — dipakai pembahasan attempt & hasil demo.

import { Check, Minus, Sparkles, X } from "lucide-react";
import { RichHtml } from "@/components/tes/rich-html";
import { QuestionImage } from "@/components/tes/question-image";
import { Badge } from "@/components/ui/badge";
import { QUESTION_TYPE_META } from "@/lib/question-forms";
import { reviewStatus, type ReviewItem, type ReviewOption } from "@/lib/review";
import { cn } from "@/lib/utils";

/** `footer`: mis. tombol Laporkan soal (client component dari halaman). */
/** `keyOnly`: tampilan admin — hanya soal & kunci, tanpa nomor/status jawaban siswa. */
/** `heading`: judul kartu pengganti (mis. "Soal 5" di pratinjau paket admin). */
export function ReviewCard({
  item,
  footer,
  keyOnly = false,
  heading,
}: {
  item: ReviewItem;
  footer?: React.ReactNode;
  keyOnly?: boolean;
  heading?: string;
}) {
  const status = reviewStatus(item);
  const badge =
    status === "benar"
      ? { variant: "success" as const, icon: Check, label: "Benar" }
      : status === "salah"
        ? { variant: "danger" as const, icon: X, label: item.completeness === "partial" ? "Belum lengkap" : "Salah" }
        : { variant: "muted" as const, icon: Minus, label: "Tidak dijawab" };
  const Icon = badge.icon;

  return (
    <article aria-labelledby={`soal-${item.questionId}`} className="surface-card flex flex-col gap-5 p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id={`soal-${item.questionId}`} className="text-base font-bold">
          {heading ?? (keyOnly ? "Soal & kunci" : `Soal ${item.number}`)}
        </h2>
        {!keyOnly && (
          <Badge variant={badge.variant}>
            <Icon aria-hidden /> {badge.label}
          </Badge>
        )}
        <Badge variant="outline">{QUESTION_TYPE_META[item.type].short}</Badge>
        {item.aiPracticeId != null && (
          <Badge variant="info" title="Soal dibuat AI khusus untukmu — tidak direview admin, tidak dihitung ke tes resmi">
            <Sparkles aria-hidden /> Latihan AI
          </Badge>
        )}
        {item.subtopic && <span className="text-xs text-muted-foreground">{item.subtopic}</span>}
      </div>

      <div className="leading-relaxed">
        <RichHtml html={item.html} />
        {item.imageUrl && <QuestionImage src={item.imageUrl} alt={`Gambar soal ${item.number}`} className="mt-4" />}
      </div>

      {item.type === "pgk_kategori" ? <CategoryTable item={item} /> : <OptionList options={item.options} />}

      <div className="rounded-lg bg-primary-soft p-4">
        <h3 className="text-sm font-semibold text-primary">Pembahasan</h3>
        {item.explanationHtml ? (
          <div className="mt-2 text-sm leading-relaxed">
            <RichHtml html={item.explanationHtml} />
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Pembahasan untuk soal ini belum tersedia.</p>
        )}
      </div>
      {footer}
    </article>
  );
}

// Status tidak hanya lewat warna: setiap baris diberi teks "Kunci" / "Jawabanmu".
function OptionList({ options }: { options: ReviewOption[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {options.map((o) => {
        const wrongPick = o.chosen && !o.isKey;
        return (
          <li
            key={o.id}
            className={cn(
              "flex items-start gap-3 rounded-lg border p-3",
              o.isKey && "border-success/50 bg-success-soft",
              wrongPick && "border-destructive/40 bg-destructive-soft",
            )}
          >
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
                o.isKey && "border-success bg-success text-white",
                wrongPick && "border-destructive bg-destructive text-white",
              )}
            >
              {o.label}
            </span>
            <div className="flex flex-1 flex-col gap-1 pt-0.5">
              <RichHtml html={o.html} />
              {(o.isKey || o.chosen) && (
                <span className="flex flex-wrap gap-1.5">
                  {o.isKey && <Badge variant="success"><Check aria-hidden /> Kunci</Badge>}
                  {o.chosen && <Badge variant={o.isKey ? "success" : "danger"}>Jawabanmu</Badge>}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function CategoryTable({ item }: { item: ReviewItem }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/60 text-left">
          <tr>
            <th scope="col" className="p-3 font-semibold">Pernyataan</th>
            <th scope="col" className="p-3 font-semibold whitespace-nowrap">Jawabanmu</th>
            <th scope="col" className="p-3 font-semibold whitespace-nowrap">Kunci</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {item.options.map((o) => {
            const ok = o.chosenCategory != null && o.chosenCategory === o.keyCategory;
            return (
              <tr key={o.id}>
                <td className="p-3">
                  <RichHtml html={o.html} />
                </td>
                <td className="p-3 whitespace-nowrap">
                  {o.chosenCategory ? (
                    <Badge variant={ok ? "success" : "danger"}>
                      {ok ? <Check aria-hidden /> : <X aria-hidden />} {o.chosenCategory}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="p-3 font-semibold whitespace-nowrap">{o.keyCategory ?? "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
