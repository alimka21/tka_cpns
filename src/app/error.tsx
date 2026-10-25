"use client";

import { ErrorScreen } from "@/components/errors/error-screen";

// Error halaman (di bawah root layout) → muat ulang otomatis sekali, lalu pesan berbahasa Indonesia.
export default function Error({ error }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorScreen error={error} reset={() => location.reload()} />;
}
