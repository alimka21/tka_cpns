"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Info, Lock, Mail, MailCheck } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { forgotPasswordInput, resetPasswordInput } from "@/lib/validation/auth";
import { cn } from "@/lib/utils";

/** Halaman tujuan tautan di email (Better Auth menambahkan ?token=… atau ?error=INVALID_TOKEN). */
export const RESET_PAGE = "/atur-ulang-kata-sandi";

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <Logo />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

function Alert({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive-soft px-3 py-2.5 text-sm text-destructive">
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden /> {children}
    </p>
  );
}

function BackToSignIn() {
  return (
    <p className="mt-6 text-center text-sm">
      <Link href="/masuk" className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> Kembali ke halaman masuk
      </Link>
    </p>
  );
}

function rateLimited(status?: number) {
  return status === 429 ? "Terlalu banyak permintaan. Tunggu 15 menit lalu coba lagi." : null;
}

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = forgotPasswordInput.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Email tidak valid.");
      return;
    }
    setError(null);
    setNotice(null);
    setPending(true);
    const { error: err } = await authClient.requestPasswordReset({ email: parsed.data.email, redirectTo: RESET_PAGE });
    setPending(false);
    if (err) {
      setNotice(rateLimited(err.status) ?? "Gagal memproses. Coba lagi beberapa saat lagi.");
      return;
    }
    setSentTo(parsed.data.email);
  }

  if (sentTo) {
    return (
      <div className="surface-card flex flex-col items-center gap-5 p-6 text-center shadow-lg sm:p-8">
        <Logo />
        <span className="flex size-14 items-center justify-center rounded-full bg-success-soft text-success-strong">
          <MailCheck className="size-7" aria-hidden />
        </span>
        <div>
          <h1 className="text-xl font-bold">Cek email kamu</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Bila <span className="font-semibold text-foreground">{sentTo}</span> terdaftar, kami sudah mengirim tautan untuk mengatur ulang kata
            sandi. Tautan berlaku 1 jam.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">Tidak ada di kotak masuk? Periksa folder Spam/Promosi, atau coba kirim ulang.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="outline" onClick={() => setSentTo(null)}>
            Kirim ulang
          </Button>
          <Button nativeButton={false} render={<Link href="/masuk" />}>
            Kembali ke masuk
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="surface-card p-6 shadow-lg sm:p-8">
      <Header title="Lupa Kata Sandi" subtitle="Masukkan email akunmu. Kami kirim tautan untuk membuat kata sandi baru." />
      <form noValidate onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email" className="text-sm font-semibold">
            Alamat email
          </Label>
          <div className="relative">
            <Mail className={cn("pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground", error && "text-destructive")} aria-hidden />
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="nama@email.com"
              className="pl-10"
              aria-invalid={!!error}
              aria-describedby={error ? "email-error" : undefined}
            />
          </div>
          {error && (
            <p id="email-error" className="text-xs font-medium text-destructive">
              {error}
            </p>
          )}
        </div>
        {notice && <Alert>{notice}</Alert>}
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Mengirim…" : "Kirim tautan reset"} {!pending && <ArrowRight aria-hidden />}
        </Button>
      </form>
      <BackToSignIn />
    </div>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [errors, setErrors] = useState<Partial<Record<"password" | "confirmPassword", string>>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [show, setShow] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = resetPasswordInput.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) {
      const next: typeof errors = {};
      for (const issue of parsed.error.issues) next[issue.path[0] as keyof typeof errors] ??= issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    setNotice(null);
    setPending(true);
    const { error } = await authClient.resetPassword({ newPassword: parsed.data.password, token });
    if (error) {
      setPending(false);
      setNotice(
        error.code === "INVALID_TOKEN"
          ? "Tautan sudah kedaluwarsa atau sudah dipakai. Minta tautan baru."
          : (rateLimited(error.status) ?? "Gagal menyimpan kata sandi. Coba lagi."),
      );
      return;
    }
    router.replace("/masuk?reset=berhasil");
  }

  return (
    <div className="surface-card p-6 shadow-lg sm:p-8">
      <Header title="Buat Kata Sandi Baru" subtitle="Setelah disimpan, semua perangkat yang sedang masuk akan dikeluarkan." />
      <form noValidate onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
        {(
          [
            ["password", "Kata sandi baru", "Minimal 8 karakter, kombinasi huruf & angka."],
            ["confirmPassword", "Konfirmasi kata sandi", null],
          ] as const
        ).map(([id, label, hint]) => (
          <div key={id} className="flex flex-col gap-1.5">
            <Label htmlFor={id} className="text-sm font-semibold">
              {label}
            </Label>
            <div className="relative">
              <Lock className={cn("pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground", errors[id] && "text-destructive")} aria-hidden />
              <Input
                id={id}
                name={id}
                type={show ? "text" : "password"}
                autoComplete="new-password"
                placeholder={id === "password" ? "Minimal 8 karakter" : "Ulangi kata sandi"}
                className="px-10"
                aria-invalid={!!errors[id]}
                aria-describedby={errors[id] ? `${id}-error` : hint ? `${id}-hint` : undefined}
              />
              {id === "password" && (
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  className="absolute top-1/2 right-1 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/25"
                >
                  {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                </button>
              )}
            </div>
            {errors[id] ? (
              <p id={`${id}-error`} className="text-xs font-medium text-destructive">
                {errors[id]}
              </p>
            ) : (
              hint && (
                <p id={`${id}-hint`} className="text-xs text-muted-foreground">
                  {hint}
                </p>
              )
            )}
          </div>
        ))}
        {notice && (
          <Alert>
            {notice}{" "}
            {notice.startsWith("Tautan") && (
              <Link href="/lupa-kata-sandi" className="font-semibold underline">
                Minta tautan baru
              </Link>
            )}
          </Alert>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan kata sandi baru"} {!pending && <ArrowRight aria-hidden />}
        </Button>
      </form>
      <BackToSignIn />
    </div>
  );
}

export function InvalidResetLink() {
  return (
    <div className="surface-card flex flex-col items-center gap-5 p-6 text-center shadow-lg sm:p-8">
      <Logo />
      <div>
        <h1 className="text-xl font-bold">Tautan tidak berlaku</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tautan atur ulang kata sandi sudah kedaluwarsa (lebih dari 1 jam), sudah dipakai, atau tidak lengkap. Minta tautan baru.
        </p>
      </div>
      <Button nativeButton={false} render={<Link href="/lupa-kata-sandi" />}>
        Minta tautan baru <ArrowRight aria-hidden />
      </Button>
      <BackToSignIn />
    </div>
  );
}
