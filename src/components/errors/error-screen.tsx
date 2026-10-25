"use client";

import { useEffect, useState } from "react";
import { unstable_isUnrecognizedActionError } from "next/navigation";
import { AlertTriangle, LayoutDashboard, RotateCw } from "lucide-react";

/** Muat ulang otomatis paling sering sekali per halaman per menit (hindari loop bila error menetap). */
const RELOAD_GUARD_MS = 60_000;
const guardKey = () => `pakartka:auto-reload:${location.pathname}`;

/**
 * Error di luar dugaan. Kasus tersering: siswa masih membuka halaman versi lama setelah deploy →
 * ID server action berubah ("Failed to find Server Action") atau file JS lama hilang. Memuat ulang
 * halaman langsung memperbaikinya, jadi coba sekali otomatis; bila tetap gagal, tampilkan pesan.
 */
export function ErrorScreen({ error, reset }: { error: Error & { digest?: string }; reset?: () => void }) {
  const [reloading, setReloading] = useState(true);

  useEffect(() => {
    let last = 0;
    try {
      last = Number(sessionStorage.getItem(guardKey()) ?? 0);
    } catch {
      // sessionStorage diblokir — anggap belum pernah dimuat ulang
    }
    if (Date.now() - last > RELOAD_GUARD_MS) {
      try {
        sessionStorage.setItem(guardKey(), String(Date.now()));
      } catch {}
      location.reload();
      return;
    }
    console.error(error);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- keputusan bergantung pada sessionStorage (hanya di browser)
    setReloading(false);
  }, [error]);

  const message = String(error?.message ?? "");
  const newVersion = unstable_isUnrecognizedActionError(error) || /ChunkLoadError|Loading chunk|dynamically imported module|Server Action/i.test(message);

  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      {reloading ? (
        <>
          <RotateCw className="size-10 animate-spin text-primary" aria-hidden />
          <p className="text-muted-foreground">{newVersion ? "Pakar TKA baru saja diperbarui. Memuat versi terbaru…" : "Memuat ulang halaman…"}</p>
        </>
      ) : (
        <>
          <AlertTriangle className="size-12 text-warning" aria-hidden />
          <h1 className="text-xl font-bold">Halaman gagal dimuat</h1>
          <p className="text-muted-foreground">
            {newVersion
              ? "Pakar TKA baru saja diperbarui. Muat ulang halaman untuk memakai versi terbaru."
              : "Terjadi kendala di server. Coba muat ulang; bila masih terjadi, kirim kode di bawah ke admin."}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => (reset ? reset() : location.reload())}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <RotateCw className="size-4" aria-hidden /> Muat ulang
            </button>
            <a href="/dashboard" className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-muted">
              <LayoutDashboard className="size-4" aria-hidden /> Ke Dashboard
            </a>
          </div>
          {error.digest && <p className="font-mono text-xs text-muted-foreground">Kode: {error.digest}</p>}
        </>
      )}
    </div>
  );
}
