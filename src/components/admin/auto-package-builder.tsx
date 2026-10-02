"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleAlert, CircleCheck, LoaderCircle, Sparkles, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QUESTION_TYPE_META } from "@/lib/question-forms";
import { createAutoPackageAction, previewAutoPackageAction, runAutoPackageBatchAction } from "@/server/actions/auto-package";
import type { AutoPackagePreview } from "@/server/services/auto-package";

export type AutoJenjangOption = { id: number; code: string; name: string; subjects: { id: number; name: string }[] };

type Preview = Extract<AutoPackagePreview, { ok: true }>;
type BatchState = { status: "waiting" | "running" | "done" | "failed"; ids: number[]; error?: string };

const PARALLEL = 3;

const selectClass =
  "h-10 w-full min-w-0 rounded-lg border border-input bg-card px-3 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15 focus-visible:outline-none disabled:opacity-50";

/** Pratinjau rencana → jalankan batch AI satu per satu → simpan paket draf. */
export function AutoPackageBuilder({ options, initialCategoryId }: { options: AutoJenjangOption[]; initialCategoryId?: number }) {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState(initialCategoryId ?? 0);
  const [subjectId, setSubjectId] = useState(0);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [title, setTitle] = useState("");
  const [batches, setBatches] = useState<BatchState[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, startLoading] = useTransition();
  const jenjang = options.find((j) => j.id === categoryId);

  // Cegah halaman ditutup saat AI berjalan (batch yang sudah jadi tetap tersimpan di bank).
  useEffect(() => {
    if (!running) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [running]);

  const loadPreview = (cat = categoryId, sub = subjectId) => {
    setError(null);
    startLoading(async () => {
      const r = await previewAutoPackageAction({ categoryId: cat, subjectId: sub });
      if (!r.ok) {
        setPreview(null);
        return setError(r.error);
      }
      setPreview(r);
      setBatches(r.batches.map(() => ({ status: "waiting", ids: [] })));
      const d = new Date();
      setTitle(`${r.subjectName} ${r.jenjang} — Paket Otomatis ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`);
    });
  };

  const aiIds = batches.flatMap((b) => b.ids);
  const failed = batches.filter((b) => b.status === "failed").length;
  const pendingAi = batches.some((b) => b.status === "waiting" || b.status === "failed");
  const total = (preview?.bankIds.length ?? 0) + aiIds.length;

  async function createPackage(ids: number[]) {
    if (!preview) return;
    const r = await createAutoPackageAction({ categoryId, subjectId, title, bankIds: preview.bankIds, aiIds: ids });
    if (!r.ok) return setError(r.errors.join(" "));
    router.push(`/admin/paket-tes/${r.id}`);
  }

  async function run(onlyFailed: boolean) {
    if (!preview) return;
    setError(null);
    setRunning(true);
    const state = [...batches];
    const queue = preview.batches
      .map((_, i) => i)
      .filter((i) => state[i].status !== "done" && (!onlyFailed || state[i].status === "failed"));
    // Beberapa batch sekaligus (tiap batch ±30–60 detik), tetap di bawah batas rate Gemini.
    const worker = async () => {
      for (let i = queue.shift(); i !== undefined; i = queue.shift()) {
        state[i] = { status: "running", ids: [] };
        setBatches([...state]);
        const b = preview.batches[i];
        const r = await runAutoPackageBatchAction({ subtopicCode: b.subtopicCode, type: b.type, count: b.count, sourceQuestionId: b.sourceQuestionId }).catch(
          () => ({ ok: false as const, error: "Koneksi terputus." }),
        );
        state[i] = r.ok
          ? { status: "done", ids: r.ids, error: r.ids.length < b.count ? `${r.ids.length} dari ${b.count} soal lolos validasi.` : undefined }
          : { status: "failed", ids: [], error: r.error };
        setBatches([...state]);
      }
    };
    await Promise.all(Array.from({ length: PARALLEL }, worker));
    setRunning(false);
    if (state.every((s) => s.status === "done")) await createPackage(state.flatMap((s) => s.ids));
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="surface-card flex flex-col gap-4 p-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="auto-jenjang">Jenjang</Label>
            <select
              id="auto-jenjang"
              className={selectClass}
              value={categoryId || ""}
              disabled={running}
              onChange={(e) => {
                setCategoryId(Number(e.target.value));
                setSubjectId(0);
                setPreview(null);
              }}
            >
              <option value="">Pilih jenjang</option>
              {options.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="auto-subject">Mata pelajaran</Label>
            <select
              id="auto-subject"
              className={selectClass}
              value={subjectId || ""}
              disabled={!jenjang || running}
              onChange={(e) => {
                const id = Number(e.target.value);
                setSubjectId(id);
                setPreview(null);
                if (id) loadPreview(categoryId, id);
              }}
            >
              <option value="">{jenjang ? "Pilih mata pelajaran" : "Pilih jenjang dulu"}</option>
              {jenjang?.subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Sistem mengambil soal bank yang <strong>belum masuk paket mana pun</strong> (tayang atau menunggu tinjauan),
          memilihnya agar aturan paket terpenuhi, lalu menghitung kekurangan per subtopik &amp; bentuk soal untuk dibuat AI
          — memodifikasi soal bank di subtopik yang sama, atau soal baru bila subtopik belum punya soal.
        </p>
        {loading && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" aria-hidden /> Menyusun rencana…
          </p>
        )}
        {error && (
          <p role="alert" className="flex items-start gap-2 text-sm font-medium text-destructive">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden /> {error}
          </p>
        )}
      </section>

      {preview && (
        <section className="surface-card flex flex-col gap-5 p-6">
          <div>
            <h2 className="text-lg font-bold">Rencana paket</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {preview.subjectName} {preview.jenjang} · {preview.questionCount} soal · {preview.durationMinutes} menit
            </p>
          </div>

          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border p-4">
              <dt className="text-xs text-muted-foreground">Dari bank soal</dt>
              <dd className="text-2xl font-bold">{preview.bankIds.length}</dd>
              <dd className="text-xs text-muted-foreground">
                {preview.bankPg} PG · tersedia {preview.availableCount} soal belum terpakai
              </dd>
            </div>
            <div className="rounded-xl border p-4">
              <dt className="text-xs text-muted-foreground">Dibuat AI</dt>
              <dd className="text-2xl font-bold">{preview.questionCount - preview.bankIds.length}</dd>
              <dd className="text-xs text-muted-foreground">{preview.batches.length} panggilan Gemini</dd>
            </div>
            <div className="rounded-xl border p-4">
              <dt className="text-xs text-muted-foreground">Total</dt>
              <dd className="text-2xl font-bold">{preview.questionCount}</dd>
              <dd className="text-xs text-muted-foreground">disimpan sebagai paket draf</dd>
            </div>
          </dl>

          {preview.batches.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold">Kekurangan yang dibuat AI</h3>
              <ul className="flex flex-col divide-y rounded-xl border">
                {preview.batches.map((b, i) => {
                  const s = batches[i];
                  return (
                    <li key={i} className="flex flex-col gap-1 p-3 text-sm sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                      <div className="min-w-0">
                        <div className="font-semibold">
                          {b.count}× {QUESTION_TYPE_META[b.type].short} — {b.subtopicName}
                        </div>
                        <div className="text-xs text-muted-foreground">{b.topicName}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {b.sourceQuestionId ? (
                            <>
                              Variasi dari soal{" "}
                              <Link href={`/admin/soal/${b.sourceQuestionId}`} target="_blank" className="font-semibold text-primary hover:underline">
                                #{b.sourceQuestionId}
                              </Link>
                              : <span className="italic">{b.sourceSnippet}…</span>
                            </>
                          ) : (
                            "Soal baru (subtopik belum punya soal tunggal tanpa gambar untuk dimodifikasi)"
                          )}
                        </div>
                        {s?.error && <div className={`mt-1 text-xs ${s.status === "failed" ? "text-destructive" : "text-muted-foreground"}`}>{s.error}</div>}
                      </div>
                      <div className="shrink-0">
                        {s?.status === "running" ? (
                          <Badge variant="info">
                            <LoaderCircle className="size-3 animate-spin" aria-hidden /> Berjalan
                          </Badge>
                        ) : s?.status === "done" ? (
                          <Badge variant="success">{s.ids.length} soal</Badge>
                        ) : s?.status === "failed" ? (
                          <Badge variant="warning">Gagal</Badge>
                        ) : (
                          <Badge variant="muted">Menunggu</Badge>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
              {!preview.hasGeminiKey && (
                <p className="flex items-start gap-2 text-sm text-warning-strong">
                  <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span>
                    Simpan API key Gemini dulu di{" "}
                    <Link href="/admin/profil" className="font-semibold underline">
                      Profil &amp; API Key
                    </Link>
                    . Tanpa key, paket hanya bisa dibuat dari soal bank yang ada.
                  </span>
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="auto-title">Judul paket</Label>
            <Input id="auto-title" value={title} maxLength={255} disabled={running} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <p className="text-xs text-muted-foreground">
            Soal buatan AI berstatus <strong>menunggu tinjauan</strong>. Paket disimpan sebagai <strong>draf</strong> — tinjau
            soalnya, lalu terbitkan dari daftar Paket Tes.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            {preview.batches.length === 0 ? (
              <Button disabled={running || title.trim().length < 3} onClick={() => run(false)}>
                <Wand2 aria-hidden /> Buat paket
              </Button>
            ) : !pendingAi && !running ? (
              <Button disabled={title.trim().length < 3} onClick={() => createPackage(aiIds)}>
                <Wand2 aria-hidden /> Simpan paket ({total} soal)
              </Button>
            ) : failed > 0 && !running ? (
              <>
                <Button disabled={!preview.hasGeminiKey} onClick={() => run(true)}>
                  <Sparkles aria-hidden /> Coba lagi yang gagal ({failed})
                </Button>
                <Button variant="outline" disabled={title.trim().length < 3 || total === 0} onClick={() => createPackage(aiIds)}>
                  Buat paket dengan {total} soal yang ada
                </Button>
              </>
            ) : (
              <>
                <Button disabled={running || !preview.hasGeminiKey || title.trim().length < 3 || !pendingAi} onClick={() => run(false)}>
                  {running ? <LoaderCircle className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />}
                  {running ? "AI sedang membuat soal…" : "Jalankan AI & buat paket"}
                </Button>
                {!preview.hasGeminiKey && preview.bankIds.length > 0 && (
                  <Button variant="outline" disabled={title.trim().length < 3} onClick={() => createPackage([])}>
                    Buat paket dari {preview.bankIds.length} soal bank saja
                  </Button>
                )}
              </>
            )}
            <Button variant="ghost" disabled={running || loading} onClick={() => loadPreview()}>
              Susun ulang rencana
            </Button>
          </div>
          {running && (
            <p role="status" className="flex items-center gap-2 text-xs text-muted-foreground">
              <CircleCheck className="size-3.5" aria-hidden /> Tiap batch butuh ±30–60 detik (3 berjalan bersamaan). Jangan tutup halaman ini.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
