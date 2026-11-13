// CSV komisi guru afiliasi (khusus admin) untuk rekap transfer bulanan.

import { getAdminSession } from "@/server/auth/session";
import { affiliateCommissionsForExport } from "@/server/services/affiliates";

export const dynamic = "force-dynamic";

const STATUS = { pending: "belum ditransfer", paid: "sudah ditransfer", void: "batal (refund)" } as const;

function cell(v: string | number | null | undefined) {
  const s = v == null ? "" : String(v);
  // Cegah formula injection di Excel/Sheets.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[",\n;]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

const iso = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

export async function GET() {
  if (!(await getAdminSession())) return new Response("Unauthorized", { status: 401 });
  const rows = await affiliateCommissionsForExport();
  const header = ["tanggal_lunas", "guru", "siswa", "kode_order", "nominal_dibayar", "persen", "komisi", "status", "siap_cair", "tanggal_transfer"];
  const lines = rows.map(({ c, student, teacher, orderCode }) =>
    [iso(c.createdAt), teacher, student, orderCode, c.orderAmount, c.percent, c.amount, STATUS[c.status], iso(c.availableAt), iso(c.paidAt)].map(cell).join(","),
  );
  const body = "﻿" + [header.join(","), ...lines].join("\n");
  return new Response(body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="komisi-afiliasi-${new Date().toISOString().slice(0, 10)}.csv"`,
      "cache-control": "no-store",
    },
  });
}
