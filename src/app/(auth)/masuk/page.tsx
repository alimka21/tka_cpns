import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { safeRedirectPath } from "@/lib/redirect";
import { getSession, homeFor } from "@/server/auth/session";

export const metadata: Metadata = { title: "Masuk" };

export default async function MasukPage({ searchParams }: PageProps<"/masuk">) {
  const { next } = await searchParams;
  const nextPath = typeof next === "string" ? safeRedirectPath(next, "") || undefined : undefined;
  // Sudah login → langsung ke tujuan.
  const session = await getSession();
  if (session) redirect(nextPath ?? homeFor(session.user.role));
  return <AuthForm mode="signin" next={nextPath} />;
}
