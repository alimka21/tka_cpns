// Gambar pratinjau lead magnet — publik. URL memuat `?v=<updated_at>` (previewImagePath),
// jadi isinya tidak pernah berubah untuk URL yang sama → cache publik panjang.

import { getLeadMagnetMeta, getLeadMagnetPreview } from "@/server/services/lead-magnets";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: RouteContext<"/materi/[slug]/pratinjau">) {
  const meta = await getLeadMagnetMeta((await params).slug);
  if (!meta?.isActive) return new Response("Not found", { status: 404 });
  const image = await getLeadMagnetPreview(meta);
  if (!image) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(image.data), {
    headers: {
      "content-type": image.mime,
      "content-length": String(image.data.length),
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
    },
  });
}
