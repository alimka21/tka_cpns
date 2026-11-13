"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { addAffiliateInput, affiliateCodeInput } from "@/lib/affiliate";
import { getAdminSession } from "@/server/auth/session";
import { addAffiliate, deleteAffiliateInvite, setAffiliateCode, setAffiliateStatus, updateAffiliate } from "@/server/services/affiliates";
import { setSetting } from "@/server/services/app-settings";

type Result = { ok: true; message?: string } | { ok: false; error: string };
const NOT_ADMIN = { ok: false as const, error: "Sesi admin berakhir. Silakan masuk lagi." };
const id = z.number().int().positive();

function refresh() {
  revalidatePath("/admin/afiliasi");
  revalidatePath("/afiliasi");
  revalidatePath("/admin/users");
}

export async function addAffiliateAction(input: unknown): Promise<Result> {
  const session = await getAdminSession();
  if (!session) return NOT_ADMIN;
  const parsed = addAffiliateInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  const r = await addAffiliate(Number(session.user.id), parsed.data);
  if (!r.ok) return r;
  refresh();
  return {
    ok: true,
    message:
      r.status === "active"
        ? "Akun sudah ada — afiliasi langsung aktif dan Premium gratis diberikan."
        : "Undangan dibuat. Afiliasi aktif otomatis saat guru mendaftar dengan email ini.",
  };
}

export async function setAffiliateStatusAction(input: unknown): Promise<Result> {
  const session = await getAdminSession();
  if (!session) return NOT_ADMIN;
  const parsed = z.object({ id, status: z.enum(["active", "suspended"]) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Data tidak valid." };
  const r = await setAffiliateStatus(Number(session.user.id), parsed.data.id, parsed.data.status);
  if (!r.ok) return r;
  refresh();
  return { ok: true, message: parsed.data.status === "active" ? "Afiliasi diaktifkan." : "Afiliasi dinonaktifkan; Premium gratis dicabut." };
}

export async function setAffiliateCodeAction(input: unknown): Promise<Result> {
  if (!(await getAdminSession())) return NOT_ADMIN;
  const parsed = z.object({ id, code: affiliateCodeInput }).safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Kode tidak valid." };
  const r = await setAffiliateCode(parsed.data.id, parsed.data.code);
  if (!r.ok) return r;
  refresh();
  return { ok: true, message: `Kode diganti menjadi ${parsed.data.code}.` };
}

export async function updateAffiliateAction(input: unknown): Promise<Result> {
  if (!(await getAdminSession())) return NOT_ADMIN;
  const parsed = z
    .object({
      id,
      commissionPercent: z.union([z.literal(""), z.coerce.number().int().min(0).max(60)]).transform((v) => (v === "" ? null : v)),
      school: z.string().trim().max(150).transform((v) => v || null),
      phone: z.string().trim().max(20).transform((v) => v.replace(/[\s-]/g, "") || null),
      note: z.string().trim().max(500).transform((v) => v || null),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  const { id: affiliateId, ...patch } = parsed.data;
  await updateAffiliate(affiliateId, patch);
  refresh();
  return { ok: true, message: "Tersimpan." };
}

export async function deleteAffiliateInviteAction(affiliateId: unknown): Promise<Result> {
  if (!(await getAdminSession())) return NOT_ADMIN;
  const parsed = id.safeParse(affiliateId);
  if (!parsed.success) return { ok: false, error: "Data tidak valid." };
  const r = await deleteAffiliateInvite(parsed.data);
  if (!r.ok) return r;
  refresh();
  return { ok: true, message: "Undangan dihapus." };
}

/** Persen komisi default & diskon siswa — berlaku untuk order berikutnya. */
export async function setAffiliateSettingsAction(input: unknown): Promise<Result> {
  const session = await getAdminSession();
  if (!session) return NOT_ADMIN;
  const parsed = z.object({ percent: z.coerce.number().int().min(0).max(60), discount: z.coerce.number().int().min(0).max(50) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Komisi 0–60%, diskon 0–50%." };
  const adminId = Number(session.user.id);
  await setSetting("affiliate.commissionPercent", parsed.data.percent, adminId);
  await setSetting("affiliate.buyerDiscountPercent", parsed.data.discount, adminId);
  refresh();
  revalidatePath("/langganan");
  return { ok: true, message: `Komisi ${parsed.data.percent}%, diskon siswa ${parsed.data.discount}% — berlaku untuk pembayaran berikutnya.` };
}
