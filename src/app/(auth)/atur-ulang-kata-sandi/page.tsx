import type { Metadata } from "next";
import { InvalidResetLink, ResetPasswordForm } from "@/components/auth/password-reset-forms";

export const metadata: Metadata = { title: "Atur Ulang Kata Sandi" };
export const dynamic = "force-dynamic";

// Tujuan tautan email: Better Auth memvalidasi token lalu mengalihkan ke sini
// dengan ?token=… (berlaku) atau ?error=INVALID_TOKEN.
export default async function AturUlangKataSandiPage({ searchParams }: PageProps<"/atur-ulang-kata-sandi">) {
  const { token, error } = await searchParams;
  if (error || typeof token !== "string" || !token) return <InvalidResetLink />;
  return <ResetPasswordForm token={token} />;
}
