// Unduh file backup (khusus admin).

import { Readable } from "node:stream";
import { getAdminSession } from "@/server/auth/session";
import { backupReadStream, listBackups, safeBackupName } from "@/server/services/db-backup";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: RouteContext<"/api/admin/backup/[name]">) {
  if (!(await getAdminSession())) return new Response("Unauthorized", { status: 401 });
  const name = safeBackupName((await params).name);
  const file = name ? (await listBackups()).find((f) => f.name === name) : undefined;
  if (!name || !file) return new Response("Not found", { status: 404 });
  return new Response(Readable.toWeb(backupReadStream(name)) as ReadableStream, {
    headers: {
      "content-type": "application/gzip",
      "content-length": String(file.sizeBytes),
      "content-disposition": `attachment; filename="${name}"`,
      "cache-control": "no-store",
    },
  });
}
