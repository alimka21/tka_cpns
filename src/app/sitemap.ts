import type { MetadataRoute } from "next";
import { JENJANG_SLUGS, absoluteUrl, jenjangPath, subjectPath } from "@/lib/seo";
import { FRAMEWORKS } from "@/server/asesmen";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const materi = Object.values(JENJANG_SLUGS).flatMap((code) => [
    { url: absoluteUrl(jenjangPath(code)), lastModified: now, changeFrequency: "weekly" as const, priority: 0.9 },
    ...FRAMEWORKS[code].subjects.map((s) => ({
      url: absoluteUrl(subjectPath(code, s)),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: s.type === "wajib" ? 0.8 : 0.6,
    })),
  ]);
  return [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    ...materi,
    { url: absoluteUrl("/syarat"), changeFrequency: "yearly", priority: 0.2 },
    { url: absoluteUrl("/privasi"), changeFrequency: "yearly", priority: 0.2 },
  ];
}
