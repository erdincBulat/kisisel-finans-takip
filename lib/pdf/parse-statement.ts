import { parseTLToKurus } from "@/lib/money";
import { parseTransactionLine } from "./normalize-transaction";
import type { ParsedStatement, ParsedTransaction, ReconciliationTotals } from "./types";

const DATE_TOKEN = /(\d{2})\/(\d{2})\/(\d{4})/;
const AMOUNT_TOKEN = /\d{1,3}(?:\.\d{3})*,\d{2}/;

/**
 * Mutabakat formülü değerlerinin bulunduğu satır: art arda TAM OLARAK 6 adet
 * "X,XX TL" öbeği. Bu satır, "Bir önceki ekstre borcu - Ödemeler + Harcamalar
 * ve yansıyan taksitler + Nakit avans + Faiz/vergi/ücret = Ekstre borcu"
 * formülünün (spec §6 / gerçek PDF header'ı) sayısal karşılığıdır.
 */
const RECONCILIATION_LINE = new RegExp(`^(?:${AMOUNT_TOKEN.source}\\s*TL\\s*){6}$`);

function toDate(day: string, month: string, year: string): Date {
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
}

export function extractStatementDate(text: string): Date | null {
  const match = text.match(new RegExp(`Ekstre tarihi\\s+${DATE_TOKEN.source}`));
  if (!match) return null;
  return toDate(match[1], match[2], match[3]);
}

export function extractNextStatementDate(text: string): Date | null {
  const match = text.match(new RegExp(`Bir sonraki ekstrenizin tarihi\\s+${DATE_TOKEN.source}`));
  if (!match) return null;
  return toDate(match[1], match[2], match[3]);
}

export function extractReconciliationTotals(text: string): ReconciliationTotals | null {
  const line = text.split("\n").map((l) => l.trim()).find((l) => RECONCILIATION_LINE.test(l));
  if (!line) return null;

  const values = line.match(new RegExp(AMOUNT_TOKEN.source, "g"));
  if (!values || values.length !== 6) return null;

  const [previousBalance, payments, purchasesAndInstallments, cashAdvance, feesAndInterest, total] =
    values.map(parseTLToKurus);

  return { previousBalance, payments, purchasesAndInstallments, cashAdvance, feesAndInterest, total };
}

/**
 * Ham metindeki her satırı dener; yalnızca GG/AA/YYYY ile başlayan satırlar
 * gerçek işlem satırı olabilir (sayfa başlığı/footer/özet satırları bu
 * kalıba hiç uymuyor — gerçek PDF üzerinde doğrulandı, bkz. tests/parser).
 */
export function extractTransactions(text: string): ParsedTransaction[] {
  return text
    .split("\n")
    .map((line) => parseTransactionLine(line))
    .filter((tx): tx is ParsedTransaction => tx !== null);
}

/**
 * Enpara ekstre metnini tam bir ParsedStatement'a çevirir.
 *
 * periodStart, ekstre üzerinde açıkça yazmadığı için transaction'ların en
 * erken tarihinden türetilir (spec'in kendisi de bu alanı belirtmiyor —
 * bkz. mimari plan RISKS #3). Hiç transaction bulunamazsa (örn. bozuk PDF)
 * statementDate'den 1 ay geriye gidilerek kaba bir tahmin yapılır.
 */
export function parseEnparaStatementText(text: string): ParsedStatement {
  const statementDate = extractStatementDate(text);
  if (!statementDate) {
    throw new Error("Ekstre tarihi bulunamadı — bu dosya geçerli bir Enpara ekstresi olmayabilir.");
  }

  const transactions = extractTransactions(text);
  const nextStatementDate = extractNextStatementDate(text);
  const reconciliation = extractReconciliationTotals(text);

  const periodStart =
    transactions.length > 0
      ? new Date(Math.min(...transactions.map((t) => t.date.getTime())))
      : new Date(Date.UTC(statementDate.getUTCFullYear(), statementDate.getUTCMonth() - 1, statementDate.getUTCDate()));

  return {
    statementDate,
    nextStatementDate,
    periodStart,
    periodEnd: statementDate,
    year: statementDate.getUTCFullYear(),
    month: statementDate.getUTCMonth() + 1,
    previousBalance: reconciliation?.previousBalance ?? null,
    reconciliation,
    transactions,
  };
}
