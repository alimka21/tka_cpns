// Load test HTTP ke server yang berjalan (docs/WORKFLOW.md §11b) — berbeda dengan
// scripts/load-test.ts (langsung ke DB), di sini setiap langkah adalah request
// HTTP sungguhan ke Next.js: render halaman, server action autosave & submit.
//
//   npm run loadtest:http -- --mode=public --concurrency=20 --duration=30
//   npm run prod:loadtest:http -- --mode=exam --students=50 --package=13
//   npm run prod:loadtest:http -- --cleanup
//
// Mode exam: N siswa uji (loadtest-http+<run>-i@example.invalid, dibuat langsung
// di DB beserta sesinya; cookie ditandatangani dengan BETTER_AUTH_SECRET seperti
// Better Auth) → GET /dashboard → GET /tes/<paket> (mulai attempt) → autosave
// tiap jawaban (server action) → submit → GET /hasil/<id>. Data uji SELALU
// dihapus di akhir (cascade: sesi, attempt, jawaban, skor). Berhenti otomatis bila
// error > 10% atau Ctrl+C.
//
// Opsi exam: --students (20) --package (wajib) --answers (semua) --think ms (3000, ±50%)
//            --ramp ms jeda mulai antar-siswa (200) --reopen=0 (lewati cek buka-ulang setelah submit)
// Opsi public: --concurrency (10) --duration detik (20) --paths=/,/tka/sma (default daftar publik)
// Umum: --base=https://pakartka.com (default BETTER_AUTH_URL)

import { createHmac, randomBytes } from "node:crypto";
import { asc, eq, inArray, like } from "drizzle-orm";
import { db } from "@/server/db";
import { attemptAnswers, attempts, categories, questionOptions, questions, sessions, testPackageQuestions, testPackages, users } from "@/server/db/schema";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, "").split("=");
    return [k, v.length ? v.join("=") : "true"];
  }),
);
const BASE = (args.base ?? process.env.BETTER_AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
const EMAIL_LIKE = "loadtest-http+%@example.invalid";
const PUBLIC_PATHS = ["/", "/tka/sd", "/tka/smp", "/tka/sma", "/tka/sma/matematika", "/tka/smp/bahasa-indonesia", "/masuk", "/daftar"];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const jitter = (ms: number) => ms * (0.5 + Math.random());

// ---------- metrik ----------
const timings = new Map<string, number[]>();
const statuses = new Map<string, number>();
let total = 0;
let failed = 0;
let aborted = false;

function record(op: string, ms: number, outcome: string) {
  total++;
  if (outcome !== "ok") failed++;
  if (outcome === "ok") (timings.get(op) ?? timings.set(op, []).get(op)!).push(ms);
  statuses.set(`${op}: ${outcome}`, (statuses.get(`${op}: ${outcome}`) ?? 0) + 1);
  if (total >= 50 && failed / total > 0.1 && !aborted) {
    aborted = true;
    console.log(`\n⚠️  Error ${((failed / total) * 100).toFixed(0)}% — uji dihentikan agar server tidak terbebani.`);
  }
}

function pct(xs: number[], p: number) {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
}

function report(elapsedMs: number) {
  console.log(`\nTotal ${total} request dalam ${(elapsedMs / 1000).toFixed(1)} dtk (${(total / (elapsedMs / 1000)).toFixed(1)} req/dtk), gagal ${failed}.`);
  console.log("Operasi            jumlah    p50     p95     max");
  for (const [op, xs] of timings) {
    const f = (n: number) => `${(n / 1000).toFixed(2)}s`.padStart(7);
    console.log(`${op.padEnd(18)}${String(xs.length).padStart(6)} ${f(pct(xs, 50))} ${f(pct(xs, 95))} ${f(Math.max(...xs))}`);
  }
  const bad = [...statuses].filter(([k]) => !k.endsWith(": ok"));
  if (bad.length) console.log("Gagal:", Object.fromEntries(bad));
}

async function http(op: string, path: string, init: RequestInit = {}, check?: (res: Response, body: string) => string | null) {
  if (aborted) return null;
  const t0 = performance.now();
  try {
    const res = await fetch(BASE + path, { redirect: "manual", signal: AbortSignal.timeout(30_000), ...init });
    const body = await res.text();
    const ms = performance.now() - t0;
    const problem = res.status >= 400 ? `HTTP ${res.status}` : res.status >= 300 ? `redirect ${res.headers.get("location")}` : (check?.(res, body) ?? null);
    record(op, ms, problem ?? "ok");
    return problem ? null : body;
  } catch (e) {
    record(op, performance.now() - t0, (e as Error).name === "TimeoutError" ? "timeout 30s" : (e as Error).message.slice(0, 40));
    return null;
  }
}

// ---------- mode public ----------
async function runPublic() {
  const concurrency = Number(args.concurrency ?? 10);
  const duration = Number(args.duration ?? 20) * 1000;
  const paths = args.paths ? String(args.paths).split(",") : PUBLIC_PATHS;
  console.log(`Public: ${concurrency} pengunjung bersamaan selama ${duration / 1000} dtk ke ${BASE} (${paths.length} halaman).`);
  const t0 = Date.now();
  await Promise.all(
    Array.from({ length: concurrency }, async (_, w) => {
      for (let i = w; Date.now() - t0 < duration && !aborted; i++) {
        const path = paths[i % paths.length];
        await http(path === "/" ? "GET /" : `GET ${path.split("/").slice(0, 3).join("/")}…`, path);
      }
    }),
  );
  report(Date.now() - t0);
}

// ---------- mode exam ----------
function cookieFor(token: string) {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("BETTER_AUTH_SECRET belum diisi di env.");
  // Sama dengan better-call signCookieValue: `${value}.${base64(HMAC-SHA256)}`, di-URL-encode.
  const signed = encodeURIComponent(`${token}.${createHmac("sha256", secret).update(token).digest("base64")}`);
  return `${BASE.startsWith("https://") ? "__Secure-" : ""}wtp.session_token=${signed}`;
}

/** ID server action dari payload RSC halaman ujian: saveAnswer (pertama) & submitAttempt (kedua). */
function actionIds(html: string) {
  const flight = [...html.matchAll(/self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g)].map((m) => JSON.parse(`"${m[1]}"`)).join("");
  const ids = [...new Set([...flight.matchAll(/"id":"([0-9a-f]{40,})","bound"/g)].map((m) => m[1]))];
  return ids.length >= 2 ? { save: ids[0], submit: ids[1] } : null;
}

async function cleanup(pattern: string) {
  const [res] = await db.delete(users).where(like(users.email, pattern));
  return (res as { affectedRows?: number }).affectedRows ?? 0;
}

async function runExam() {
  const n = Number(args.students ?? 20);
  const packageId = Number(args.package);
  const think = Number(args.think ?? 3000);
  const ramp = Number(args.ramp ?? 200);
  if (!packageId) throw new Error("Wajib --package=<id paket tayang & gratis>.");
  const [pkg] = await db
    .select({ title: testPackages.title, status: testPackages.status, isPremium: testPackages.isPremium, jenjang: categories.code })
    .from(testPackages)
    .innerJoin(categories, eq(categories.id, testPackages.categoryId))
    .where(eq(testPackages.id, packageId));
  if (!pkg || pkg.status !== "published") throw new Error(`Paket ${packageId} tidak ada / belum tayang.`);
  if (pkg.isPremium) throw new Error(`Paket ${packageId} Premium — pakai paket gratis (akun uji tidak Premium).`);
  const qs = await db
    .select({ id: questions.id, type: questions.type, labels: questions.categoryLabels })
    .from(testPackageQuestions)
    .innerJoin(questions, eq(questions.id, testPackageQuestions.questionId))
    .where(eq(testPackageQuestions.testPackageId, packageId))
    .orderBy(asc(testPackageQuestions.order));
  const opts = qs.length
    ? await db.select({ id: questionOptions.id, questionId: questionOptions.questionId }).from(questionOptions).where(inArray(questionOptions.questionId, qs.map((q) => q.id)))
    : [];
  // Jawaban sesuai bentuk soal (isi jawabannya tidak penting, bentuknya harus valid).
  const responseFor = (q: (typeof qs)[number]) => {
    const ids = opts.filter((o) => o.questionId === q.id).map((o) => o.id);
    if (!ids.length) return null;
    if (q.type === "pgk_mcma") return { type: "pgk_mcma", optionIds: ids.slice(0, 2) };
    if (q.type === "pgk_kategori") return { type: "pgk_kategori", answers: ids.map((optionId) => ({ optionId, category: q.labels?.[0] ?? "Benar" })) };
    return { type: "pg", optionId: ids[0] };
  };
  const answers = qs.slice(0, Number(args.answers ?? qs.length));

  const run = randomBytes(3).toString("hex");
  const pattern = `loadtest-http+${run}-%@example.invalid`;
  process.on("SIGINT", async () => {
    console.log("\nDihentikan — membersihkan data uji…");
    console.log(`Dihapus ${await cleanup(pattern)} akun.`);
    process.exit(130);
  });

  console.log(`Run ${run}: ${n} siswa × ${answers.length} jawaban, paket #${packageId} "${pkg.title}", jeda ±${think} ms, ke ${BASE}.`);
  const t0 = Date.now();
  try {
    const tokens: { userId: number; token: string }[] = [];
    for (let i = 0; i < n; i++) {
      const [{ id }] = await db
        .insert(users)
        .values({ name: `Loadtest ${i}`, email: `loadtest-http+${run}-${i}@example.invalid`, role: "student", jenjang: pkg.jenjang as "SD" | "SMP" | "SMA", status: "active", emailVerified: true })
        .$returningId();
      const token = randomBytes(24).toString("hex");
      await db.insert(sessions).values({ userId: id, token, expiresAt: new Date(Date.now() + 3_600_000) });
      tokens.push({ userId: id, token });
    }

    let ids: { save: string; submit: string } | null = null;
    const started = Date.now();
    await Promise.all(
      tokens.map(async ({ userId, token }, i) => {
        await sleep(i * ramp);
        const headers = { cookie: cookieFor(token) };
        await http("GET /dashboard", "/dashboard", { headers });
        const html = await http("GET /tes (mulai)", `/tes/${packageId}`, { headers }, (_r, b) => (b.includes("Tidak bisa memulai tes") ? "gagal mulai" : null));
        if (!html) return;
        ids ??= actionIds(html);
        const [att] = await db.select({ id: attempts.id }).from(attempts).where(eq(attempts.userId, userId));
        if (!ids || !att) return record("persiapan", 0, ids ? "attempt tidak ada" : "ID action tidak ditemukan");
        const post = (actionId: string, payload: unknown[]) => ({
          method: "POST",
          headers: { ...headers, "next-action": actionId, "content-type": "text/plain;charset=UTF-8", accept: "text/x-component" },
          body: JSON.stringify(payload),
        });
        for (const q of answers) {
          await sleep(jitter(think));
          await http("POST autosave", `/tes/${packageId}`, post(ids.save, [att.id, { questionId: q.id, response: responseFor(q), isFlagged: false }]), (_r, b) =>
            /"ok":true/.test(b) ? null : `respons: ${b.slice(-80)}`,
          );
        }
        await sleep(jitter(think));
        await http("POST submit", `/tes/${packageId}`, post(ids.submit, [att.id]), (_r, b) => (/"ok":true/.test(b) ? null : `respons: ${b.slice(-80)}`));
        await http("GET /hasil", `/hasil/${att.id}`, { headers });
        // Membuka ujian lagi tepat setelah submit harus diarahkan ke hasil, bukan membuat attempt kosong.
        if (!aborted && args.reopen !== "0") {
          const t = performance.now();
          const res = await fetch(`${BASE}/tes/${packageId}`, { headers, redirect: "manual" }).catch(() => null);
          await res?.text();
          const ok = res && res.status >= 300 && res.status < 400 && res.headers.get("location")?.includes(`/hasil/${att.id}`);
          record("GET /tes lagi", performance.now() - t, ok ? "ok" : `tidak diarahkan ke hasil (HTTP ${res?.status})`);
        }
      }),
    );
    report(Date.now() - started);
    // Bukti dari DB bahwa request benar-benar diproses server (bukan sekadar HTTP 200).
    const userIds = tokens.map((t) => t.userId);
    const rows = await db.select({ id: attempts.id, status: attempts.status }).from(attempts).where(inArray(attempts.userId, userIds));
    const saved = rows.length ? await db.select({ n: attemptAnswers.attemptId }).from(attemptAnswers).where(inArray(attemptAnswers.attemptId, rows.map((r) => r.id))) : [];
    console.log(`Verifikasi DB: ${rows.length}/${n} attempt dibuat, ${rows.filter((r) => r.status === "submitted").length} ter-submit, ${saved.length}/${n * answers.length} jawaban tersimpan.`);
  } finally {
    console.log(`Membersihkan data uji… dihapus ${await cleanup(pattern)} akun (cascade: sesi, attempt, jawaban, skor). Total ${((Date.now() - t0) / 1000).toFixed(0)} dtk.`);
  }
}

async function main() {
  if (args.cleanup) console.log(`Dihapus ${await cleanup(EMAIL_LIKE)} akun loadtest-http sisa.`);
  else if (args.mode === "public") await runPublic();
  else await runExam();
  process.exit(0);
}

main().catch((e) => {
  console.error("✗", e instanceof Error ? e.message : e);
  process.exit(1);
});
