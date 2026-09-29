"use server";

// Mutasi Paket Tes & Entitlement (admin). Setiap action cek sesi admin dan
// memvalidasi ulang input dengan Zod — jangan percaya susunan soal dari
// client begitu saja (dicek lagi lewat validatePackageOrder terhadap bank
// soal published di server).

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getAdminSession } from "@/server/auth/session";
import { db } from "@/server/db";
import { entitlements, questions, testPackageQuestions, testPackages } from "@/server/db/schema";
import { searchUsers as searchUsersQuery } from "@/server/queries/packages";
import { validatePackageOrder, type ComposableQuestion } from "@/server/services/package-composition";
import { testPackageInput } from "@/lib/validation/test-package";

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

/** Simpan paket baru (id kosong) atau perbarui yang ada. */
export async function savePackageAction(input: unknown & { id?: number }): Promise<ActionResult<{ id: number }>> {
  const session = await getAdminSession();
  if (!session) return NOT_ADMIN;

  const parsed = testPackageInput.safeParse(input);
  if (!parsed.success) return { ok: false, errors: [...new Set(parsed.error.issues.map((i) => i.message))] };
  const p = parsed.data;
  const id = typeof (input as { id?: unknown }).id === "number" ? (input as { id: number }).id : undefined;

  if (p.status === "published" && p.questions.length > 0) {
    const bank = await publishedBank();
    const orderErrors = validatePackageOrder(
      p.questions.map((q) => q.questionId),
      bank,
    );
    if (orderErrors.length > 0) return { ok: false, errors: orderErrors };
    const publishedIds = new Set(bank.map((b) => b.id));
    const notPublished = p.questions.filter((q) => !publishedIds.has(q.questionId));
    if (notPublished.length > 0) {
      return { ok: false, errors: [`${notPublished.length} soal belum berstatus tayang — terbitkan dulu di Bank Soal.`] };
    }
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

  revalidatePath("/admin/paket-tes");
  revalidatePath(`/admin/paket-tes/${savedId}`);
  return { ok: true, id: savedId };
}

export async function updatePackageStatusAction(input: { id: number; status: "draft" | "published" }): Promise<ActionResult> {
  if (!(await getAdminSession())) return NOT_ADMIN;
  if (input.status === "published") {
    const rows = await db
      .select({ questionId: testPackageQuestions.questionId })
      .from(testPackageQuestions)
      .where(eq(testPackageQuestions.testPackageId, input.id));
    if (rows.length === 0) return { ok: false, errors: ["Paket belum berisi soal — tidak bisa diterbitkan."] };
    const bank = await publishedBank();
    const orderErrors = validatePackageOrder(
      rows.map((r) => r.questionId),
      bank,
    );
    if (orderErrors.length > 0) return { ok: false, errors: orderErrors };
  }
  await db.update(testPackages).set({ status: input.status }).where(eq(testPackages.id, input.id));
  revalidatePath("/admin/paket-tes");
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
  revalidatePath(`/admin/paket-tes/${input.testPackageId}`);
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function searchUsersAction(query: string) {
  if (!(await getAdminSession())) return [];
  return searchUsersQuery(query);
}
