"use client";

import "./globals.css";
import { ErrorScreen } from "@/components/errors/error-screen";

// Error di root layout sendiri (pengganti halaman bawaan "This page couldn't load").
export default function GlobalError({ error }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="id">
      <body className="min-h-full bg-background font-sans text-foreground antialiased">
        <ErrorScreen error={error} reset={() => location.reload()} />
      </body>
    </html>
  );
}
