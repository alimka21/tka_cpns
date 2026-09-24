import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Proyek sudah punya CLAUDE.md sendiri (lihat root) — jangan ditimpa/ditambah otomatis oleh `next dev`.
  agentRules: false,
  poweredByHeader: false,
  experimental: {
    // Upload import soal lewat server action (maks. 5 MB, lihat IMPORT_MAX_BYTES).
    serverActions: { bodySizeLimit: "6mb" },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
