import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { safeRedirectPath } from "@/lib/redirect";
import { normalizeReferralCode } from "@/lib/referral";
import { isGoogleEnabled } from "@/server/auth";
import { getSession, homeFor } from "@/server/auth/session";

export const metadata: Metadata = { title: "Daftar Akun" };

export default async function DaftarPage({ searchParams }: PageProps<"/daftar">) {
  const { next } = await searchParams;
  const nextPath = typeof next === "string" ? safeRedirectPath(next, "") || undefined : undefined;
  // Sudah login → langsung ke tujuan.
  const session = await getSession();
  if (session) redirect(nextPath ?? homeFor(session.user.role));
  const { error, ref } = await searchParams;
  return (
    <AuthForm
      mode="signup"
      next={nextPath}
      googleEnabled={isGoogleEnabled}
      oauthError={typeof error === "string" ? error : undefined}
      referralCode={typeof ref === "string" ? normalizeReferralCode(ref) : undefined}
    />
  );
}
