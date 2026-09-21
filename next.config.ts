import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Proyek sudah punya CLAUDE.md sendiri (lihat root) — jangan ditimpa/ditambah otomatis oleh `next dev`.
  agentRules: false,
};

export default nextConfig;
