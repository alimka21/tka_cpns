"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, Info, Lock, Mail, User, type LucideIcon } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInInput, signUpInput } from "@/lib/validation/auth";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";
type Errors = Partial<Record<string, string>>;

const copy = {
  signin: {
    title: "Masuk ke Akun",
    subtitle: "Masukkan email dan kata sandi untuk melanjutkan latihan.",
    submit: "Masuk",
    switchText: "Belum punya akun?",
    switchLabel: "Daftar sekarang",
    switchHref: "/daftar",
  },
  signup: {
    title: "Buat Akun Baru",
    subtitle: "Daftar gratis untuk mulai latihan TKA dan lihat analisis kelemahanmu.",
    submit: "Daftar Sekarang",
    switchText: "Sudah punya akun?",
    switchLabel: "Masuk",
    switchHref: "/masuk",
  },
};

export function AuthForm({ mode }: { mode: Mode }) {
  const [errors, setErrors] = useState<Errors>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const c = copy[mode];

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.currentTarget));
    const parsed = (mode === "signin" ? signInInput : signUpInput).safeParse(values);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        next[key] ??= issue.message;
      }
      setErrors(next);
      setNotice(null);
      return;
    }
    setErrors({});
    // TODO: panggil Better Auth (signIn.email / signUp.email) setelah auth di-setup.
    setNotice("Autentikasi belum aktif di versi pengembangan ini. Data kamu belum dikirim ke mana pun.");
  }

  return (
    <div className="surface-card p-6 shadow-lg sm:p-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <Logo />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{c.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{c.subtitle}</p>
        </div>
      </div>

      <form noValidate onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
        {mode === "signup" && (
          <Field id="name" label="Nama lengkap" icon={User} error={errors.name}>
            <Input id="name" name="name" autoComplete="name" placeholder="Contoh: Rina Kartika" className="pl-10" aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-error" : undefined} />
          </Field>
        )}
        <Field id="email" label="Alamat email" icon={Mail} error={errors.email}>
          <Input id="email" name="email" type="email" autoComplete="email" placeholder="nama@email.com" className="pl-10" aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined} />
        </Field>
        <Field
          id="password"
          label="Kata sandi"
          icon={Lock}
          error={errors.password}
          hint={mode === "signup" ? "Minimal 8 karakter, kombinasi huruf & angka." : undefined}
        >
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            placeholder={mode === "signin" ? "••••••••" : "Minimal 8 karakter"}
            className="px-10"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : mode === "signup" ? "password-hint" : undefined}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            className="absolute top-1/2 right-1 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/25"
          >
            {showPassword ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
          </button>
        </Field>
        {mode === "signup" && (
          <Field id="confirmPassword" label="Konfirmasi kata sandi" icon={Lock} error={errors.confirmPassword}>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Ulangi kata sandi"
              className="pl-10"
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
            />
          </Field>
        )}

        {notice && (
          <p role="status" className="flex gap-2 rounded-lg border border-primary/20 bg-primary-soft px-3 py-2.5 text-sm text-primary">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden /> {notice}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full">
          {c.submit} <ArrowRight aria-hidden />
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> atau <span className="h-px flex-1 bg-border" />
      </div>
      <Button variant="outline" size="lg" className="w-full" disabled title="Login Google menyusul setelah email/password">
        <GoogleIcon /> {mode === "signin" ? "Masuk" : "Daftar"} dengan Google (segera)
      </Button>

      {mode === "signup" && (
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Dengan mendaftar, kamu setuju dengan Syarat & Ketentuan serta Kebijakan Privasi kami.
        </p>
      )}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {c.switchText}{" "}
        <Link href={c.switchHref} className="font-semibold text-primary hover:underline">
          {c.switchLabel}
        </Link>
      </p>
    </div>
  );
}

function Field({
  id,
  label,
  icon: Icon,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  icon: LucideIcon;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-sm font-semibold">
        {label}
      </Label>
      <div className="relative">
        <Icon
          className={cn("pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground", error && "text-destructive")}
          aria-hidden
        />
        {children}
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-xs text-muted-foreground">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.96 10.96 0 0 0 12 1 11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
    </svg>
  );
}
