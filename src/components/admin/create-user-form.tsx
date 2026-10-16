"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, Copy, Dices, Eye, EyeOff, LoaderCircle, UserPlus, X } from "lucide-react";
import { JenjangPicker } from "@/components/profile/jenjang-picker";
import { ProvinceSelect } from "@/components/profile/province-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Jenjang } from "@/lib/jenjang";
import { createUserAction } from "@/server/actions/users";

/** Kata sandi acak mudah dibacakan (tanpa huruf/angka yang mirip: 0/O, 1/l/I). */
function randomPassword() {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint32Array(10));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

/** Admin membuatkan akun siswa: nama, username, No. HP & email (opsional), jenjang, kata sandi awal. */
export function CreateUserForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [province, setProvince] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [email, setEmail] = useState("");
  const [jenjang, setJenjang] = useState<Jenjang | null>(null);
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ username: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const reset = () => {
    setName("");
    setUsername("");
    setPhone("");
    setProvince("");
    setSchoolName("");
    setEmail("");
    setJenjang(null);
    setPassword("");
    setShow(false);
    setError(null);
  };

  if (!open) {
    return (
      <Button className="w-fit" onClick={() => { setOpen(true); setCreated(null); }}>
        <UserPlus aria-hidden /> Tambah user
      </Button>
    );
  }

  return (
    <section className="surface-card flex flex-col gap-5 p-5 sm:p-6" aria-labelledby="tambah-user">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="tambah-user" className="text-lg font-bold">
            Tambah akun siswa
          </h2>
          <p className="text-sm text-muted-foreground">
            Akun langsung aktif. Berikan username &amp; kata sandi awal ke siswa — siswa bisa masuk dengan username,
            No. HP, atau email, dan mengganti kata sandi di Pengaturan.
          </p>
        </div>
        <Button variant="ghost" size="sm" aria-label="Tutup" onClick={() => { setOpen(false); reset(); setCreated(null); }}>
          <X aria-hidden />
        </Button>
      </div>

      {created && (
        <div role="status" className="flex flex-col gap-2 rounded-xl bg-success/15 p-4 text-sm">
          <span className="flex items-center gap-2 font-semibold text-success-strong">
            <CircleCheck className="size-4" aria-hidden /> Akun dibuat.
          </span>
          <span>
            Username: <strong>{created.username}</strong> · Kata sandi: <code className="rounded bg-card px-1.5 py-0.5">{created.password}</code>
          </span>
          <span className="text-xs text-muted-foreground">
            Kata sandi ini hanya tampil sekarang — salin dan berikan ke siswa. Sistem tidak menyimpan kata sandi dalam bentuk teks.
          </span>
          <Button
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={async () => {
              await navigator.clipboard.writeText(`Username: ${created.username}\nKata sandi: ${created.password}`);
              setCopied(true);
            }}
          >
            <Copy aria-hidden /> {copied ? "Tersalin" : "Salin username & kata sandi"}
          </Button>
        </div>
      )}

      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          if (!jenjang) return setError("Pilih jenjang siswa.");
          startTransition(async () => {
            const r = await createUserAction({ name, username, phone, province, schoolName, email, jenjang, password });
            if (!r.ok) return setError(r.error);
            setCreated({ username: username.trim().toLowerCase(), password });
            setCopied(false);
            reset();
            router.refresh();
          });
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-user-name">Nama lengkap</Label>
            <Input id="new-user-name" value={name} maxLength={100} autoComplete="off" required onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-user-username">Username</Label>
            <Input
              id="new-user-username"
              value={username}
              maxLength={20}
              autoComplete="off"
              autoCapitalize="none"
              placeholder="Contoh: rina.k"
              required
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-user-phone">No. HP / WhatsApp (opsional)</Label>
            <Input id="new-user-phone" type="tel" value={phone} placeholder="Boleh nomor orang tua" autoComplete="off" onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-user-province">Asal provinsi (opsional)</Label>
            <ProvinceSelect id="new-user-province" value={province} onChange={setProvince} allowEmpty />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-user-school">Nama sekolah (opsional)</Label>
            <Input id="new-user-school" value={schoolName} maxLength={150} autoComplete="off" onChange={(e) => setSchoolName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-user-email">Email (opsional)</Label>
            <Input id="new-user-email" type="email" value={email} maxLength={255} autoComplete="off" onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Jenjang</Label>
          <JenjangPicker value={jenjang} onChange={setJenjang} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-user-password">Kata sandi awal</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Input
                id="new-user-password"
                type={show ? "text" : "password"}
                value={password}
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                required
                className="pr-10"
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
              >
                {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
              </button>
            </div>
            <Button type="button" variant="outline" onClick={() => { setPassword(randomPassword()); setShow(true); }}>
              <Dices aria-hidden /> Buat acak
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Minimal 8 karakter.</p>
        </div>

        {error && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" className="w-fit" disabled={pending}>
          {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : <UserPlus aria-hidden />} Buat akun
        </Button>
      </form>
    </section>
  );
}
