// Prisma 7 CLI konfigürasyonu (migrate/generate/studio için).
// .env otomatik yüklenmediği için dotenv burada elle çağrılır — Next.js
// runtime'ında (lib/db/client.ts) buna gerek yoktur, Next.js .env'i kendisi okur.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
