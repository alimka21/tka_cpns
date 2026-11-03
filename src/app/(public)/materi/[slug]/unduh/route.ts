// Unduh file lead magnet. Materi wajib-login hanya untuk akun aktif; belum login →
// /daftar?next=/materi/<slug>. Setiap unduhan dicatat (lead_magnet_downloads).
// Isi file dari cache memori (services/lead-magnets) — tidak ada file di folder publik.

import { NextResponse } from "next/server";
import { getSession } from "@/server/auth/session";
import { getLeadMagnetFile, getLeadMagnetMeta, recordLeadMagnetDownload } from "@/server/services/lead-magnets";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: RouteContext<"/materi/[slug]/unduh">) {
  const { slug } = await params;
  const meta = await getLeadMagnetMeta(slug);
  if (!meta?.isActive) return new Response("Not found", { status: 404 });

  const session = await getSession();
  if (meta.requiresLogin) {
    const back = `/materi/${meta.slug}`;
    if (!session) return NextResponse.redirect(new URL(`/daftar?next=${encodeURIComponent(back)}`, req.url), 303);
    if (session.user.role !== "admin" && session.user.status !== "active") return NextResponse.redirect(new URL("/menunggu-konfirmasi", req.url), 303);
  }

  const data = await getLeadMagnetFile(meta);
  if (!data) return new Response("Not found", { status: 404 });
  await recordLeadMagnetDownload(meta.id, session ? Number(session.user.id) : null);

  return new Response(new Uint8Array(data), {
    headers: {
      "content-type": meta.fileMime,
      "content-length": String(data.length),
      "content-disposition": `attachment; filename="${meta.fileName}"`,
      // Setiap unduhan harus sampai ke server supaya tercatat.
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
