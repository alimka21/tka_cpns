"use server";

// Mutasi Paket Tes & Entitlement (admin). Setiap action cek sesi admin dan
// memvalidasi ulang input dengan Zod — jangan percaya susunan soal dari
// client begitu saja (dicek lagi lewat validatePackageOrder terhadap bank
// soal published di server).

import { revalidatePath } from "next/cache";
import { invalidatePackageCache } from "@/server/queries/packages";
import { and, eq, inArray } from "drizzle-orm";
import { getAdminSession } from "@/server/auth/session";
import { db } from "@/server/db";
import { entitlements, questions, testPackageQuestions, testPackages } from "@/server/db/schema";
import { searchUsers as searchUsersQuery } from "@/server/queries/packages";
import { validatePackageOrder, type ComposableQuestion } from "@/server/services/package-composition";
import { ruleErrors } from "@/lib/package-rules";
import { testPackageInput } from "@/lib/validation/test-package";
import { packageRuleReport } from "@/server/services/package-rules-check";

export type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; errors: string[] };

const NOT_ADMIN: ActionResult<never> = { ok: false, errors: ["Sesi admin berakhir. Silakan masuk lagi."] };

function isFkError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "ER_ROW_IS_REFERENCED_2";
}

async function publishedBank(): Promise<ComposableQuestion[]> {
  return db
    .select({ id: questions.id, stimulusId: questions.stimulusId, stimulusOrder: questions.stimulusOrder })
    .from(questions)
    .where(eq(questions.status, "published"));
}

/**
 * Bank untuk cek susunan paket: soal tayang + soal paket itu sendiri (status
 * apa pun), supaya soal yang belum tayang dilaporkan sebagai "belum tayang",
 * bukan "tidak ditemukan". Id yang benar-benar tidak ada tetap tidak muncul.
 */
async function compositionBank(questionIds: number[]) {
  const [published, own] = await Promise.all([
    publishedBank(),
    questionIds.length
      ? db
          .select({ id: questions.id, stimulusId: questions.stimulusId, stimulusOrder: questions.stimulusOrder, status: questions.status })
          .from(questions)
          .where(inArray(questions.id, questionIds))
      : Promise.resolve([]),
  ]);
  const bank = new Map<number, ComposableQuestion>(published.map((q) => [q.id, q]));
  for (const q of own) bank.set(q.id, { id: q.id, stimulusId: q.stimulusId, stimulusOrder: q.stimulusOrder });
  return { bank: [...bank.values()], unpublishedIds: own.filter((q) => q.status !== "published").map((q) => q.id) };
}

/** Simpan paket baru (id kosong) atau perbarui yang ada. */
export async function savePackageAction(input: unknown & { id?: number }): Promise<ActionResult<{ id: number }>> {
  const session = await getAdminSession();
  if (!session) return NOT_ADMIN;

  const parsed = testPackageInput.safeParse(input);
  if (!parsed.success) return { ok: false, errors: [...new Set(parsed.error.issues.map((i) => i.message))] };
  const p = parsed.data;
  const id = typeof (input as { id?: unknown }).id === "number" ? (input as { id: number }).id : undefined;

  if (p.status === "published" && p.questions.length > 0) {
    const ids = p.questions.map((q) => q.questionId);
    const { bank, unpublishedIds } = await compositionBank(ids);
    const orderErrors = validatePackageOrder(ids, bank);
    if (orderErrors.length > 0) return { ok: false, errors: orderErrors };
    if (unpublishedIds.length > 0) {
      return {
        ok: false,
        errors: [
          `${unpublishedIds.length} soal belum tayang (draf / menunggu tinjauan). Simpan sebagai draf, lalu pakai tombol "Terbitkan" di daftar Paket Tes untuk menerbitkan paket beserta soalnya.`,
        ],
      };
    }
  }
  if (p.status === "published") {
    // Aturan resmi paket (jumlah soal, durasi, rasio PG, mapel) — wajib lolos.
    const report = await packageRuleReport({
      categoryId: p.categoryId,
      subjectId: p.subjectId,
      durationMinutes: p.durationMinutes,
      questionIds: p.questions.map((q) => q.questionId),
    });
    if (!report.publishable) return { ok: false, errors: ruleErrors(report) };
  }

  const savedId = await db.transaction(async (tx) => {
    let packageId = id;
    if (packageId) {
      await tx
        .update(testPackages)
        .set({
          title: p.title,
          description: p.description ?? null,
          categoryId: p.categoryId,
          subjectId: p.subjectId ?? null,
          durationMinutes: p.durationMinutes,
          isPremium: p.isPremium,
          status: p.status,
        })
        .where(eq(testPackages.id, packageId));
      await tx.delete(testPackageQuestions).where(eq(testPackageQuestions.testPackageId, packageId));
    } else {
      const [row] = await tx
        .insert(testPackages)
        .values({
          title: p.title,
          description: p.description ?? null,
          categoryId: p.categoryId,
          subjectId: p.subjectId ?? null,
          durationMinutes: p.durationMinutes,
          isPremium: p.isPremium,
          status: p.status,
          createdBy: Number(session.user.id),
        })
        .$returningId();
      packageId = row.id;
    }
    if (p.questions.length > 0) {
      await tx.insert(testPackageQuestions).values(
        p.questions.map((q) => ({
          testPackageId: packageId!,
          questionId: q.questionId,
          order: q.order,
          pointsOverride: q.pointsOverride,
        })),
      );
    }
    return packageId!;
  });

  invalidatePackageCache();
  revalidatePath("/admin/paket-tes");
  revalidatePath(`/admin/paket-tes/${savedId}`);
  return { ok: true, id: savedId };
}

export type PackageStatusResult = { ok: true } | { ok: false; errors: string[]; /** Soal paket yang belum tayang — client bisa menawarkan terbit sekaligus. */ unpublishedCount?: number };

/**
 * Ubah status paket. Terbit: susunan & aturan paket dicek dulu. Soal yang belum
 * tayang ditolak, kecuali `publishQuestions` — maka soal-soal itu ikut
 * diterbitkan dalam transaksi yang sama dengan paketnya.
 */
export async function updatePackageStatusAction(input: {
  id: number;
  status: "draft" | "published";
  publishQuestions?: boolean;
}): Promise<PackageStatusResult> {
  if (!(await getAdminSession())) return NOT_ADMIN;
  let toPublish: number[] = [];
  if (input.status === "published") {
    const rows = await db
      .select({ questionId: testPackageQuestions.questionId })
      .from(testPackageQuestions)
      .where(eq(testPackageQuestions.testPackageId, input.id))
      .orderBy(testPackageQuestions.order);
    if (rows.length === 0) return { ok: false, errors: ["Paket belum berisi soal — tidak bisa diterbitkan."] };
    const ids = rows.map((r) => r.questionId);
    const { bank, unpublishedIds } = await compositionBank(ids);
    const orderErrors = validatePackageOrder(ids, bank);
    if (orderErrors.length > 0) return { ok: false, errors: orderErrors };
    const [pkg] = await db
      .select({ categoryId: testPackages.categoryId, subjectId: testPackages.subjectId, durationMinutes: testPackages.durationMinutes })
      .from(testPackages)
      .where(eq(testPackages.id, input.id));
    if (!pkg) return { ok: false, errors: ["Paket tidak ditemukan."] };
    const report = await packageRuleReport({ ...pkg, questionIds: ids });
    if (!report.publishable) return { ok: false, errors: [...ruleErrors(report), "Buka paket untuk melengkapi sesuai aturan."] };
    if (unpublishedIds.length > 0 && !input.publishQuestions) {
      return {
        ok: false,
        errors: [`${unpublishedIds.length} soal di paket ini belum tayang (draf / menunggu tinjauan).`],
        unpublishedCount: unpublishedIds.length,
      };
    }
    toPublish = unpublishedIds;
  }
  await db.transaction(async (tx) => {
    if (toPublish.length > 0) await tx.update(questions).set({ status: "published" }).where(inArray(questions.id, toPublish));
    await tx.update(testPackages).set({ status: input.status }).where(eq(testPackages.id, input.id));
  });
  invalidatePackageCache();
  revalidatePath("/admin/paket-tes");
  if (toPublish.length > 0) revalidatePath("/admin/soal");
  return { ok: true };
}

export async function deletePackageAction(id: number): Promise<ActionResult> {
  if (!(await getAdminSession())) return NOT_ADMIN;
  try {
    await db.delete(testPackages).where(eq(testPackages.id, id));
  } catch (error) {
    if (isFkError(error)) {
      return { ok: false, errors: ["Paket ini sudah punya percobaan siswa — tidak bisa dihapus. Jadikan draft saja."] };
    }
    throw error;
  }
  invalidatePackageCache();
  revalidatePath("/admin/paket-tes");
  return { ok: true };
}

export async function setEntitlementAction(input: { userId: number; testPackageId: number; granted: boolean }): Promise<ActionResult> {
  const session = await getAdminSession();
  if (!session) return NOT_ADMIN;
  if (input.granted) {
    await db
      .insert(entitlements)
      .values({ userId: input.userId, testPackageId: input.testPackageId, grantedByUserId: Number(session.user.id) })
      .onDuplicateKeyUpdate({ set: { grantedAt: new Date() } });
  } else {
    await db
      .delete(entitlements)
      .where(and(eq(entitlements.userId, input.userId), eq(entitlements.testPackageId, input.testPackageId)));
  }
  invalidatePackageCache();
  revalidatePath(`/admin/paket-tes/${input.testPackageId}`);
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function searchUsersAction(query: string) {
  if (!(await getAdminSession())) return [];
  return searchUsersQuery(query);
}

/** Ubah akses paket: Gratis (semua siswa) atau Premium (pelanggan Premium jenjangnya). */
export async function setPackagePremiumAction(input: { id: number; isPremium: boolean }): Promise<ActionResult> {
  if (!(await getAdminSession())) return NOT_ADMIN;
  if (!Number.isInteger(input.id) || input.id <= 0 || typeof input.isPremium !== "boolean") return { ok: false, errors: ["Data tidak valid."] };
  await db.update(testPackages).set({ isPremium: input.isPremium }).where(eq(testPackages.id, input.id));
  invalidatePackageCache();
  revalidatePath("/admin/paket-tes");
  revalidatePath("/dashboard");
  return { ok: true };
}
