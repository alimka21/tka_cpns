import type { Metadata } from "next";

export const metadata: Metadata = { title: "Topik & Subtopik — Admin" };

export default function AdminTopikPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Topik & Subtopik</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Segera hadir — CRUD Kategori, Topik, dan Subtopik (Fase 1).
      </p>
    </div>
  );
}
