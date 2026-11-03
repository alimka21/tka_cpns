"use client";

import { useSyncExternalStore, type ComponentProps } from "react";
import Link from "next/link";
import { withUtm } from "@/lib/attribution";

// Link internal yang membawa utm_* dari URL sekarang (lib/attribution.withUtm), supaya
// atribusi tetap tercatat bila pengguna pindah ke browser lain di tengah jalan.
// Render server memakai href asli; utm_* ditambahkan setelah hidrasi.

function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

/** Query halaman sekarang ("" saat render server). */
export function useCurrentSearch() {
  return useSyncExternalStore(
    subscribe,
    () => window.location.search,
    () => "",
  );
}

export function UtmLink({ href, ...props }: Omit<ComponentProps<typeof Link>, "href"> & { href: string }) {
  const search = useCurrentSearch();
  return <Link href={search ? withUtm(href, search) : href} {...props} />;
}
