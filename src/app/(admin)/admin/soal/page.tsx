import type { Metadata } from "next";

export const metadata: Metadata = { title: "Soal — Admin" };

export default function AdminSoalPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Soal</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Segera hadir — CRUD soal manual, import Excel, dan generate via AI
        (Fase 1 & 2).
      </p>
    </div>
  );
}
