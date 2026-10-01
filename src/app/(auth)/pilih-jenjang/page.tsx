import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { JenjangForm } from "@/components/profile/jenjang-form";
import { safeRedirectPath } from "@/lib/redirect";
import { getSession, homeFor } from "@/server/auth/session";

export const metadata: Metadata = { title: "Pilih Jenjang" };
export const dynamic = "force-dynamic";

// Onboarding akun lama yang belum punya jenjang (akun baru memilih saat daftar).
export default async function PilihJenjangPage({ searchParams }: PageProps<"/pilih-jenjang">) {
  const session = await getSession();
  if (!session) redirect("/masuk");
  const { next } = await searchParams;
  const target = safeRedirectPath(typeof next === "string" ? next : undefined, homeFor(session.user.role));
  if (session.user.role === "admin" || session.user.jenjang) redirect(target);
  if (session.user.status !== "active") redirect("/menunggu-konfirmasi");

  return (
    <div className="surface-card flex flex-col gap-6 p-6 shadow-lg sm:p-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <Logo />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pilih jenjangmu</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Setiap jenjang punya soal & kerangka asesmen TKA yang berbeda. Paket tes dan latihan akan menyesuaikan pilihanmu —
            bisa diganti nanti di Pengaturan.
          </p>
        </div>
      </div>
      <JenjangForm current={null} next={target} submitLabel="Lanjut" />
    </div>
  );
}
