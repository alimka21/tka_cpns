// Proxy (Next 16, dulu "middleware"): tangkap utm_* di halaman mana pun → cookie
// atribusi `pk_attr` (lib/attribution). Request tanpa utm_* langsung diteruskan.
// Gagal apa pun → tetap diteruskan; atribusi tidak boleh mengganggu halaman.

import { NextResponse, type NextRequest } from "next/server";
import {
  ATTRIBUTION_COOKIE,
  ATTRIBUTION_MAX_AGE,
  mergeAttribution,
  parseAttribution,
  serializeAttribution,
  touchFromSearchParams,
} from "@/lib/attribution";

export function proxy(request: NextRequest) {
  const { searchParams, pathname } = request.nextUrl;
  if (![...searchParams.keys()].some((k) => k.startsWith("utm_"))) return NextResponse.next();
  const response = NextResponse.next();
  try {
    const touch = touchFromSearchParams(searchParams, pathname);
    if (!touch) return response;
    const existing = parseAttribution(request.cookies.get(ATTRIBUTION_COOKIE)?.value);
    response.cookies.set(ATTRIBUTION_COOKIE, serializeAttribution(mergeAttribution(existing, touch)), {
      maxAge: ATTRIBUTION_MAX_AGE,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  } catch (e) {
    console.error("[attribution] gagal menyimpan cookie:", e instanceof Error ? e.message : e);
  }
  return response;
}

export const config = {
  // Halaman saja — bukan API, aset Next, gambar soal, atau file statis (ada titik di path).
  matcher: ["/((?!api/|_next/|gambar/|.*\\.[a-zA-Z0-9]+$).*)"],
};
