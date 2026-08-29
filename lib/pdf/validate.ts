import { formatKurus } from "@/lib/money";
import type { ParsedStatement, ValidationIssue, ValidationResult } from "./types";

const TOLERANCE_KURUS = 1;

function sumBy(statement: ParsedStatement, predicate: (t: ParsedStatement["transactions"][number]) => boolean) {
  return statement.transactions.filter(predicate).reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Ekstre header'ındaki mutabakat formülüyle çıkarılan işlemlerin toplamlarını
 * karşılaştırır (spec §17: "PDF içerisindeki toplamları transaction olarak
 * yanlışlıkla eklememeli" riskine karşı ana güvenlik ağı). Uyumsuzluk import'u
 * ENGELLEMEZ (severity: "warning") — kullanıcı önizlemede uyarılır.
 */
export function validateParsedStatement(statement: ParsedStatement): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (statement.transactions.length === 0) {
    issues.push({ severity: "error", message: "Ekstrede hiç işlem bulunamadı." });
  }

  if (!statement.reconciliation) {
    issues.push({
      severity: "warning",
      message: "Ekstre mutabakat toplamları okunamadı, toplam doğrulaması yapılamadı.",
    });
  } else {
    const purchases = sumBy(statement, (t) => t.type !== "PAYMENT" && !t.isBankFee);
    const fees = sumBy(statement, (t) => t.isBankFee);
    const payments = sumBy(statement, (t) => t.type === "PAYMENT");

    checkTotal(issues, "Harcamalar ve yansıyan taksitler", purchases, statement.reconciliation.purchasesAndInstallments);
    checkTotal(issues, "Faiz, vergi ve ücretler", fees, statement.reconciliation.feesAndInterest);
    checkTotal(issues, "Ödemeler", payments, statement.reconciliation.payments);
  }

  const duplicateFingerprints = findDuplicateFingerprints(statement);
  if (duplicateFingerprints > 0) {
    issues.push({
      severity: "warning",
      message: `${duplicateFingerprints} işlem, aynı tarih/açıklama/tutara sahip başka bir işlemle birebir aynı görünüyor.`,
    });
  }

  return { valid: !issues.some((i) => i.severity === "error"), issues };
}

function checkTotal(issues: ValidationIssue[], label: string, computed: number, expected: number) {
  if (Math.abs(computed - expected) > TOLERANCE_KURUS) {
    issues.push({
      severity: "warning",
      message: `"${label}" toplamı tutmuyor: ekstrede ${formatKurus(expected)}, çıkarılan işlemlerde ${formatKurus(computed)}.`,
    });
  }
}

function findDuplicateFingerprints(statement: ParsedStatement): number {
  const seen = new Set<string>();
  let duplicates = 0;
  for (const t of statement.transactions) {
    const key = [t.date.toISOString().slice(0, 10), t.description.toLowerCase(), t.amount, t.installmentCurrent, t.installmentTotal].join("|");
    if (seen.has(key)) duplicates += 1;
    else seen.add(key);
  }
  return duplicates;
}
