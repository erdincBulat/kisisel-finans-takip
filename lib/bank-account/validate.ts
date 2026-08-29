import { formatKurus } from "@/lib/money";
import type { ParsedAccountStatement } from "./types";

export type AccountValidationResult = { valid: boolean; warnings: string[] };

const TOLERANCE_KURUS = 1;

/**
 * Dönem başı bakiyesinden başlayıp her satırı sırayla uygulayarak PDF'in
 * kendi "Bakiye" kolonuyla karşılaştırır — kredi kartı ekstresinin mutabakat
 * kontrolüyle aynı felsefe (spec §17): uyumsuzluk import'u ENGELLEMEZ,
 * sadece önizlemede uyarı gösterilir.
 */
export function validateParsedAccountStatement(statement: ParsedAccountStatement): AccountValidationResult {
  const warnings: string[] = [];

  if (statement.lines.length === 0) {
    warnings.push("Ekstrede hiç hareket bulunamadı.");
  }

  let running = statement.openingBalance;
  for (const line of statement.lines) {
    running += line.isOutgoing ? -line.amount : line.amount;
    if (Math.abs(running - line.balanceAfter) > TOLERANCE_KURUS) {
      warnings.push(
        `"${line.description}" satırından sonra beklenen bakiye tutmuyor: hesaplanan ${formatKurus(running)}, ekstrede ${formatKurus(line.balanceAfter)}.`,
      );
      running = line.balanceAfter; // sonraki satırların hepsini yanlış göstermemek için PDF'in kendi değerine dönülür.
    }
  }

  if (Math.abs(running - statement.closingBalance) > TOLERANCE_KURUS) {
    warnings.push(
      `Hesaplanan dönem sonu bakiyesi (${formatKurus(running)}) ekstrenin belirttiği dönem sonu bakiyesiyle (${formatKurus(statement.closingBalance)}) uyuşmuyor.`,
    );
  }

  return { valid: true, warnings };
}
