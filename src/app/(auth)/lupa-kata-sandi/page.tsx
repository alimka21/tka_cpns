import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { KeyRound } from "lucide-react";
import { AdminWhatsAppHelp } from "@/components/auth/admin-whatsapp-help";
import { ForgotPasswordForm } from "@/components/auth/password-reset-forms";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { getSession, homeFor } from "@/server/auth/session";
import { getSetting } from "@/server/services/app-settings";
import { isMailConfigured } from "@/server/services/mailer";

export const metadata: Metadata = { title: "Lupa Kata Sandi" };
export const dynamic = "force-dynamic";

export default async function LupaKataSandiPage() {
  const session = await getSession();
  if (session) redirect(homeFor(session.user.role));
  const adminWhatsapp = await getSetting("support.whatsapp");
  const help = adminWhatsapp ? <AdminWhatsAppHelp phone={adminWhatsapp} emailAvailable={isMailConfigured()} /> : null;
  if (isMailConfigured()) return <ForgotPasswordForm>{help}</ForgotPasswordForm>;
  // SMTP belum diisi (WORKFLOW §10) → arahkan ke admin.
  return (
    <div className="surface-card flex flex-col items-center gap-5 p-6 text-center shadow-lg sm:p-8">
      <Logo />
      <span className="flex size-14 items-center justify-center rounded-full bg-primary-soft text-primary">
        <KeyRound className="size-7" aria-hidden />
      </span>
      <div>
        <h1 className="text-xl font-bold">Lupa kata sandi?</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Admin bisa mengatur ulang kata sandimu. Bila akunmu memakai email Gmail, kamu juga bisa langsung masuk dengan Google.
        </p>
      </div>
      {help ?? <p className="text-sm text-muted-foreground">Hubungi admin atau gurumu agar kata sandimu diatur ulang.</p>}
      <Button variant={help ? "ghost" : "default"} nativeButton={false} render={<Link href="/masuk" />}>
        Kembali ke masuk
      </Button>
    </div>
  );
}
