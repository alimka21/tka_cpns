"use client";

import { useEffect, useRef, useState } from "react";
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

  return (
    <div
      role="timer"
      aria-label="Sisa waktu"
      className={cn(
        "rounded-md border px-3 py-1.5 font-mono text-lg tabular-nums",
        left <= 5 * 60_000 && "border-destructive/50 bg-destructive/10 text-destructive",
      )}
    >
      {formatDuration(left)}
    </div>
  );
}
