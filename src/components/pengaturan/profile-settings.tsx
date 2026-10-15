// Isi halaman profil & API key — dipakai /pengaturan (siswa) dan
// /admin/profil (admin, di dalam panel admin dengan sidebar).

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GeminiKeyForm } from "@/components/pengaturan/gemini-key-form";
import { ContactForm } from "@/components/profile/contact-form";
import { JenjangForm } from "@/components/profile/jenjang-form";
import { visibleEmail } from "@/lib/identity";
import { NameForm } from "@/components/profile/name-form";
import { PasswordForm } from "@/components/profile/password-form";

type Props = {
  user: { name: string; email: string; username?: string | null; phone?: string | null; role?: string | null; jenjang?: string | null };
  masked: string | null;
  hasPassword: boolean;
};

export function ProfileSettings({ user, masked, hasPassword }: Props) {
  return (
    <>
      <Card>
      <CardHeader>
        <CardTitle>Profil</CardTitle>
        <CardDescription>Data akun dasar.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <NameForm current={user.name} />
        <ContactForm username={user.username ?? null} phone={user.phone ?? null} />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            defaultValue={visibleEmail(user.email) ?? ""}
            placeholder="Tidak ada email"
            disabled
          />
          <p className="text-xs text-muted-foreground">
            {visibleEmail(user.email) ? "Email juga bisa dipakai untuk masuk dan tidak bisa diubah." : "Akunmu tidak memakai email — masuk dengan username atau No. HP."}
          </p>
        </div>
        {user.role !== "admin" && (
          <div className="flex flex-col gap-1.5">
            <Label>Jenjang</Label>
            <p className="text-xs text-muted-foreground">Menentukan paket tes, soal, dan latihan yang tampil untukmu.</p>
            {user.jenjang ? (
              <>
                <Input value={`TKA ${user.jenjang}`} disabled />
                <p className="text-xs text-muted-foreground">Jenjang hanya bisa diganti oleh admin. Hubungi admin bila jenjangmu perlu diubah.</p>
              </>
            ) : (
              <JenjangForm current={null} />
            )}
          </div>
        )}
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Kata Sandi</CardTitle>
        <CardDescription>
          {hasPassword ? "Ganti kata sandi untuk masuk dengan username, No. HP, atau email." : "Buat kata sandi supaya bisa masuk dengan username, No. HP, atau email."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PasswordForm hasPassword={hasPassword} />
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Gemini API Key</CardTitle>
        <CardDescription>
          Dipakai untuk membuat soal dengan AI atas nama akunmu sendiri. Key diuji ke Google dulu, lalu disimpan
          terenkripsi dan hanya dipakai di server — tidak pernah ditampilkan penuh lagi.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <GeminiKeyForm masked={masked} />
        <details className="text-sm text-muted-foreground">
          <summary className="cursor-pointer font-semibold text-foreground">Cara membuat API key (gratis)</summary>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>
              Buka{" "}
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="font-semibold text-primary underline">
                Google AI Studio → API keys
              </a>{" "}
              dan masuk dengan akun Google.
            </li>
            <li>Klik &ldquo;Create API key&rdquo;, lalu salin key-nya.</li>
            <li>Tempel di kolom di atas, lalu klik &ldquo;Uji &amp; simpan&rdquo;.</li>
          </ol>
        </details>
      </CardContent>
    </Card>
    </>
  );
}
