"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, KeyRound, LoaderCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteGeminiKeyAction, saveGeminiKeyAction } from "@/server/actions/ai-settings";

export function GeminiKeyForm({ masked }: { masked: string | null }) {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: true; masked?: string } | { ok: false; error: string }>, success: string) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error);
      else {
        setKey("");
        setMessage(success);
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {masked ? (
        <p className="flex items-center gap-2 rounded-lg border border-success/40 bg-success-soft px-4 py-3 text-sm text-success-strong">
          <CircleCheck className="size-4 shrink-0" aria-hidden /> Key tersimpan: <code className="font-mono font-semibold">{masked}</code>
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">Belum ada key tersimpan.</p>
      )}
      <form
        className="flex flex-col gap-3 sm:max-w-md"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => saveGeminiKeyAction(key), "Key valid dan tersimpan.");
        }}
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="gemini-key">{masked ? "Ganti API key" : "API key"}</Label>
          <Input
            id="gemini-key"
            type="password"
            autoComplete="off"
            spellCheck={false}
            placeholder="AIza… atau AQ.…"
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={pending || key.trim().length === 0}>
            {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : <KeyRound aria-hidden />}
            {pending ? "Memeriksa key…" : "Uji & simpan"}
          </Button>
          {masked && (
            <Button type="button" variant="outline" disabled={pending} onClick={() => run(deleteGeminiKeyAction, "Key dihapus.")}>
              <Trash2 aria-hidden /> Hapus key
            </Button>
          )}
        </div>
      </form>
      {error && (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive-soft px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-sm text-success-strong">
          {message}
        </p>
      )}
    </div>
  );
}
