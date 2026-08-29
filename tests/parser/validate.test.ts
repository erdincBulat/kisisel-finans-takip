import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseEnparaStatementText } from "@/lib/pdf/parse-statement";
import { validateParsedStatement } from "@/lib/pdf/validate";

const realText = readFileSync(join(import.meta.dirname, "fixtures", "enpara-2026-08-real.txt"), "utf-8");

describe("validateParsedStatement", () => {
  it("gerçek ekstrede hiç sorun bulmaz (toplamlar tam eşleşiyor)", () => {
    const parsed = parseEnparaStatementText(realText);
    const result = validateParsedStatement(parsed);
    expect(result).toEqual({ valid: true, issues: [] });
  });

  it("hiç işlem yoksa error seviyesinde uyarı verir ve valid=false olur", () => {
    const parsed = parseEnparaStatementText(
      "Ekstre tarihi 05/08/2026\nBir sonraki ekstrenizin tarihi 05/09/2026, son ödeme tarihi ise 15/09/2026'dır.\n",
    );
    const result = validateParsedStatement(parsed);
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual({ severity: "error", message: "Ekstrede hiç işlem bulunamadı." });
  });

  it("işlem toplamı header ile uyuşmazsa uyarı verir ama import'u engellemez (valid=true)", () => {
    // Gerçek metni bozarak bir harcama satırının tutarını değiştiriyoruz.
    const corrupted = realText.replace("05/07/2026 MERVE MARKET 140,00 TL", "05/07/2026 MERVE MARKET 999,00 TL");
    const parsed = parseEnparaStatementText(corrupted);
    const result = validateParsedStatement(parsed);

    expect(result.valid).toBe(true);
    expect(result.issues.some((i) => i.message.includes("Harcamalar ve yansıyan taksitler"))).toBe(true);
  });

  it("tam olarak aynı tarih/açıklama/tutara sahip iki işlem varsa uyarır", () => {
    const parsed = parseEnparaStatementText(
      [
        "Ekstre tarihi 05/08/2026",
        "İşlem tarihi Açıklama Taksit Tutar",
        "10/07/2026 TEST MARKET 100,00 TL",
        "10/07/2026 TEST MARKET 100,00 TL",
      ].join("\n"),
    );
    const result = validateParsedStatement(parsed);
    expect(result.issues.some((i) => i.message.includes("birebir aynı"))).toBe(true);
  });
});
