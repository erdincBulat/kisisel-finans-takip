export type ParsedTransactionType = "EXPENSE" | "REFUND" | "PAYMENT";

export type ParsedTransaction = {
  date: Date;
  description: string;
  amount: number; // kuruş, her zaman pozitif
  type: ParsedTransactionType;
  installmentCurrent: number | null;
  installmentTotal: number | null;
  isBankFee: boolean;
};

/** Ekstre üzerindeki mutabakat formülü satırının 6 alanı (spec §6 header). */
export type ReconciliationTotals = {
  previousBalance: number; // kuruş
  payments: number;
  purchasesAndInstallments: number;
  cashAdvance: number;
  feesAndInterest: number;
  total: number;
};

export type ParsedStatement = {
  statementDate: Date; // "Ekstre tarihi"
  nextStatementDate: Date | null;
  periodStart: Date; // min(transaction.date) — bkz. lib/pdf/parse-statement.ts
  periodEnd: Date; // statementDate ile aynı
  year: number;
  month: number; // 1-12, statementDate'e göre
  previousBalance: number | null; // kuruş
  reconciliation: ReconciliationTotals | null;
  transactions: ParsedTransaction[];
};

export type ValidationIssue = {
  severity: "error" | "warning";
  message: string;
};

export type ValidationResult = {
  valid: boolean; // false ise import engellenmeli (error seviyesinde sorun var)
  issues: ValidationIssue[];
};

/** İleride farklı bankalar için ayrı parser'lar eklenebilmesi için (spec §68). */
export interface StatementParser {
  canParse(text: string): boolean;
  parse(pdfBuffer: Buffer): Promise<ParsedStatement>;
}
