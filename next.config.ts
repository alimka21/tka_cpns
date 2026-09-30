import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Proyek sudah punya CLAUDE.md sendiri (lihat root) — jangan ditimpa/ditambah otomatis oleh `next dev`.
  agentRules: false,
  poweredByHeader: false,
  experimental: {
    // Upload lewat server action: import Excel (maks. 5 MB, IMPORT_MAX_BYTES) &
    // gambar soal satu per satu (maks. 10 MB sebelum dikompres, MAX_UPLOAD_BYTES).
    serverActions: { bodySizeLimit: "11mb" },
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
