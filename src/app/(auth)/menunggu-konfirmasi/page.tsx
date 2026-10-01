import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Clock, XCircle } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Logo } from "@/components/brand/logo";
import { getSession, homeFor } from "@/server/auth/session";

export const metadata: Metadata = { title: "Menunggu Konfirmasi" };
export const dynamic = "force-dynamic";

export default async function MenungguKonfirmasiPage() {
  const session = await getSession();
  if (!session) redirect("/masuk");
  if (session.user.role === "admin" || session.user.status === "active") redirect(homeFor(session.user.role));
  const rejected = session.user.status === "rejected";

  return (
    <div className="surface-card flex flex-col items-center gap-5 p-6 text-center shadow-lg sm:p-8">
      <Logo />
      <span className={`flex size-14 items-center justify-center rounded-full ${rejected ? "bg-destructive-soft text-destructive" : "bg-warning-soft text-warning-strong"}`}>
        {rejected ? <XCircle className="size-7" aria-hidden /> : <Clock className="size-7" aria-hidden />}
      </span>
      <div>
        <h1 className="text-xl font-bold">{rejected ? "Pendaftaran tidak disetujui" : "Akunmu sedang menunggu konfirmasi"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {rejected
            ? "Admin belum dapat menyetujui pendaftaran akun ini. Hubungi pihak sekolah/penyelenggara bila menurutmu ini keliru."
            : `Halo ${session.user.name}, pendaftaranmu sudah kami terima. Admin akan memeriksa dan mengaktifkan akunmu — coba masuk lagi nanti.`}
        </p>
        <p className="mt-3 text-xs text-muted-foreground">{session.user.email}</p>
      </div>
      <SignOutButton className="border" />
    </div>
  );
}
