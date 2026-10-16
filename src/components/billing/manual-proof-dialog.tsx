"use client";

import { useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatWaNumber, manualProofMessage, waLink, type ManualProofInfo } from "@/lib/manual-payment";

/** Tombol "Saya sudah transfer" → popup berisi pesan formal yang dikirim ke WhatsApp admin bersama bukti transfer. */
export function ManualProofDialog({ info }: { info: ManualProofInfo }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(info.name);
  const [province, setProvince] = useState(info.province);
  const [school, setSchool] = useState(info.school);
  const complete = name.trim() && province.trim() && school.trim();
  const message = manualProofMessage({ ...info, name: name.trim(), province: province.trim(), school: school.trim() });

  return (
    <>
      <Button size="lg" variant="cta" className="w-full" onClick={() => setOpen(true)}>
        <Send aria-hidden /> Saya sudah transfer
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="max-h-[90dvh] overflow-y-auto data-[size=default]:max-w-md data-[size=default]:sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">Kirim bukti transfer ke admin</AlertDialogTitle>
            <AlertDialogDescription>
              Tekan tombol di bawah, WhatsApp admin ({formatWaNumber()}) akan terbuka dengan pesan siap kirim.{" "}
              <strong className="text-foreground">Lampirkan screenshot bukti transfer</strong> sebelum mengirim. Premium aktif setelah admin
              memverifikasi pembayaranmu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-3 text-sm">
            <label className="flex flex-col gap-1 text-xs font-semibold">
              Nama lengkap
              <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold">
              Asal provinsi
              <Input value={province} onChange={(e) => setProvince(e.target.value)} maxLength={64} />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold">
              Nama sekolah
              <Input value={school} onChange={(e) => setSchool(e.target.value)} maxLength={150} />
            </label>
            <div>
              <p className="mb-1 text-xs font-semibold">Pratinjau pesan</p>
              <pre className="rounded-lg bg-muted p-3 font-sans text-xs whitespace-pre-wrap">{message}</pre>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Tutup</AlertDialogCancel>
            <Button
              variant="cta"
              disabled={!complete}
              nativeButton={false}
              render={<a href={complete ? waLink(message) : undefined} target="_blank" rel="noopener noreferrer" />}
            >
              <MessageCircle aria-hidden /> Kirim via WhatsApp
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
