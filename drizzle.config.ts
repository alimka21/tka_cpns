import { defineConfig } from "drizzle-kit";

// Pastikan DATABASE_URL dari .env terbaca saat `db:migrate`/`db:generate`.
try {
  process.loadEnvFile();
} catch {
  // .env tidak ada (mis. di server yang memakai env hosting) — abaikan.
}

export default defineConfig({
  schema: "./src/server/db/schema",
  out: "./src/server/db/migrations",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
