import fs from "node:fs/promises";
import { NextResponse } from "next/server";
import { getDatabaseFilePath } from "@/lib/db/backup";

export async function GET() {
  const filePath = getDatabaseFilePath();
  const buffer = await fs.readFile(filePath);
  const dateStamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="finans-yedek-${dateStamp}.db"`,
    },
  });
}
