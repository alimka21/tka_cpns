// Sajikan gambar galeri soal dari DB. Hanya untuk user yang login (siswa saat
// ujian/pembahasan, admin di panel). Isi gambar tidak pernah berubah untuk id
// yang sama → cache panjang di browser.

import { getSession } from "@/server/auth/session";
import { getQuestionImage } from "@/server/services/question-images";

export async function GET(_req: Request, { params }: RouteContext<"/gambar/[id]">) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) return new Response("Not found", { status: 404 });
  if (!(await getSession())) return new Response("Unauthorized", { status: 401 });

  const image = await getQuestionImage(id);
  if (!image) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(image.data), {
    headers: {
      "content-type": image.mime,
      "content-length": String(image.data.length),
      "cache-control": "private, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
    },
  });
}
