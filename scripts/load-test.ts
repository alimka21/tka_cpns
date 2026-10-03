// Load test alur pengerjaan tes (docs/WORKFLOW.md §11).
//
// Mensimulasikan N siswa yang mengerjakan satu paket BERSAMAAN dengan urutan
// query yang sama dengan aplikasi (satu instance app = satu pool `db`, 10
// koneksi): buka halaman ujian (cek sesi + muat paket [cache] + mulai attempt) →
// autosave tiap jawaban (cek sesi + attempt & soal milik paket [1 query] + upsert) →
// submit (cek sesi + `finalizeAttempt` asli, termasuk skor & ringkasan subtopik).
//
// Akun & data uji dibuat sementara (email loadtest+<run>@example.invalid) dan
// SELALU dihapus di akhir (cascade ke sesi, attempt, jawaban, skor).
//
//   npm run loadtest -- --students=50 --package=13
//   npm run loadtest -- --students=100 --think=800 --package=13
//   npm run loadtest -- --cleanup          # hapus sisa run yang terputus
//
// Opsi: --students (50) · --package (wajib, paket tayang) · --answers (semua
// soal) · --think ms jeda antar-jawaban (1500, ±50%) · --ramp ms jeda mulai
// antar-siswa (50).

import { randomBytes } from "node:crypto";
import { and, eq, like } from "drizzle-orm";
import { db } from "@/server/db";
import { attemptAnswers, attempts, sessions, testPackageQuestions, users } from "@/server/db/schema";
import { getPackageDetail, getPackageDetailCached, type PackageQuestion } from "@/server/queries/packages";
import { finalizeAttempt } from "@/server/services/attempts";
import type { AnswerResponse } from "@/lib/validation/attempt";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? "true"];
  }),
);
const EMAIL_LIKE = "loadtest+%@example.invalid";

type Op = "buka_ujian" | "autosave" | "submit";
const timings: Record<Op, number[]> = { buka_ujian: [], autosave: [], submit: [] };
const errors = new Map<string, number>();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const jitter = (ms: number) => ms * (0.5 + Math.random());

async function timed<T>(op: Op, fn: () => Promise<T>): Promise<T | undefined> {
  const t0 = performance.now();
  try {
    const out = await fn();
    timings[op].push(performance.now() - t0);
    return out;
  } catch (e) {
    const code = (e as { code?: string }).code ?? (e as Error).message.slice(0, 60);
    errors.set(`${op}: ${code}`, (errors.get(`${op}: ${code}`) ?? 0) + 1);
    return undefined;
  }
}

/** Sama seperti Better Auth getSession: sesi per token, lalu user-nya. */
async function lookupSession(token: string) {
  const [s] = await db.select().from(sessions).where(eq(sessions.token, token));
  if (!s || s.expiresAt < new Date()) throw new Error("sesi tidak valid");
  const [u] = await db.select().from(users).where(eq(users.id, s.userId));
  if (!u || u.status !== "active") throw new Error("akun tidak aktif");
  return u;
}

function randomAnswer(q: PackageQuestion): AnswerResponse {
  const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];
  if (q.type === "pg") return { type: "pg", optionId: pick(q.options).id };
  if (q.type === "pgk_mcma") {
    const chosen = q.options.filter(() => Math.random() < 0.5);
    return { type: "pgk_mcma", optionIds: (chosen.length ? chosen : [q.options[0]]).map((o) => o.id) };
  }
  const labels = q.categoryLabels ?? ["Benar", "Salah"];
  return { type: "pgk_kategori", answers: q.options.map((o) => ({ optionId: o.id, category: pick(labels) })) };
}

async function student(token: string, packageId: number, answersPerStudent: number, think: number) {
  // 1) Buka halaman ujian: cek sesi + muat paket + lanjutkan/mulai attempt.
  const attemptId = await timed("buka_ujian", async () => {
    const u = await lookupSession(token);
    const pkg = await getPackageDetailCached(packageId);
    if (!pkg) throw new Error("paket tidak ada");
    const [existing] = await db
      .select()
      .from(attempts)
      .where(and(eq(attempts.userId, u.id), eq(attempts.testPackageId, packageId), eq(attempts.status, "in_progress")));
    if (existing) return { id: existing.id, pkg };
    const [{ id }] = await db
      .insert(attempts)
      .values({ userId: u.id, testPackageId: packageId, endsAt: new Date(Date.now() + pkg.durationMinutes * 60_000) })
      .$returningId();
    return { id, pkg };
  });
  if (!attemptId) return;
  const { id, pkg } = attemptId;

  // 2) Autosave setiap jawaban (urutan query = saveAnswerAction).
  for (const q of pkg.questions.slice(0, answersPerStudent)) {
    await sleep(jitter(think));
    await timed("autosave", async () => {
      await lookupSession(token);
      const [row] = await db
        .select({ attempt: attempts, packageQuestionId: testPackageQuestions.id })
        .from(attempts)
        .leftJoin(testPackageQuestions, and(eq(testPackageQuestions.testPackageId, attempts.testPackageId), eq(testPackageQuestions.questionId, q.id)))
        .where(eq(attempts.id, id));
      if (!row || row.attempt.status !== "in_progress") throw new Error("attempt selesai");
      if (row.packageQuestionId == null) throw new Error("soal bukan milik paket");
      const response = randomAnswer(q);
      await db
        .insert(attemptAnswers)
        .values({ attemptId: id, questionId: q.id, response, isFlagged: false })
        .onDuplicateKeyUpdate({ set: { response } });
    });
  }

  // 3) Submit: cek sesi + finalize (skor + ringkasan subtopik, transaksi).
  await timed("submit", async () => {
    await lookupSession(token);
    await finalizeAttempt(id, "submitted");
  });
}

function pct(xs: number[], p: number) {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
}

async function cleanup(pattern: string) {
  const [res] = await db.delete(users).where(like(users.email, pattern));
  return (res as { affectedRows?: number }).affectedRows ?? 0;
}

async function main() {
  if (args.cleanup) {
    console.log(`Dihapus ${await cleanup(EMAIL_LIKE)} akun loadtest sisa.`);
    return;
  }
  const n = Number(args.students ?? 50);
  const packageId = Number(args.package);
  const think = Number(args.think ?? 1500);
  const ramp = Number(args.ramp ?? 50);
  if (!packageId) throw new Error("Wajib --package=<id paket tayang>.");
  const pkg = await getPackageDetail(packageId);
  if (!pkg || pkg.status !== "published" || pkg.questions.length === 0) throw new Error(`Paket ${packageId} tidak ada / belum tayang / kosong.`);
  const answersPerStudent = Number(args.answers ?? pkg.questions.length);

  const run = randomBytes(3).toString("hex");
  const pattern = `loadtest+${run}-%@example.invalid`;
  let interrupted = false;
  process.on("SIGINT", async () => {
    if (interrupted) process.exit(1);
    interrupted = true;
    console.log("\nDihentikan — membersihkan data uji…");
    console.log(`Dihapus ${await cleanup(pattern)} akun.`);
    process.exit(130);
  });

  console.log(`Run ${run}: ${n} siswa × ${answersPerStudent} jawaban, paket #${packageId} "${pkg.title}", jeda ±${think} ms, pool 10 koneksi.`);
  try {
    // Akun + sesi sementara (di luar pengukuran).
    const tokens: string[] = [];
    for (let i = 0; i < n; i++) {
      const [{ id }] = await db
        .insert(users)
        .values({ name: `Loadtest ${i}`, email: `loadtest+${run}-${i}@example.invalid`, role: "student", jenjang: pkg.categoryCode as "SD" | "SMP" | "SMA", status: "active" })
        .$returningId();
      const token = randomBytes(24).toString("hex");
      await db.insert(sessions).values({ userId: id, token, expiresAt: new Date(Date.now() + 3_600_000) });
      tokens.push(token);
    }

    const pool = (db as unknown as { $client: { pool?: { _allConnections?: { length: number }; _connectionQueue?: { length: number } } } }).$client.pool;
    let peakQueue = 0;
    const sampler = setInterval(() => (peakQueue = Math.max(peakQueue, pool?._connectionQueue?.length ?? 0)), 50);

    const t0 = performance.now();
    await Promise.all(tokens.map(async (t, i) => {
      await sleep(i * ramp);
      await student(t, packageId, answersPerStudent, think);
    }));
    const elapsed = (performance.now() - t0) / 1000;
    clearInterval(sampler);

    console.log(`\nSelesai dalam ${elapsed.toFixed(1)} dtk · autosave ${(timings.autosave.length / elapsed).toFixed(1)}/dtk · antrean pool puncak ${peakQueue}`);
    console.table(
      (Object.keys(timings) as Op[]).map((op) => ({
        operasi: op,
        jumlah: timings[op].length,
        p50_ms: Math.round(pct(timings[op], 50)),
        p95_ms: Math.round(pct(timings[op], 95)),
        p99_ms: Math.round(pct(timings[op], 99)),
        maks_ms: Math.round(pct(timings[op], 100)),
      })),
    );
    if (errors.size) console.table([...errors].map(([e, c]) => ({ error: e, jumlah: c })));
    else console.log("Tanpa error.");
  } finally {
    console.log(`Membersihkan data uji… dihapus ${await cleanup(pattern)} akun (cascade: sesi, attempt, jawaban, skor).`);
  }
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
