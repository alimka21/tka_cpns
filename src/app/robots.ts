import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/dashboard",
        "/pengaturan",
        "/langganan",
        "/tes",
        "/hasil",
        "/progres",
        "/riwayat",
        "/latihan",
        "/gambar",
        "/api",
        "/pilih-jenjang",
        "/menunggu-konfirmasi",
        "/atur-ulang-kata-sandi",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
