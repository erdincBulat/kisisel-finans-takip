import path from "node:path";

/** `DATABASE_URL` ("file:./data/finance.db") → mutlak dosya sistemi yolu. Veri Yönetimi sayfası ve indirme route'u paylaşır. */
export function getDatabaseFilePath(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL tanımlı değil.");
  return path.resolve(/* turbopackIgnore: true */ process.cwd(), url.replace(/^file:/, ""));
}
