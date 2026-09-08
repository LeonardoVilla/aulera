import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations run against Neon's unpooled connection (DIRECT_URL).
    // The app's runtime client uses the pooled DATABASE_URL via the pg adapter (see src/lib/prisma.ts).
    url: env("DIRECT_URL"),
  },
});
