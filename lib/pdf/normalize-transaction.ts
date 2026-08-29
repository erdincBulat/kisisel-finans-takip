import { parseTLToKurus } from "@/lib/money";
import type { ParsedTransaction, ParsedTransactionType } from "./types";

/**
 * Bir satırın işlem satırı olup olmadığını anlamak için kullanılan ana desen:
 * Enpara ekstresinde her gerçek işlem "GG/AA/YYYY Açıklama [Taksit] Tutar TL"
 * şeklinde TEK satıra düşüyor (gerçek PDF üzerinde doğrulandı). Tutarın önünde
 * işlem bir ödeme/iade ise "- " işareti bulunabiliyor.
 */
const TRANSACTION_LINE = /^(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+(-\s*)?(\d{1,3}(?:\.\d{3})*,\d{2})\s*TL$/;

/**
 * Taksit token'ı — açıklamanın SONUNDA ayrı bir "N/M" öbeği olarak
 * görüneceği varsayılıyor (spec §22 örneği: "Apple 6.000 TL 3/6").
 *
 * ⚠️ VARSAYIM: Elimizdeki gerçek örnek ekstrede hiç taksitli işlem yok,
 * bu yüzden gerçek metin çıktısındaki taksit gösterimi doğrulanamadı.
 * Yeni bir taksitli ekstre örneği geldiğinde bu fonksiyon gözden geçirilmeli
 * (bkz. mimari plan RISKS #1, docs/PHASES.md Faz 4).
 */
const INSTALLMENT_SUFFIX = /\s+(\d{1,2})\/(\d{1,2})$/;

const BANK_FEE_PATTERNS = [/alışveriş faizi/i, /kkdf/i, /bsmv/i, /gecikme faizi/i, /nakit avans faizi/i];

/** Banka tarafından uygulanan faiz/vergi/ücret satırlarını (gerçek merchant değil) tanır. */
export function isBankFeeLine(description: string): boolean {
  return BANK_FEE_PATTERNS.some((pattern) => pattern.test(description));
}

export function classifyTransactionType(
  description: string,
  isNegativeAmount: boolean,
): ParsedTransactionType {
  if (/^Ödeme\b/i.test(description.trim())) return "PAYMENT";
  if (isNegativeAmount) return "REFUND";
  return "EXPENSE";
}

export function extractInstallmentToken(description: string): {
  description: string;
  installmentCurrent: number | null;
  installmentTotal: number | null;
} {
  const match = description.match(INSTALLMENT_SUFFIX);
  if (!match) {
    return { description, installmentCurrent: null, installmentTotal: null };
  }

  const current = Number(match[1]);
  const total = Number(match[2]);

  // Sağlıksız bir eşleşmeyi (ör. merchant adının parçası) taksit sanmayalım.
  if (current < 1 || total < 1 || current > total || total > 36) {
    return { description, installmentCurrent: null, installmentTotal: null };
  }

  return {
    description: description.slice(0, match.index).trim(),
    installmentCurrent: current,
    installmentTotal: total,
  };
}

function parseTransactionDate(raw: string): Date {
  const [day, month, year] = raw.split("/").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Tek bir metin satırını ParsedTransaction'a çevirir. Satır bir işlem satırı
 * değilse (özet/başlık/footer satırı vb.) null döner — çağıran taraf bu
 * satırları sessizce atlamalıdır.
 */
export function parseTransactionLine(line: string): ParsedTransaction | null {
  const trimmed = line.trim();
  const match = trimmed.match(TRANSACTION_LINE);
  if (!match) return null;

  const [, dateRaw, rawDescription, negativeSign, amountRaw] = match;
  const description = rawDescription.trim();
  if (description.length === 0) return null;

  const { description: cleanDescription, installmentCurrent, installmentTotal } =
    extractInstallmentToken(description);

  const isNegativeAmount = Boolean(negativeSign);
  const amount = parseTLToKurus(amountRaw);

  return {
    date: parseTransactionDate(dateRaw),
    description: cleanDescription,
    amount,
    type: classifyTransactionType(cleanDescription, isNegativeAmount),
    installmentCurrent,
    installmentTotal,
    isBankFee: isBankFeeLine(cleanDescription),
  };
}
