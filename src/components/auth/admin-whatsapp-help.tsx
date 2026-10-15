import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { whatsappLink } from "@/lib/identity";
import { SITE_NAME } from "@/lib/site";

const MESSAGE = `Halo admin ${SITE_NAME}, saya lupa kata sandi.
Nama lengkap:
Username:
No. HP terdaftar:
Jenjang & sekolah: `;

/**
 * Lupa kata sandi lewat admin: membuka WhatsApp admin dengan pesan terisi.
 * Admin mengirim kata sandi sementara HANYA ke No. HP yang tercatat di akun
 * (docs/DECISIONS.md 2026-10-15).
 */
export function AdminWhatsAppHelp({ phone, emailAvailable }: { phone: string; emailAvailable: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border bg-muted/40 p-4 text-center">
      <p className="text-sm text-muted-foreground">
        {emailAvailable ? "Daftar tanpa email atau tidak bisa membuka emailmu? " : ""}
        Hubungi admin lewat WhatsApp. Kata sandi baru dikirim ke <strong className="text-foreground">nomor HP yang terdaftar di akunmu</strong>.
      </p>
      <Button
        variant={emailAvailable ? "outline" : "default"}
        className="w-full sm:w-auto"
        nativeButton={false}
        render={<a href={whatsappLink(phone, MESSAGE)} target="_blank" rel="noreferrer" />}
      >
        <MessageCircle aria-hidden /> Hubungi Admin via WhatsApp
      </Button>
    </div>
  );
}
