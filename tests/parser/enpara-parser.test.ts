import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { EnparaParser } from "@/lib/pdf/parsers/enpara-parser";

describe("EnparaParser.canParse", () => {
  it("Enpara ekstre metnini tanır", () => {
    expect(EnparaParser.canParse("Enpara Bank A.Ş. ... Ekstre tarihi 05/08/2026")).toBe(true);
  });

  it("alakasız bir metni reddeder", () => {
    expect(EnparaParser.canParse("Garanti BBVA kredi kartı ekstresi")).toBe(false);
  });
});

describe("EnparaParser.parse — gerçek PDF dosyası üzerinden uçtan uca", () => {
  it("docs/ altındaki gerçek Enpara PDF'ini baştan sona doğru ayrıştırır", async () => {
    const pdfPath = join(
      import.meta.dirname,
      "..",
      "..",
      "docs",
      "05.08.2026 tarihli Enpara.com Kredi Kartı ekstreniz.pdf",
    );
    const buffer = readFileSync(pdfPath);

    const parsed = await EnparaParser.parse(buffer);

    expect(parsed.year).toBe(2026);
    expect(parsed.month).toBe(8);
    expect(parsed.transactions).toHaveLength(37);
    expect(parsed.reconciliation?.total).toBe(2511681);
  });
});
