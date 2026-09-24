"use client";

import { useEffect, useRef, useState } from "react";
import { AlarmClock, Clock } from "lucide-react";
import { formatDuration, remainingMs } from "@/lib/exam";
import { cn } from "@/lib/utils";

type Props = {
  /** ISO string `attempts.ends_at` dari server. */
  endsAt: string;
  /** Waktu server saat halaman dirender — untuk koreksi selisih jam client. */
  serverNow: string;
  onExpire: () => void;
};

export function ExamTimer({ endsAt, serverNow, onExpire }: Props) {
  const endsAtMs = new Date(endsAt).getTime();
  // Offset dihitung sekali saat mount: jam client yang salah tidak memengaruhi sisa waktu.
  const [offset] = useState(() => new Date(serverNow).getTime() - Date.now());
  const [left, setLeft] = useState(() => remainingMs(endsAtMs, Date.now() + offset));
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  });

  useEffect(() => {
    const tick = () => {
      const ms = remainingMs(endsAtMs, Date.now() + offset);
      setLeft(ms);
      if (ms === 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpireRef.current();
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAtMs, offset]);

  const critical = left <= 5 * 60_000;
  return (
    <div
      role="timer"
      aria-label="Sisa waktu"
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-1.5",
        critical
          ? "border-destructive/60 bg-destructive-soft text-destructive"
          : "border-transparent bg-primary-soft text-primary",
      )}
    >
      {/* Status kritis tidak hanya lewat warna: ikon + teks (docs/UI_UX.md §6). */}
      {critical ? <AlarmClock className="size-4 shrink-0 motion-safe:animate-pulse" aria-hidden /> : <Clock className="size-4 shrink-0" aria-hidden />}
      <span className="hidden text-xs font-semibold sm:inline">{critical ? "Waktu hampir habis" : "Sisa waktu"}</span>
      <span className="text-lg font-bold tabular-nums">{formatDuration(left)}</span>
    </div>
  );
}
