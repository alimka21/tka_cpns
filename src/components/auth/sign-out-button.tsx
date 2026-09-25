"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export function SignOutButton({ className, withLabel = true }: { className?: string; withLabel?: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      disabled={pending}
      aria-label="Keluar"
      onClick={async () => {
        setPending(true);
        await authClient.signOut();
        router.replace("/masuk");
        router.refresh();
      }}
      className={cn(
        "flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/25 focus-visible:outline-none disabled:opacity-50",
        className,
      )}
    >
      <LogOut className="size-4" aria-hidden />
      {withLabel && <span>{pending ? "Keluar…" : "Keluar"}</span>}
    </button>
  );
}
