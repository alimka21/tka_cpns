"use client";

import { useState, useSyncExternalStore } from "react";
import { Copy, ExternalLink, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

// Browser bawaan Instagram/Facebook (webview): kebijakan Google melarang login OAuth di
// webview ("403 disallowed_useragent"); emulasi UA di Chrome desktop tidak diblokir, jadi
// perilaku di aplikasi asli belum dipastikan. Tampilkan cara membuka halaman yang sama — lengkap
// dengan ?next= dan utm_* — di browser biasa. Deteksi lewat user agent di client.

type InApp = { app: "Instagram" | "Facebook"; android: boolean } | null;

const noop = () => () => {};

function detect(ua: string): InApp {
  const android = /Android/i.test(ua);
  if (/Instagram/i.test(ua)) return { app: "Instagram", android };
  if (/FBAN|FBAV|FB_IAB|FB4A|FBIOS/i.test(ua)) return { app: "Facebook", android };
  return null;
}

let cached: { ua: string; value: InApp } | null = null;
function snapshot(): InApp {
  const ua = navigator.userAgent;
  if (cached?.ua !== ua) cached = { ua, value: detect(ua) };
  return cached.value;
}

export function InAppBrowserNotice({ googleEnabled }: { googleEnabled: boolean }) {
  const inApp = useSyncExternalStore(noop, snapshot, () => null);
  const [copied, setCopied] = useState(false);
  if (!inApp) return null;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      window.prompt("Salin link ini lalu buka di Chrome/Safari:", window.location.href);
    }
  }

  // Android: intent:// membuka Chrome langsung (URL sama, termasuk ?next= & utm_*).
  const intentUrl = inApp.android
    ? `intent://${window.location.host}${window.location.pathname}${window.location.search}#Intent;scheme=https;package=com.android.chrome;end`
    : null;

  return (
    <div role="note" className="mt-6 flex flex-col gap-3 rounded-lg border border-warning/40 bg-warning-soft px-3 py-3 text-sm text-warning-strong">
      <p className="flex gap-2">
        <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>
          Kamu membuka halaman ini dari browser {inApp.app}.{" "}
          {googleEnabled ? "Login dengan Google mungkin tidak bisa dipakai di sini. " : ""}
          Daftar/masuk dengan username tetap bisa, atau buka di browser: ketuk <strong>⋯</strong> di pojok kanan atas, lalu pilih{" "}
          <strong>Buka di browser</strong> / <strong>Open in external browser</strong>.
        </span>
      </p>
      <div className="flex flex-wrap gap-2">
        {intentUrl && (
          <Button size="sm" nativeButton={false} render={<a href={intentUrl} />}>
            <ExternalLink aria-hidden /> Buka di Chrome
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={copyLink}>
          <Copy aria-hidden /> {copied ? "Link tersalin" : "Salin link"}
        </Button>
      </div>
    </div>
  );
}
