// Helper sesi untuk Server Component, Route Handler, dan Server Action.
// Layout boleh memakai requireUser/requireAdmin untuk redirect, tapi SETIAP
// action/route yang mengubah data tetap wajib cek sendiri (layout tidak
// dijalankan ulang di setiap navigasi client).

import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { safeRedirectPath } from "@/lib/redirect";
import { auth, type Role, type Session } from "./index";

/** Sesi aktif (di-cache per request). */
export const getSession = cache(async (): Promise<Session | null> => {
  return auth.api.getSession({ headers: await headers() });
});

export function homeFor(role: Role | string | null | undefined) {
  return role === "admin" ? "/admin" : "/dashboard";
}

/** Wajib login; kalau belum, arahkan ke /masuk lalu kembali ke `returnTo`. */
export async function requireUser(returnTo: string) {
  const session = await getSession();
  if (!session) redirect(`/masuk?next=${encodeURIComponent(safeRedirectPath(returnTo, "/dashboard"))}`);
  return session;
}

/** Wajib admin; siswa yang mencoba diarahkan ke dashboard-nya. */
export async function requireAdmin(returnTo = "/admin") {
  const session = await requireUser(returnTo);
  if (session.user.role !== "admin") redirect("/dashboard");
  return session;
}

/** Untuk server action/route: kembalikan sesi admin atau null (tanpa redirect). */
export async function getAdminSession() {
  const session = await getSession();
  return session?.user.role === "admin" ? session : null;
}
